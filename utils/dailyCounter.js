import fs from "fs";
import path from "path";

const FILE = path.resolve("data", "post-counter.json");

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ensureFile() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({ date: today(), count: 0 }, null, 2));
  }
}

export function loadCount() {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const data = JSON.parse(raw);
    if (data.date !== today()) {
      return { date: today(), count: 0 };
    }
    return { date: data.date, count: data.count || 0 };
  } catch {
    return { date: today(), count: 0 };
  }
}

export function incrementCount() {
  ensureFile();
  const current = loadCount();
  const updated = { date: today(), count: current.count + 1 };
  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}
