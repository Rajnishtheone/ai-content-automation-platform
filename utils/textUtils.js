import slugifyLib from "slugify";

export function toSlug(text) {
  return slugifyLib(text || "", { lower: true, strict: true, trim: true });
}

export function countWordsFromHtml(html = "") {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(" ").length;
}

export function countWordsFromMarkdown(md = "") {
  const text = md.replace(/[#>*_`~\-]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return 0;
  return text.split(" ").length;
}
