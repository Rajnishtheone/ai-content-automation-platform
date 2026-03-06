import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve("logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function log(message) {
  ensureDir();
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line, { encoding: "utf8" });
  console.log(message);
}
