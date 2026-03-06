import OpenAI from "openai";
import { log } from "../utils/logger.js";
import { retry } from "../utils/retry.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runPlannerAgent(keyword, competitorHeadings = []) {
  const prompt = `
You are an SEO content strategist.
Keyword: "${keyword}"
Competitor headings: ${competitorHeadings.slice(0, 40).join(" | ")}

Create a stronger blog plan with:
- Title
- Outline with H2/H3 items (array of strings, include tables/comparisons if helpful)
- 5 FAQ questions

Return JSON with keys: title, outline, faqQuestions.
`;

  const res = await retry(() =>
    client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    })
  );

  const text = res.choices?.[0]?.message?.content || "";
  let parsed;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    parsed = { title: `Guide to ${keyword}`, outline: [], faqQuestions: [] };
  }

  log(`PlannerAgent produced plan for "${keyword}"`);
  return parsed;
}
