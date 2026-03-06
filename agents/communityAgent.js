import axios from "axios";
import { log } from "../utils/logger.js";

const YT_FEED =
  "https://www.youtube.com/feeds/videos.xml?search_query=ai+tools";

function normalizeKeyword(title = "") {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function filterTech(title = "") {
  const t = title.toLowerCase();
  return (
    t.includes("ai") ||
    t.includes("tool") ||
    t.includes("coding") ||
    t.includes("developer") ||
    t.includes("software") ||
    t.includes("automation")
  );
}

async function fetchReddit() {
  const url = "https://www.reddit.com/r/artificial/top.json?limit=25";
  const res = await axios.get(url, { headers: { "User-Agent": "seo-agent" } });
  return res.data?.data?.children?.map((c) => c?.data?.title) || [];
}

async function fetchStackOverflow() {
  const url =
    "https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged=ai&site=stackoverflow&pagesize=20";
  const res = await axios.get(url);
  return res.data?.items?.map((q) => q.title) || [];
}

async function fetchYouTube() {
  try {
    const res = await axios.get(YT_FEED);
    const matches = Array.from(res.data.matchAll(/<title>([^<]+)<\/title>/g)).map(
      (m) => m[1]
    );
    return matches.slice(1); // first is channel title
  } catch {
    return [];
  }
}

export async function runCommunityAgent() {
  const sources = [];
  try {
    sources.push(...(await fetchReddit()));
  } catch (err) {
    log(`CommunityAgent reddit failed: ${err.message}`);
  }

  try {
    sources.push(...(await fetchStackOverflow()));
  } catch (err) {
    log(`CommunityAgent stackoverflow failed: ${err.message}`);
  }

  try {
    sources.push(...(await fetchYouTube()));
  } catch (err) {
    log(`CommunityAgent youtube failed: ${err.message}`);
  }

  const keywords = sources
    .map((t) => normalizeKeyword(t))
    .filter(Boolean)
    .filter(filterTech);

  const uniq = Array.from(new Set(keywords));
  if (!uniq.length) {
    throw new Error("CommunityAgent: no community keywords found");
  }
  const pick = uniq[Math.floor(Math.random() * uniq.length)];
  log(`CommunityAgent selected community keyword: ${pick}`);
  return { keyword: pick, candidates: uniq };
}
