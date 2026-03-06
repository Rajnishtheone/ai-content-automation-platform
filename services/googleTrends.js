import googleTrends from "google-trends-api";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fallbackTopics(limit = 10) {
  const prompt = `
Generate ${limit} trending SEO blog topics about AI tools for developers.
Return them as a simple list, one topic per line, no numbering.
`;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  const lines =
    res.choices?.[0]?.message?.content
      ?.split("\n")
      .map((l) => l.trim())
      .filter(Boolean) || [];
  return lines.slice(0, limit);
}

export async function getTrendingTopics(limit = 10, geo = process.env.GEO || "IN") {
  try {
    const raw = await googleTrends.dailyTrends({ geo });
    const data = JSON.parse(raw);
    const searches =
      data?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
    const list = searches.slice(0, limit).map((s) => s.title.query).filter(Boolean);
    if (list.length) return list;
    return await fallbackTopics(limit);
  } catch (err) {
    console.log("Google trends failed, using fallback topics:", err.message);
    return await fallbackTopics(limit);
  }
}
