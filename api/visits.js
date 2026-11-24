import { isFirstHit, isSiteOrigin, isThrottled } from './_guard.js';

const VISITS_KEY = 'cotoo:visits';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'POST') {
    if (!isSiteOrigin(req)) return res.status(403).json({ error: 'Origin not allowed.' });
    if (isThrottled(req)) return res.status(429).json({ error: 'Too many requests.' });
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN;
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL,
      token,
    });

    const counts = req.method === 'POST' && (await isFirstHit(redis, 'visits', req, token));
    const visits = counts ? await redis.incr(VISITS_KEY) : Number(await redis.get(VISITS_KEY)) || 0;

    return res.status(200).json({ visits });
  } catch (error) {
    return res.status(500).json({ error: 'Redis error' });
  }
}
