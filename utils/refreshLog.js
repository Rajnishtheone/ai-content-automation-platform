import fs from "fs";
import path from "path";

const FILE = path.resolve("data", "refresh-log.json");

function ensureFile() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({ lastRefresh: null }, null, 2));
  }
}

export function getLastRefreshDate() {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const data = JSON.parse(raw);
    return data.lastRefresh || null;
  } catch {
    return null;
  }
}

export function setLastRefreshDate(dateStr) {
  ensureFile();
  const payload = { lastRefresh: dateStr };
  fs.writeFileSync(FILE, JSON.stringify(payload, null, 2), "utf8");
}
