import { marked } from "marked";
import slugify from "slugify";

const SECTION_ORDER = [
  "TITLE",
  "META_DESCRIPTION",
  "SLUG",
  "INTRO",
  "TABLE_OF_CONTENTS",
  "BODY",
  "FAQ",
  "CONCLUSION",
  "INTERNAL_LINKS",
  "EXTERNAL_LINK",
  "IMAGE_ALTS",
];

function parseBlocks(text) {
  const lines = text.split(/\r?\n/);
  const out = {};
  let current = null;
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+):\s*(.*)$/);
    if (match && SECTION_ORDER.includes(match[1])) {
      current = match[1];
      out[current] = match[2] ?? "";
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

function buildFaqSchema(faqItems) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function formatArticle(structuredText) {
  const sections = parseBlocks(structuredText);

  const title = sections.TITLE?.trim() || "New Post";
  const slug =
    sections.SLUG?.trim() ||
    slugify(title, { lower: true, strict: true, trim: true });
  const metaDescription = sections.META_DESCRIPTION?.trim()?.slice(0, 155) || "";

  const tocItems = listFromLines(sections.TABLE_OF_CONTENTS);
  const faqLines = listFromLines(sections.FAQ);
  const faqItems = faqLines.map((line) => {
    const [q, a = ""] = line.split("?").map((v) => v.trim());
    return { q: q ? `${q}?` : line, a };
  });

  const internalLinks = listFromLines(sections.INTERNAL_LINKS).map((line) => {
    const [anchor, url] = line.split("|").map((v) => v.trim());
    return { anchor, url };
  });
  const externalLinks = listFromLines(sections.EXTERNAL_LINK).map((line) => {
    const [anchor, url] = line.split("|").map((v) => v.trim());
    return { anchor, url };
  });

  const imageAlts = listFromLines(sections.IMAGE_ALTS);

  const introHtml = sections.INTRO ? marked.parse(sections.INTRO) : "";
  const bodyHtml = sections.BODY ? marked.parse(sections.BODY) : "";
  const conclusionHtml = sections.CONCLUSION
    ? marked.parse(sections.CONCLUSION)
    : "";

  const tocHtml = tocItems.length
    ? `<h2>Table of Contents</h2><ul>${tocItems
        .map((i) => `<li>${i}</li>`)
        .join("")}</ul>`
    : "";

  const faqHtml = faqItems.length
    ? `<h2>FAQ</h2>${faqItems
        .map(({ q, a }) => `<h3>${q}</h3><p>${a}</p>`)
        .join("")}`
    : "";

  const internalHtml = internalLinks.length
    ? `<p>${internalLinks
        .map(({ anchor, url }) => `<a href="${url}">${anchor}</a>`)
        .join(" • ")}</p>`
    : "";

  const externalHtml = externalLinks.length
    ? `<p>${externalLinks
        .map(
          ({ anchor, url }) =>
            `<a href="${url}" target="_blank" rel="noopener">${anchor}</a>`
        )
        .join(" • ")}</p>`
    : "";

  const faqSchema = faqItems.length ? buildFaqSchema(faqItems) : null;

  const contentHtml = `
${introHtml}
${tocHtml}
${bodyHtml}
${faqHtml}
<h2>Conclusion</h2>
${conclusionHtml}
<!--IMAGE_SLOT_0-->
<!--IMAGE_SLOT_1-->
${internalHtml}
${externalHtml}
${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ""}`.trim();

  return {
    title,
    slug,
    metaDescription,
    contentHtml,
    imageAlts,
  };
}
