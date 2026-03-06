import { generateImages } from "../services/imageGenerator.js";
import { uploadMedia } from "../services/wordpress.js";
import { fetchImageBuffer } from "../services/imageFetch.js";
import { log } from "../utils/logger.js";

export async function runImageAgent(keyword, slug, alts = []) {
  const generated = await generateImages(keyword, alts);
  const uploaded = [];

  for (const [idx, img] of generated.entries()) {
    try {
      const { buffer, contentType } = await fetchImageBuffer(img.url);
      const filename = `${slug}-${idx + 1}.png`;
      const media = await uploadMedia(buffer, filename, contentType);
      uploaded.push({
        mediaId: media?.id,
        imageURL: media?.source_url || img.url,
        alt: img.alt,
      });
      log(`ImageAgent uploaded image ${media?.id || "n/a"} (${filename})`);
    } catch (err) {
      log(`ImageAgent upload failed slot ${idx + 1}: ${err.message}`);
    }
  }

  return uploaded;
}
