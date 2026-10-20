import fs from 'fs';
import path from 'path';

// Read counter of a blog post: POST counts one read, GET only returns the total
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  res.setHeader('Cache-Control', 'no-store');

  // Only posts that exist get a counter, so arbitrary slugs cannot create keys
  const slug = typeof req.query.slug === 'string' ? req.query.slug : '';
  if (slug.length > 100 || !SLUG.test(slug) || !fs.existsSync(path.join(process.cwd(), 'blog', `${slug}.md`))) {
    return res.status(400).json({ error: 'Invalid slug.' });
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
    });

    const key = `cotoo:views:${slug}`;
    const views = req.method === 'POST' ? await redis.incr(key) : Number(await redis.get(key)) || 0;

    return res.status(200).json({ views });
  } catch (error) {
    return res.status(500).json({ error: 'Redis error' });
  }
}
