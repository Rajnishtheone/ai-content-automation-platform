import { getTrendingTopics } from "../services/googleTrends.js";
import { fetchSuggestions } from "../services/googleSuggest.js";
import { log } from "../utils/logger.js";

const TECH_KEYWORDS = [
  "ai",
  "software",
  "coding",
  "programming",
  "apps",
  "technology",
  "gadgets",
];

const INTENT_MODIFIERS = ["best", "how", "guide", "tips", "2026"];

function isTechTopic(keyword) {
  const lower = keyword.toLowerCase();
  return TECH_KEYWORDS.some((k) => lower.includes(k));
}

function scoreKeyword(keyword) {
  const words = keyword.split(" ").length;
  const lengthScore = Math.min(words, 12);
  const modifierScore = INTENT_MODIFIERS.reduce(
    (acc, mod) => (keyword.toLowerCase().includes(mod) ? acc + 2 : acc),
    0
  );
  return lengthScore + modifierScore;
}

export async function runKeywordAgent() {
  const trending = await getTrendingTopics(10);

  for (const topic of trending) {
    if (!isTechTopic(topic)) continue;

    const suggestions = await fetchSuggestions(topic);
    const candidates = [topic, ...suggestions]
      .map((k) => k.trim())
      .filter(Boolean)
      .filter(isTechTopic);

    if (!candidates.length) continue;

    const scored = candidates
      .map((k) => ({ k, score: scoreKeyword(k) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0].k;
    log(`KeywordAgent selected keyword: ${best} (topic: ${topic})`);
    return { keyword: best, topic, suggestions: candidates };
  }

  throw new Error("KeywordAgent: no suitable tech keyword found");
}
