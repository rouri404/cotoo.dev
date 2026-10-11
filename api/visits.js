const VISITS_KEY = 'cotoo:visits';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
    });

    const visits = req.method === 'POST'
      ? await redis.incr(VISITS_KEY)
      : Number(await redis.get(VISITS_KEY)) || 0;

    return res.status(200).json({ visits });
  } catch (error) {
    return res.status(500).json({ error: 'Redis error' });
  }
}
