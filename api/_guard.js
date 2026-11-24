import crypto from 'crypto';

const SITE_ORIGINS = ['https://cotoo.dev', 'https://www.cotoo.dev'];
const WINDOW_MS = 60 * 1000;
const MAX_HITS = 30;
const MAX_TRACKED_IPS = 5000;
const SEEN_SECONDS = 30 * 60;
const hits = new Map();

const clientIp = (req) => req.headers['x-real-ip'] || '127.0.0.1';

export function isSiteOrigin(req) {
  const { origin } = req.headers;
  if (SITE_ORIGINS.includes(origin)) return true;
  return process.env.VERCEL_ENV === 'development' && origin === 'http://localhost:3000';
}

// Per-instance limit that rejects a flood before it spends any Redis command
export function isThrottled(req) {
  const now = Date.now();
  const ip = clientIp(req);
  if (hits.size > MAX_TRACKED_IPS) hits.clear();
  const entry = hits.get(ip);
  if (!entry || now >= entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_HITS;
}

// The IP is stored only as a keyed hash, and expires with the window
export async function isFirstHit(redis, scope, req, secret) {
  const id = crypto.createHmac('sha256', secret || 'local').update(clientIp(req)).digest('hex').slice(0, 32);
  return (await redis.set(`cotoo:seen:${scope}:${id}`, 1, { nx: true, ex: SEEN_SECONDS })) === 'OK';
}
