import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null,
});

export const generateQueue = new Queue("generate_article", { connection });
export const refreshQueue = new Queue("refresh_article", { connection });

export function enqueueGenerateJob(payload) {
  return generateQueue.add("generate", payload, { attempts: 3, removeOnComplete: true });
}

export function enqueueRefreshJob(payload) {
  return refreshQueue.add("refresh", payload, { attempts: 3, removeOnComplete: true });
}

export default { enqueueGenerateJob, enqueueRefreshJob };
