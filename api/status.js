// Whether the projects' public sites answer, for the status next to each project card. The list is fixed: nothing comes from the request
const SITES = {
  gs2025: 'https://gs2025.cotoo.dev/',
  crmed: 'https://crmed.cotoo.dev/',
};

async function isUp(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch (error) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const entries = await Promise.all(Object.entries(SITES).map(async ([key, url]) => [key, await isUp(url)]));
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  return res.status(200).json(Object.fromEntries(entries));
}
