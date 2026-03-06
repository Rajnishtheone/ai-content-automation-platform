import axios from "axios";
import OpenAI from "openai";
import { runPerformanceAgent } from "./performanceAgent.js";
import { retry } from "../utils/retry.js";
import { log } from "../utils/logger.js";
import {
  getPostBySlug,
  updatePostContent,
  parseSlugFromUrl,
} from "../services/wordpress.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchPostHtml(url) {
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

async function improveContent(keyword, existingContent) {
  const prompt = `
Improve the following blog article for SEO.
Target keyword: ${keyword}
Goals:
- increase depth
- add missing sections
- improve readability
- add FAQ
- optimize headings
- keep useful existing content
Return full improved HTML article.

CONTENT:
${existingContent}
`;

  const res = await retry(() =>
    client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    })
  );

  return res.choices?.[0]?.message?.content || existingContent;
}

export async function runRefresherAgent() {
  const perf = await runPerformanceAgent();
  if (!perf.opportunities.length) {
    log("RefresherAgent: no refresh opportunities");
    return null;
  }

  const target = perf.opportunities[0];
  const keyword = target.query;
  const pageUrl = target.page;
  const slug = parseSlugFromUrl(pageUrl);
  if (!slug) {
    log("RefresherAgent: could not parse slug from page URL");
    return null;
  }

  const post = await getPostBySlug(slug);
  if (!post) {
    log("RefresherAgent: post not found in WP for slug " + slug);
    return null;
  }

  log(`RefresherAgent improving post ${post.id} for keyword "${keyword}"`);

  const existingContent = post.content?.rendered || (await fetchPostHtml(pageUrl));
  const improved = await improveContent(keyword, existingContent);

  await updatePostContent(post.id, improved);
  log(`RefresherAgent updated post ${post.id}`);

  return { status: "refreshed", keyword, postId: post.id };
}
