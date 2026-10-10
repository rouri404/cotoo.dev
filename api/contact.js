export default async function handler(req, res) {
  // 1. Method & Origin Validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const origin = req.headers.origin;
  const isDev = process.env.VERCEL_ENV !== 'production';
  const allowedOrigins = ['https://cotoo.dev', 'https://www.cotoo.dev'];
  
  if (!allowedOrigins.includes(origin) && (!isDev || origin !== 'http://localhost:3000')) {
    return res.status(403).json({ error: 'Erro de segurança: Origem não autorizada.' });
  }

  const { name, email, message, 'cf-turnstile-response': turnstileToken } = req.body || {};

  // 3. Data Validation & Sanitization
  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Nome inválido.' });
  }
  if (!email || typeof email !== 'string' || email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Mensagem inválida ou muito longa.' });
  }

  // Strip line breaks from name to prevent header injection in subject
  const sanitizedName = name.replace(/[\r\n]/g, '').trim();
  const subject = `Contato de ${sanitizedName}`;

  // 4. IP Extraction (DNS Only -> x-real-ip)
  const ip = req.headers['x-real-ip'] || '127.0.0.1';

  // 5. IP-Level Rate Limiting
  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
    });

    const ipLimit = parseInt(process.env.CONTACT_IP_RATE_LIMIT || '2', 10);
    const ipRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(ipLimit, '1 h'),
      analytics: false,
    });

    const { success: ipSuccess } = await ipRatelimit.limit(`contact_ip_v3_${ip}`);
    if (!ipSuccess) {
      return res.status(429).json({ error: 'Muitas tentativas, tente mais tarde' });
    }

    // 6. Turnstile Verification
    if (!turnstileToken) {
      return res.status(403).json({ error: 'Token inválido' });
    }

    const formData = new URLSearchParams();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
    formData.append('response', turnstileToken);
    formData.append('remoteip', ip);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const turnstileData = await turnstileRes.json();
    if (!turnstileData.success) {
      return res.status(403).json({ error: 'Falha na verificação de segurança' });
    }

    // Check hostname if in production
    const allowedHosts = ['cotoo.dev', 'www.cotoo.dev'];
    if (!isDev && !allowedHosts.includes(turnstileData.hostname)) {
      return res.status(403).json({ error: 'Origem inválida' });
    }

    // 7. Global Rate Limiting
    const globalLimit = parseInt(process.env.CONTACT_GLOBAL_RATE_LIMIT || '10', 10);
    const globalRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(globalLimit, '1 h'),
      analytics: false,
    });

    const { success: globalSuccess } = await globalRatelimit.limit(`contact_global`);
    if (!globalSuccess) {
      return res.status(429).json({ error: 'Serviço indisponível no momento' });
    }
  } catch (error) {
    // Fail-closed for Redis or Turnstile errors
    console.error('Security/KV Error:', error);
    return res.status(500).json({ error: 'Erro interno de validação' });
  }

  // 8. Email Dispatch
  const textBody = `Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`;
  const htmlBody = `
    <h3>Novo contato via cotoo.dev</h3>
    <p><strong>Nome:</strong> ${name}</p>
    <p><strong>E-mail:</strong> <a href="mailto:${email}">${email}</a></p>
    <br/>
    <p><strong>Mensagem:</strong></p>
    <p>${message.replace(/\n/g, '<br/>')}</p>
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `"${sanitizedName} (via cotoo.dev)" <${process.env.CONTACT_FROM_EMAIL || 'hi@cotoo.dev'}>`,
        to: process.env.CONTACT_TO_EMAIL,
        reply_to: email,
        subject: subject,
        text: textBody,
        html: htmlBody
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resendRes.ok) {
      const errorText = await resendRes.text();
      console.error('Resend Error:', errorText);
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Dispatch Error:', error);
    return res.status(500).json({ error: 'Não foi possível enviar' });
  }
}
