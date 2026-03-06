import { google } from "googleapis";
import { log } from "../utils/logger.js";

function getSearchConsoleClient() {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;
  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return google.searchconsole({ version: "v1", auth: jwt });
}

export async function runPerformanceAgent({
  siteUrl = process.env.GSC_SITE_URL,
  startDate = process.env.GSC_START_DATE,
  endDate = process.env.GSC_END_DATE,
} = {}) {
  const sc = getSearchConsoleClient();
  if (!sc || !siteUrl || !startDate || !endDate) {
    log("PerformanceAgent skipped (missing GSC credentials or dates)");
    return { opportunities: [] };
  }

  await sc.auth.getClient();
  const resp = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 50,
    },
  });

  const rows = resp.data?.rows || [];
  const opportunities = rows
    .filter(
      (r) =>
        r.position !== undefined &&
        r.position >= 5 &&
        r.position <= 20 &&
        r.impressions >= 100
    )
    .sort((a, b) => b.impressions - a.impressions)
    .map((r) => ({
      query: r.keys?.[0],
      page: r.keys?.[1],
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      position: r.position,
    }));

  if (opportunities.length) {
    log(
      `PerformanceAgent found ${opportunities.length} opportunities. Top: ${opportunities[0].query} pos ${opportunities[0].position}`
    );
  } else {
    log("PerformanceAgent found no opportunities");
  }

  return { opportunities };
}
