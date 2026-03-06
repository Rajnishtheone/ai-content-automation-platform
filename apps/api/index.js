import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUserByEmail,
  createSite,
  listSitesByUser,
  deleteSite,
  getSite,
  listArticles,
  getArticle,
} from "../../packages/database/queries.js";
import { encrypt } from "../../packages/utils/encryption.js";
import { authRequired, signToken } from "./middleware/auth.js";
import {
  enqueueGenerateJob,
  enqueueRefreshJob,
} from "../worker/queue.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/health", (_, res) => res.json({ ok: true }));

// Auth
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  const existing = await getUserByEmail(email);
  if (existing) return res.status(400).json({ error: "exists" });
  const hash = await bcrypt.hash(password, 10);
  const user = await createUser({ email, password: hash });
  const token = signToken({ userId: user.id });
  res.json({ token });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  if (!user) return res.status(401).json({ error: "invalid" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "invalid" });
  const token = signToken({ userId: user.id });
  res.json({ token });
});

// Sites
app.post("/sites", authRequired, async (req, res) => {
  const { wpUrl, wpUsername, wpAppPassword, niche, postingFreq, maxPerDay, refreshDays } =
    req.body;
  const site = await createSite({
    userId: req.user.userId,
    wpUrl,
    wpUsernameEnc: encrypt(wpUsername),
    wpAppPwEnc: encrypt(wpAppPassword),
    niche: niche || "",
    postingFreq: postingFreq || 3,
    maxPerDay: maxPerDay || 1,
    refreshDays: refreshDays || 7,
  });
  res.json(site);
});

app.get("/sites", authRequired, async (req, res) => {
  const sites = await listSitesByUser(req.user.userId);
  res.json(sites);
});

app.delete("/sites/:id", authRequired, async (req, res) => {
  const { id } = req.params;
  await deleteSite(id);
  res.json({ deleted: true });
});

// Articles
app.get("/articles", authRequired, async (req, res) => {
  const { siteId } = req.query;
  const articles = siteId ? await listArticles(siteId) : [];
  res.json(articles);
});

app.get("/articles/:id", authRequired, async (req, res) => {
  const article = await getArticle(req.params.id);
  if (!article) return res.status(404).json({ error: "not found" });
  res.json(article);
});

// Job triggers
app.post("/sites/:siteId/generate", authRequired, async (req, res) => {
  const { siteId } = req.params;
  const site = await getSite(siteId);
  if (!site || site.userId !== req.user.userId)
    return res.status(404).json({ error: "not found" });
  const { keyword } = req.body;
  await enqueueGenerateJob({ siteId, keyword });
  res.json({ queued: true });
});

app.post("/sites/:siteId/refresh", authRequired, async (req, res) => {
  const { siteId } = req.params;
  const site = await getSite(siteId);
  if (!site || site.userId !== req.user.userId)
    return res.status(404).json({ error: "not found" });
  await enqueueRefreshJob({ siteId });
  res.json({ queued: true });
});

const port = process.env.API_PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
