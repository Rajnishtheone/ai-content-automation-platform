import googleTrends from "google-trends-api";

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getTrendingTopic(geo = process.env.GEO || "IN") {
  const raw = await googleTrends.dailyTrends({ geo });
  const data = JSON.parse(raw);
  const days = data?.default?.trendingSearchesDays || [];
  const today = days[0]?.trendingSearches || [];
  if (!today.length) {
    throw new Error("No trending searches returned from Google Trends");
  }
  const keyword = pickRandom(today)?.title?.query;
  if (!keyword) {
    throw new Error("Unable to extract a trending keyword");
  }
  return keyword;
}

export async function listTrendingTopics(limit = 5, geo = process.env.GEO || "IN") {
  const raw = await googleTrends.dailyTrends({ geo });
  const data = JSON.parse(raw);
  const searches = data?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];
  return searches.slice(0, limit).map((s) => s.title.query);
}
