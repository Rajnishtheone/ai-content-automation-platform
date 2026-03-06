import axios from "axios";

const baseURL = process.env.WP_URL?.replace(/\/$/, "") || "";
const auth = {
  username: process.env.WP_USERNAME,
  password: process.env.WP_APP_PASSWORD,
};

const wp = axios.create({ baseURL, auth });

export async function fetchRecentPosts(limit = 20) {
  const res = await wp.get("/wp-json/wp/v2/posts", {
    params: { per_page: limit, _fields: "id,slug,title,link" },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export function injectInternalLinks(contentHtml, posts = []) {
  if (!posts.length) return contentHtml;

  const chosen = posts.slice(0, 3);
  const linksHtml = chosen
    .map(
      (p) =>
        `<a href="${p.link || `${baseURL}/?p=${p.id}`}" rel="internal">${p.title?.rendered || p.slug}</a>`
    )
    .join(" • ");

  const block = `<p><strong>Further reading:</strong> ${linksHtml}</p>`;

  // Insert before Conclusion heading if present, else append
  const marker = /<h2[^>]*>Conclusion<\/h2>/i;
  if (marker.test(contentHtml)) {
    return contentHtml.replace(marker, `${block}\n<h2>Conclusion</h2>`);
  }
  return `${contentHtml}\n${block}`;
}
