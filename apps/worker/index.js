import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import { runPipeline } from "../../services/pipeline.js";
import { runRefresherAgent } from "../../agents/refresherAgent.js";
import { getSite, createJob, updateJob } from "../../packages/database/queries.js";
import { decrypt } from "../../packages/utils/encryption.js";

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

async function wrapJob(job, handler) {
  const dbJob = await createJob({
    siteId: job.data.siteId,
    type: job.name,
    payload: job.data,
    status: "running",
    startedAt: new Date(),
  });
  try {
    const result = await handler(job);
    await updateJob(dbJob.id, { status: "done", finishedAt: new Date() });
    return result;
  } catch (err) {
    await updateJob(dbJob.id, {
      status: "failed",
      finishedAt: new Date(),
      attempts: job.attemptsMade,
    });
    throw err;
  }
}

new Worker(
  "generate_article",
  async (job) =>
    wrapJob(job, async () => {
      const site = await getSite(job.data.siteId);
      const config = {
        siteId: site.id,
        wpUrl: site.wpUrl,
        wpUsername: decrypt(site.wpUsernameEnc),
        wpAppPassword: decrypt(site.wpAppPwEnc),
        postingFreq: site.postingFreq,
        maxPerDay: site.maxPerDay,
        refreshDays: site.refreshDays,
        niche: site.niche,
      };
      return await runPipeline(config);
    }),
  { connection }
);

new Worker(
  "refresh_article",
  async (job) =>
    wrapJob(job, async () => {
      const site = await getSite(job.data.siteId);
      const config = {
        siteId: site.id,
        wpUrl: site.wpUrl,
        wpUsername: decrypt(site.wpUsernameEnc),
        wpAppPassword: decrypt(site.wpAppPwEnc),
      };
      return await runRefresherAgent(config);
    }),
  { connection }
);

console.log("Worker started");
