import { marked } from "marked";
import { buildFaqSchema } from "../services/schemaGenerator.js";
import { validateSeo } from "../utils/validator.js";
import { toSlug, countWordsFromHtml } from "../utils/textUtils.js";
import { fetchRecentPosts } from "../services/wordpress.js";
import { log } from "../utils/logger.js";
import { retry } from "../utils/retry.js";

const SECTION_ORDER = [
  "TITLE",
  "META_DESCRIPTION",
  "SLUG",
  "INTRO",
  "TABLE_OF_CONTENTS",
  "BODY",
  "FAQ",
  "CONCLUSION",
  "IMAGE_ALTS",
];

function parseStructured(text = "") {
  const lines = text.split(/\r?\n/);
  const out = {};
  let current = null;
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+):\s*(.*)$/);
    if (m && SECTION_ORDER.includes(m[1])) {
      current = m[1];
      out[current] = m[2] || "";
      continue;
    }
    if (current) {
      out[current] += out[current] ? `\n${line}` : line;
    }
  }
  return out;
}

function listFromLines(block = "") {
  return block
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("-"))
    .map((l) => l.replace(/^-+\s*/, "").trim());
}

function addInternalLinks(html, posts = []) {
  if (!posts.length) return html;
  const pick = posts.slice(0, 3);
  const linksHtml = pick
    .map(
      (p) =>
        `<a href="${p.link || ""}" rel="internal">${p.title?.rendered || p.slug}</a>`
    )
    .join(" • ");
  const block = `<p><strong>Further reading:</strong> ${linksHtml}</p>`;
  const marker = /<h2[^>]*>Conclusion<\/h2>/i;
  if (marker.test(html)) return html.replace(marker, `${block}\n<h2>Conclusion</h2>`);
  return `${html}\n${block}`;
}

export async function runSeoOptimizerAgent(structuredText, focusKeyword) {
  const sections = parseStructured(structuredText);
  const title = sections.TITLE?.trim() || `Guide to ${focusKeyword}`;
  const slug = sections.SLUG?.trim() || toSlug(title);
  const metaDescription = sections.META_DESCRIPTION?.trim()?.slice(0, 155) || "";

  const tocItems = listFromLines(sections.TABLE_OF_CONTENTS);
  const faqLines = listFromLines(sections.FAQ);
  const faqItems = faqLines.map((line) => {
    const [qPart, aPart] = line.split("?").map((v) => v.trim());
    return { question: qPart ? `${qPart}?` : line, answer: aPart || "" };
  });

  const imageAlts = listFromLines(sections.IMAGE_ALTS);

  const introHtml = marked.parse(sections.INTRO || "");
  const bodyHtml = marked.parse(sections.BODY || "");
  const conclusionHtml = marked.parse(sections.CONCLUSION || "");

  const tocHtml = tocItems.length
    ? `<h2>Table of Contents</h2><ul>${tocItems
        .map((i) => `<li>${i}</li>`)
        .join("")}</ul>`
    : "";

  const faqHtml = faqItems.length
    ? `<h2>FAQ</h2>${faqItems
        .map(({ question, answer }) => `<h3>${question}</h3><p>${answer}</p>`)
        .join("")}`
    : "";

  const faqSchema = buildFaqSchema(faqItems);

  let contentHtml = `
${introHtml}
${tocHtml}
${bodyHtml}
${faqHtml}
<h2>Conclusion</h2>
${conclusionHtml}
<!--IMAGE_SLOT_0-->
<!--IMAGE_SLOT_1-->
${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ""}
`.trim();

  try {
    const posts = await retry(() => fetchRecentPosts(20));
    contentHtml = addInternalLinks(contentHtml, posts);
  } catch (err) {
    log(`SEOOptimizer internal links failed: ${err.message}`);
  }

  const validation = validateSeo({ title, metaDescription, contentHtml });
  if (!validation.valid) {
    throw new Error(`SEO validation failed: ${validation.errors.join("; ")}`);
  }

  const wordCount = countWordsFromHtml(contentHtml);
  log(`SEOOptimizer validated content. Word count: ${wordCount}`);

  return {
    title,
    slug,
    metaDescription,
    contentHtml,
    imageAlts,
    faqItems,
    wordCount,
    focusKeyword,
  };
}
