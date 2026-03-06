import axios from "axios";
import * as cheerio from "cheerio";
import { retry } from "../utils/retry.js";

export async function fetchSerpHtml(keyword) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
  const res = await retry(() =>
    axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36",
      },
    })
  );
  return res.data;
}

export function extractResultLinks(html, limit = 5) {
  const $ = cheerio.load(html);
  const links = [];
  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href.startsWith("/url?q=")) return;
    const url = href.split("/url?q=")[1].split("&")[0];
    if (!url.startsWith("http")) return;
    links.push(url);
  });
  return Array.from(new Set(links)).slice(0, limit);
}
