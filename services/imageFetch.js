import axios from "axios";

export async function fetchImageBuffer(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  const contentType = res.headers["content-type"] || "image/png";
  return { buffer: Buffer.from(res.data), contentType };
}
