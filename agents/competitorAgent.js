import axios from "axios";
import * as cheerio from "cheerio";
import { fetchSerpHtml, extractResultLinks } from "../services/serpScraper.js";
import { countWordsFromHtml } from "../utils/textUtils.js";
import { log } from "../utils/logger.js";
import { retry } from "../utils/retry.js";

async function scrapePage(url) {
  const res = await retry(() =>
    axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
      },
    })
  );
  const $ = cheerio.load(res.data);
  const headings = [];
  $("h1, h2, h3").each((_, el) => {
    headings.push($(el).text().trim());
  });

  const faq = [];
  $("section, div").each((_, el) => {
    const text = $(el).text().toLowerCase();
    if (text.includes("faq")) {
      $(el)
        .find("li, p")
        .each((__, li) => {
          const t = $(li).text().trim();
          if (t && t.length > 15) faq.push(t);
        });
    }
  });

  const wordCount = countWordsFromHtml(res.data);
  return { headings, wordCount, faq };
}

export async function runCompetitorAgent(keyword, serpHtml) {
  const html = serpHtml || (await fetchSerpHtml(keyword));
  const links = extractResultLinks(html, 5);

  const allHeadings = [];
  const faqExamples = [];
  const wordCounts = [];

  for (const url of links) {
    try {
      const data = await scrapePage(url);
      allHeadings.push(...data.headings);
      faqExamples.push(...data.faq.slice(0, 3));
      wordCounts.push(data.wordCount);
    } catch (err) {
      log(`Competitor scrape failed for ${url}: ${err.message}`);
    }
  }

  const averageWordCount =
    wordCounts.length > 0
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 0;

  log(
    `CompetitorAgent scraped ${links.length} urls; avg words ${averageWordCount}`
  );

  return {
    competitorHeadings: allHeadings,
    averageWordCount,
    faqExamples: faqExamples.slice(0, 10),
  };
}
