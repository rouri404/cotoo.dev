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

  const autoReplyHtmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email de Gabriel Coto</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Tiny5&display=swap" rel="stylesheet" />
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tiny5&display=swap');
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #121212; color: #8fbc8b; font-family: 'Tiny5', 'Courier New', Courier, monospace; letter-spacing: 0.05em; -webkit-font-smoothing: none;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #121212; padding: 100px 20px;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #121212; text-align: left;">
                    <tr>
                        <td style="font-size: 18px; color: #8fbc8b; opacity: 0.5; padding-bottom: 20px;">
                            // recebido
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 64px; line-height: 1.1; color: #8fbc8b; padding-bottom: 10px; font-weight: 400;">
                            Olá, ${sanitizedName.split(' ')[0]}
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size: 24px; color: #8fbc8b; opacity: 0.8; padding-bottom: 40px; margin: 0;">
                            Sua mensagem pousou na minha caixa de entrada!
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td width="10" valign="top" style="padding-top: 6px;">
                                        <div style="width: 10px; height: 10px; background-color: #8fbc8b; opacity: 0.8;"></div>
                                    </td>
                                    <td style="padding-left: 15px;">
                                        <div style="font-size: 20px; color: #8fbc8b; margin-bottom: 5px;">Aviso do Sistema</div>
                                        <div style="font-size: 16px; color: #8fbc8b; opacity: 0.55; line-height: 1.5; font-style: italic;">
                                            "${message.replace(/\n/g, '<br/>')}"
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 80px;">
                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="font-size: 18px; color: #8fbc8b; opacity: 0.5; padding-bottom: 15px;">
                                        // log
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <a href="https://cotoo.dev" style="font-size: 24px; color: #8fbc8b; text-decoration: none; border-bottom: 2px dashed #8fbc8b; padding-bottom: 4px; display: inline-block;">
                                            voltar_para_cotoo.dev
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const [resendRes, autoReplyRes] = await Promise.all([
      // 1. Email de notificação para o dono (Gabriel)
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
      // 2. Email de resposta automática para o remetente
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"Gabriel Couto" <${process.env.CONTACT_FROM_EMAIL || 'hi@cotoo.dev'}>`,
          to: email,
          subject: "Recebi sua mensagem! | cotoo.dev",
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
