export default async function handler(req, res) {
  const { GITHUB_TOKEN } = process.env;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "Missing GITHUB_TOKEN in environment variables" });
  }

  try {
    const response = await fetch("https://api.github.com/users/rouri404/events", {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "GitHub API error" });
    }

    const events = await response.json();
    const pushEvent = events.find((e) => e.type === "PushEvent");

    if (!pushEvent) {
      return res.status(200).json({ found: false });
    }

    return res.status(200).json({
      found: true,
      created_at: pushEvent.created_at,
      repo: pushEvent.repo.name,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
