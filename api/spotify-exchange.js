import { isSiteOrigin, isThrottled } from './_guard.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSiteOrigin(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (isThrottled(req)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const code = req.body && req.body.code;
  if (typeof code !== 'string' || !code || code.length > 2048) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = process.env;

  const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI || 'https://cotoo.dev',
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Spotify error' });
    }

    const data = await response.json();

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in
    });
  } catch (error) {
    return res.status(500).json({ error: 'Spotify error' });
  }
}
