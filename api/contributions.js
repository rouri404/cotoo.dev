const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const QUERY = `query {
  user(login: "rouri404") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

export default async function handler(req, res) {
  const { GITHUB_TOKEN } = process.env;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: "Missing GITHUB_TOKEN in environment variables" });
  }

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY }),
    });

    // Cache Vercel response to prevent rate limits
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

    if (!response.ok) {
      return res.status(response.status).json({ error: "GitHub API error" });
    }

    const data = await response.json();
    const calendar = data.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) {
      return res.status(502).json({ error: "GitHub API error" });
    }

    // Compact shape: each day is [date, count, level 0-4]
    return res.status(200).json({
      total: calendar.totalContributions,
      weeks: calendar.weeks.map((week) =>
        week.contributionDays.map((day) => [day.date, day.contributionCount, LEVELS[day.contributionLevel] ?? 0]),
      ),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
