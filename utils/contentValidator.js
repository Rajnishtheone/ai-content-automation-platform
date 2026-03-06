export function validateArticle({ title, metaDescription, contentHtml }) {
  const errors = [];

  if (!title || !title.trim()) errors.push("Missing title");
  if (!metaDescription || metaDescription.trim().length < 120) {
    errors.push("Meta description too short (<120 chars)");
  }

  // crude word count from stripping tags
  const text = contentHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;
  if (words < 900) errors.push("Body too short (<900 words)");

  return { valid: errors.length === 0, errors, wordCount: words };
}
