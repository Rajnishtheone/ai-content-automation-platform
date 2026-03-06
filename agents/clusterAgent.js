import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { toSlug } from "../utils/textUtils.js";
import { log } from "../utils/logger.js";
import { retry } from "../utils/retry.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function clusterFile(slug) {
  const dir = path.resolve("data", "clusters");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${slug}.json`);
}

async function generateCluster(keyword) {
  const prompt = `
Create a topical SEO cluster for keyword: "${keyword}"
Return JSON with keys: pillar (string), clusters (array of 6-10 supporting blog titles).
Keep everything technology/AI/tools focused.
`;

  const res = await retry(() =>
    client.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    })
  );

  const text = res.choices?.[0]?.message?.content || "";
  try {
    return JSON.parse(text);
  } catch (err) {
    return {
      pillar: `Best ${keyword} in 2026`,
      clusters: [
        `${keyword} for developers`,
        `${keyword} for students`,
        `${keyword} comparison`,
      ],
    };
  }
}

function chooseNextTopic(plan, historySet) {
  if (!plan) return null;
  if (!Array.isArray(plan.published)) plan.published = [];

  if (!historySet.has(plan.pillar.toLowerCase()) && !plan.published.includes(plan.pillar)) {
    return plan.pillar;
  }

  const candidate = (plan.clusters || []).find(
    (c) =>
      !plan.published.includes(c) && !historySet.has(c.toLowerCase())
  );
  return candidate || null;
}

function savePlan(file, plan) {
  fs.writeFileSync(file, JSON.stringify(plan, null, 2), "utf8");
}

export async function runClusterAgent(baseKeyword, historySet) {
  const slug = toSlug(baseKeyword || "topic");
  const file = clusterFile(slug);

  let plan;
  if (fs.existsSync(file)) {
    plan = JSON.parse(fs.readFileSync(file, "utf8"));
  } else {
    plan = await generateCluster(baseKeyword);
    plan.published = [];
    savePlan(file, plan);
  }

  const nextTopic = chooseNextTopic(plan, historySet);
  if (!nextTopic) {
    log(`ClusterAgent: all cluster topics used for ${baseKeyword}`);
    return { nextTopic: baseKeyword, pillar: plan.pillar, planFile: file };
  }

  log(`ClusterAgent chose topic "${nextTopic}" (pillar: ${plan.pillar})`);
  return { nextTopic, pillar: plan.pillar, planFile: file };
}

export function markClusterPublished(planFile, topic) {
  if (!planFile || !fs.existsSync(planFile)) return;
  try {
    const plan = JSON.parse(fs.readFileSync(planFile, "utf8"));
    if (!Array.isArray(plan.published)) plan.published = [];
    if (!plan.published.includes(topic)) {
      plan.published.push(topic);
      savePlan(planFile, plan);
    }
  } catch {
    /* ignore */
  }
}
