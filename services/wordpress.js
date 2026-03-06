import axios from "axios";
import { retry } from "../utils/retry.js";

const baseURL = process.env.WP_URL?.replace(/\/$/, "") || "";
const auth = {
  username: process.env.WP_USERNAME,
  password: process.env.WP_APP_PASSWORD,
};

const wp = axios.create({
  baseURL,
  auth,
});

async function resolveTag(name) {
  const searchRes = await retry(() =>
    wp.get("/wp-json/wp/v2/tags", {
      params: { search: name, per_page: 1 },
    })
  );
  const existing = searchRes.data?.[0];
  if (existing) return existing.id;

  const createRes = await retry(() => wp.post("/wp-json/wp/v2/tags", { name }));
  return createRes.data.id;
}

async function resolveTags(names = []) {
  const ids = [];
  for (const name of names) {
    if (!name) continue;
    try {
      const id = await resolveTag(name);
      if (id) ids.push(id);
    } catch (err) {
      console.error("Tag resolve failed for", name, err.message);
    }
  }
  return ids;
}

export async function uploadMedia(buffer, filename, contentType = "image/png") {
  const res = await retry(() =>
    wp.post("/wp-json/wp/v2/media", buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    })
  );
  return res.data;
}

export async function publishPost({
  title,
  content,
  slug,
  status = process.env.POST_STATUS || "publish",
  focusKeyword,
  categoryId = process.env.WP_DEFAULT_CATEGORY_ID
    ? Number(process.env.WP_DEFAULT_CATEGORY_ID)
    : undefined,
  tagNames = [],
  featuredMediaId,
  metaDescription,
}) {
  const tags = await resolveTags(tagNames);

  const payload = {
    title,
    content,
    slug,
    status,
    meta: metaDescription
      ? {
          rank_math_description: metaDescription,
          rank_math_focus_keyword: focusKeyword,
        }
      : undefined,
    featured_media: featuredMediaId,
  };

  if (categoryId) payload.categories = [categoryId];
  if (tags.length) payload.tags = tags;

  const res = await retry(() => wp.post("/wp-json/wp/v2/posts", payload));
  return res.data;
}

export async function updatePostContent(postId, content) {
  const res = await retry(() =>
    wp.post(`/wp-json/wp/v2/posts/${postId}`, { content })
  );
  return res.data;
}

export async function postExistsBySlugOrTitle(slug, title) {
  const query = slug || title;
  if (!query) return false;
  const res = await retry(() =>
    wp.get("/wp-json/wp/v2/posts", {
      params: {
        search: query,
        per_page: 5,
        _fields: "id,slug,title",
      },
    })
  );
  if (!Array.isArray(res.data)) return false;
  return res.data.some(
    (p) =>
      p.slug === slug ||
      p.title?.rendered?.toLowerCase() === title?.toLowerCase()
  );
}

export async function fetchRecentPosts(limit = 20) {
  const res = await retry(() =>
    wp.get("/wp-json/wp/v2/posts", {
      params: { per_page: limit, _fields: "id,slug,title,link" },
    })
  );
  return Array.isArray(res.data) ? res.data : [];
}

export function parseSlugFromUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.pop();
  } catch {
    return null;
  }
}

export async function getPostBySlug(slug) {
  const res = await retry(() =>
    wp.get("/wp-json/wp/v2/posts", {
      params: { slug, per_page: 1, _fields: "id,slug,title,content,link" },
    })
  );
  const post = Array.isArray(res.data) ? res.data[0] : null;
  return post || null;
}
