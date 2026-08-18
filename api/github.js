export default async function handler(req, res) {
  const { GITHUB_TOKEN } = process.env;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "Missing GITHUB_TOKEN in environment variables" });
  }

  try {
    // Use Search API for real-time commit data
    const response = await fetch("https://api.github.com/search/commits?q=author:rouri404&sort=author-date&order=desc", {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    // Cache Vercel response to prevent rate limits
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

    if (!response.ok) {
      return res.status(response.status).json({ error: "GitHub API error" });
    }

    const data = await response.json();
    const lastCommit = data.items && data.items.length > 0 ? data.items[0] : null;

    if (!lastCommit) {
      return res.status(200).json({ found: false });
    }

    return res.status(200).json({
      found: true,
      created_at: lastCommit.commit.author.date,
      repo: lastCommit.repository.name,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
