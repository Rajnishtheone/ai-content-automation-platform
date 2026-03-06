import cron from "node-cron";
import { runPipeline } from "../services/pipeline.js";
import { log } from "../utils/logger.js";

function getSchedule() {
  const minute = Number.isFinite(Number(process.env.RUN_MINUTE))
    ? Number(process.env.RUN_MINUTE)
    : 0;
  const hour = Number.isFinite(Number(process.env.RUN_HOUR))
    ? Number(process.env.RUN_HOUR)
    : 9;
  return { minute, hour };
}

export function startScheduler() {
  const { minute, hour } = getSchedule();
  const expr = `${minute} ${hour} * * *`;

  log(`Scheduler active: ${expr} (server local time)`);

  cron.schedule(expr, async () => {
    log("Cron tick: starting pipeline");
    try {
      await runPipeline();
    } catch (err) {
      log(`Pipeline failed: ${err.message}`);
    }
  });
}
