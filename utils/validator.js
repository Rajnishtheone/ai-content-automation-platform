import { countWordsFromHtml } from "./textUtils.js";

export function validateSeo({ title, metaDescription, contentHtml }) {
  const errors = [];
  if (!title || !title.trim()) errors.push("Missing title");
  if (!metaDescription || metaDescription.trim().length < 120) {
    errors.push("Meta description too short (<120 chars)");
  }
  const wordCount = countWordsFromHtml(contentHtml || "");
  if (wordCount < 900) errors.push("Article too short (<900 words)");
  return { valid: errors.length === 0, errors, wordCount };
}
