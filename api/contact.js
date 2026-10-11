function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const origin = req.headers.origin;
  const isDev = process.env.VERCEL_ENV === 'development';
  const allowedOrigins = ['https://cotoo.dev', 'https://www.cotoo.dev'];
  
  if (!allowedOrigins.includes(origin) && (!isDev || origin !== 'http://localhost:3000')) {
    return res.status(403).json({ error: 'Erro de segurança: Origem não autorizada.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { name, email, message, 'cf-turnstile-response': turnstileToken } = body;

  if (!name || typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Nome inválido.' });
  }
  if (!email || typeof email !== 'string' || email.length > 100 || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Mensagem inválida ou muito longa.' });
  }

  const sanitizedName = name.replace(/[\u0000-\u001f\u007f"<>\\]/g, '').trim();
  if (!sanitizedName) {
    return res.status(400).json({ error: 'Nome inválido.' });
  }
  const subject = `Contato de ${sanitizedName}`;

  const ip = req.headers['x-real-ip'] || '127.0.0.1';

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

    const allowedHosts = ['cotoo.dev', 'www.cotoo.dev'];
    if (!isDev && !allowedHosts.includes(turnstileData.hostname)) {
      return res.status(403).json({ error: 'Origem inválida' });
    }

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
    console.error('Security/KV Error:', error);
    return res.status(500).json({ error: 'Erro interno de validação' });
  }

  const safeName = escapeHtml(sanitizedName);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br/>');

  const textBody = `Nome: ${sanitizedName}\nE-mail: ${email}\n\nMensagem:\n${message}`;
  const htmlBody = `
    <h3>Novo contato via cotoo.dev</h3>
    <p><strong>Nome:</strong> ${safeName}</p>
    <p><strong>E-mail:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
    <br/>
    <p><strong>Mensagem:</strong></p>
    <p>${safeMessage}</p>
  `;

  const firstName = sanitizedName.split(' ')[0];
  const shortMsg = message.length > 80 ? message.substring(0, 77) + '...' : message;
  const ogUrl = `https://cotoo.dev/api/og?name=${encodeURIComponent(firstName)}&msg=${encodeURIComponent(shortMsg)}`;

  const autoReplyHtmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email de Gabriel Coto</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; text-align: center;">
    <a href="https://cotoo.dev" target="_blank" style="display: block; width: 100%; max-width: 600px; margin: 0 auto;">
        <img src="${ogUrl}" alt="Aviso do Sistema: Mensagem recebida" width="600" style="width: 100%; max-width: 600px; border: none; display: block;" />
    </a>
</body>
</html>
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const [resendRes, autoReplyRes] = await Promise.all([
      fetch('https://api.resend.com/emails', {
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
      }),

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"cotoo.dev" <${process.env.CONTACT_FROM_EMAIL || 'hi@cotoo.dev'}>`,
          to: email,
          subject: "recebi sua mensagem :p",
          text: "Recebi sua mensagem enviada através do meu site. Responderei em breve!",
          html: autoReplyHtmlBody
        }),
        signal: controller.signal,
      })
    ]);
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
