import OpenAI from "openai";
import { log } from "../utils/logger.js";
import { retry } from "../utils/retry.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runWriterAgent(keyword, plan) {
  const prompt = `
Write a structured SEO article.
Keyword: "${keyword}"
Use this outline (adapt as needed): ${Array.isArray(plan?.outline) ? plan.outline.join(" | ") : ""}
Target length: 1200-1800 words.
Include sections in this exact order and label them as shown:

TITLE:
META_DESCRIPTION:
SLUG:
INTRO:
TABLE_OF_CONTENTS:
BODY:
FAQ:
CONCLUSION:
IMAGE_ALTS:

Rules:
- include keyword in title and first paragraph
- keyword density about 1-1.5%
- short paragraphs, beginner friendly
- add 4-6 FAQ entries
`;

  const res = await retry(() =>
    client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })
  );

  const content = res.choices?.[0]?.message?.content;
  log(`WriterAgent generated article for "${keyword}"`);
  return content;
}
