import crypto from "crypto";

const ALGO = "aes-256-gcm";
const KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  : null;

if (!KEY || KEY.length !== 32) {
  console.warn("ENCRYPTION_KEY missing or invalid; credentials encryption disabled.");
}

export function encrypt(text) {
  if (!KEY) return text;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload) {
  if (!KEY) return payload;
  try {
    const buf = Buffer.from(payload, "base64");
    const iv = buf.slice(0, 12);
    const tag = buf.slice(12, 28);
    const data = buf.slice(28);
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch {
    return payload;
  }
}
