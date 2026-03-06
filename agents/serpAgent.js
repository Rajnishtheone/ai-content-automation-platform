import { fetchSerpHtml } from "../services/serpScraper.js";
import { log } from "../utils/logger.js";

const WEAK_DOMAINS = ["reddit.com", "quora.com", "medium.com", "stackoverflow.com"];

export async function runSerpAgent(keyword) {
  const html = await fetchSerpHtml(keyword);
  const detected = WEAK_DOMAINS.filter((d) => html.includes(d));
  const weakSERP = detected.length >= 2;

  log(
    `SERPAgent analysis for "${keyword}": weak=${weakSERP} sources=${detected.join(
      ", "
    )}`
  );

  return { keyword, weakSERP, detectedSources: detected, html };
}
