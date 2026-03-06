import axios from "axios";
import { listTrendingTopics } from "./trends.js";

const GOOGLE_SUGGEST_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";

const TECH_KEYWORDS = [
  "ai",
  "software",
  "coding",
  "programming",
  "apps",
  "technology",
  "gadgets",
];

function isTechTopic(keyword) {
  const lower = keyword.toLowerCase();
  return TECH_KEYWORDS.some((k) => lower.includes(k));
}

async function fetchSuggestions(seed) {
  const url = `${GOOGLE_SUGGEST_URL}${encodeURIComponent(seed)}`;
  const res = await axios.get(url);
  return Array.isArray(res.data?.[1]) ? res.data[1] : [];
}

function chooseBestKeyword(seed, suggestions) {
  const candidates = [seed, ...suggestions]
    .map((k) => k.trim())
    .filter(Boolean)
    .filter(isTechTopic);

  if (!candidates.length) return null;

  // Prefer longer, informational queries (simple heuristic: length & presence of question words / modifiers)
  const questionWords = ["how", "what", "why", "best", "guide", "tips", "2026"];
  const scored = candidates.map((k) => {
    const lenScore = Math.min(k.split(" ").length, 12);
    const intentScore = questionWords.some((w) => k.toLowerCase().includes(w))
      ? 3
      : 1;
    return { k, score: lenScore + intentScore };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].k;
}

export async function pickTechKeyword(preferredGeo = process.env.GEO || "IN") {
  const trending = await listTrendingTopics(10, preferredGeo);

  for (const topic of trending) {
    if (!isTechTopic(topic)) continue;

    const suggestions = await fetchSuggestions(topic);
    const best = chooseBestKeyword(topic, suggestions);
    if (best) {
      return { topic, keyword: best, suggestions };
    }
  }

  throw new Error(
    "No tech-related trending topics found; try again later or broaden GEO"
  );
}

export function isTechKeyword(keyword) {
  return isTechTopic(keyword);
}
