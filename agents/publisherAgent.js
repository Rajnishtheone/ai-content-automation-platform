import {
  postExistsBySlugOrTitle,
  publishPost,
} from "../services/wordpress.js";
import axios from "axios";
import { log } from "../utils/logger.js";

async function pingSitemaps() {
  const sitemap =
    process.env.SITEMAP_URL ||
    `${(process.env.WP_URL || "").replace(/\/$/, "")}/sitemap_index.xml`;
  if (!sitemap) return;

  const targets = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`,
  ];

  for (const url of targets) {
    try {
      await axios.get(url);
      log(`Sitemap pinged: ${url}`);
    } catch (err) {
      log(`Sitemap ping failed ${url}: ${err.message}`);
    }
  }
}

export async function runPublisherAgent({
  title,
  slug,
  content,
  metaDescription,
  focusKeyword,
  tags = [],
  categoryId,
  featuredMediaId,
}) {
  const duplicate = await postExistsBySlugOrTitle(slug, title);
  if (duplicate) {
    log(`PublisherAgent duplicate detected for slug ${slug}`);
    return { status: "skipped", postId: null };
  }

  const post = await publishPost({
    title,
    content,
    slug,
    metaDescription,
    focusKeyword,
    tagNames: tags,
    categoryId,
    featuredMediaId,
    status: process.env.POST_STATUS || "publish",
  });

  log(`PublisherAgent published post ID ${post?.id}`);
  await pingSitemaps();
  return { status: "published", postId: post?.id || null };
}
