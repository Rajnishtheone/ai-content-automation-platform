import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(topic) {
  return `
You are an SEO copywriter who must create a RankMath-friendly blog post.
Primary keyword: "${topic}"

Return the content in the following labeled blocks exactly once and in this order:
TITLE:
META_DESCRIPTION: (<=160 characters, include keyword)
SLUG: (kebab-case)
INTRO:
TABLE_OF_CONTENTS: (bullet list items, one per line prefixed with "- ")
BODY: (1200-1500 words, use H2/H3 headings, short paragraphs, include the keyword 8-10 times naturally)
FAQ:
- Question 1? Answer 1.
- Question 2? Answer 2.
- Question 3? Answer 3.
CONCLUSION:
INTERNAL_LINKS:
- anchor text | https://your-site.com/sample-1
- anchor text | https://your-site.com/sample-2
EXTERNAL_LINK:
- anchor text | https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}
IMAGE_ALTS:
- short alt text 1
- short alt text 2

Keep the tone helpful and concise. Avoid fluff.`;
}

export async function generateStructuredArticle(topic) {
  const res = await client.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.7,
    messages: [{ role: "user", content: buildPrompt(topic) }],
  });

  const content = res.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned empty content");
  }
  return content;
}
