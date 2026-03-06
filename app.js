import "dotenv/config";
import { startScheduler } from "./scheduler/cron.js";
import { runPipeline } from "./services/pipeline.js";

async function bootstrap() {
  console.log("AI SEO Agent starting...");

  const runImmediate =
    process.argv.includes("--now") || process.env.RUN_ON_START === "true";

  if (runImmediate) {
    console.log("Running one immediate pipeline execution...");
    try {
      await runPipeline();
    } catch (err) {
      console.error("Immediate run failed:", err.message);
    }
  }

  startScheduler();
}

bootstrap();
