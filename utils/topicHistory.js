import fs from "fs";
import path from "path";

const FILE = path.resolve("data", "topic-history.json");

function ensureFile() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf8");
}

export function loadHistory() {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

export function saveKeyword(keyword) {
  ensureFile();
  const set = loadHistory();
  set.add(keyword.toLowerCase());
  fs.writeFileSync(FILE, JSON.stringify(Array.from(set), null, 2), "utf8");
}
