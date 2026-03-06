import { runKeywordAgent } from "../agents/keywordAgent.js";
import { runSerpAgent } from "../agents/serpAgent.js";
import { runCompetitorAgent } from "../agents/competitorAgent.js";
import { runPlannerAgent } from "../agents/plannerAgent.js";
import { runWriterAgent } from "../agents/writerAgent.js";
import { runSeoOptimizerAgent } from "../agents/seoOptimizerAgent.js";
import { runImageAgent } from "../agents/imageAgent.js";
import { runPublisherAgent } from "../agents/publisherAgent.js";
import { runPerformanceAgent } from "../agents/performanceAgent.js";
import { runCommunityAgent } from "../agents/communityAgent.js";
import { runClusterAgent, markClusterPublished } from "../agents/clusterAgent.js";
import { runRefresherAgent } from "../agents/refresherAgent.js";
import { log } from "../utils/logger.js";
import { loadHistory, saveKeyword } from "../utils/topicHistory.js";
import { loadCount, incrementCount } from "../utils/dailyCounter.js";
import { getLastRefreshDate, setLastRefreshDate } from "../utils/refreshLog.js";

function parseTagsFromEnv() {
  return (process.env.WP_TAGS || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function applyImagesToContent(contentHtml, images) {
  let output = contentHtml;
  images.forEach(({ imageURL, alt }, idx) => {
    const placeholder = `<!--IMAGE_SLOT_${idx}-->`;
    const imgHtml = `<p><img src="${imageURL}" alt="${alt}" loading="lazy"></p>`;
    output = output.replace(placeholder, imgHtml);
  });
  return output;
}

export async function runPipeline(siteConfig = {}) {
  let keyword = null;
  let postId = null;
  let wordCount = null;
  let clusterPlanFile = null;

  try {
    // optional weekly refresh of existing posts
    const refreshDays = Number(process.env.REFRESH_DAYS || "7");
    const lastRefresh = getLastRefreshDate();
    const nowDate = new Date().toISOString().slice(0, 10);
    const shouldRefresh =
      !lastRefresh ||
      (Date.parse(nowDate) - Date.parse(lastRefresh)) / (1000 * 60 * 60 * 24) >=
        refreshDays;

    if (shouldRefresh) {
      const refreshed = await runRefresherAgent();
      if (refreshed?.status === "refreshed") {
        setLastRefreshDate(nowDate);
        log("Pipeline: refreshed existing post, skipping new publish today");
        return {
          status: "refreshed",
          keyword: refreshed.keyword,
          postId: refreshed.postId,
          wordCount,
        };
      }
    }

    // max posts per day guard
    const daily = loadCount();
    const maxPerDay = Number(process.env.MAX_POSTS_PER_DAY || "9999");
    if (daily.count >= maxPerDay) {
      log(`Pipeline skip: daily limit reached (${daily.count}/${maxPerDay})`);
      return { status: "skipped", keyword, postId, wordCount };
    }

    // performance-driven keyword (self-improving loop)
    const perf = await runPerformanceAgent(siteConfig);
    if (perf.opportunities && perf.opportunities.length) {
      keyword = perf.opportunities[0].query;
      log(`Pipeline using performance keyword: ${keyword}`);
    }

    // community mining fallback
    if (!keyword) {
      try {
        const community = await runCommunityAgent();
        keyword = community.keyword;
        log(`Pipeline using community keyword: ${keyword}`);
      } catch (err) {
        log(`CommunityAgent unavailable: ${err.message}`);
      }
    }

    // keyword agent fallback
    if (!keyword) {
      const kw = await runKeywordAgent();
      keyword = kw.keyword;
    }

    const history = loadHistory();

    // cluster agent to build topical hubs
    const cluster = await runClusterAgent(keyword, history);
    clusterPlanFile = cluster.planFile;
    keyword = cluster.nextTopic || keyword;

    // topic history check after cluster selection
    if (keyword && history.has(keyword.toLowerCase())) {
      log(`Pipeline skip: keyword already used (${keyword})`);
      return { status: "skipped", keyword, postId, wordCount };
    }

    // serp agent
    const serp = await runSerpAgent(keyword);
    if (!serp.weakSERP) {
      log(`Pipeline skip: SERP strong for keyword "${keyword}"`);
      return { status: "skipped", keyword, postId, wordCount };
    }

    // competitor agent
    const competitor = await runCompetitorAgent(keyword, serp.html);

    // planner agent
    const plan = await runPlannerAgent(keyword, competitor.competitorHeadings);

    // writer agent
    const structured = await runWriterAgent(keyword, plan);

    // seo optimizer
    const optimized = await runSeoOptimizerAgent(structured, keyword);
    wordCount = optimized.wordCount;
    log(`Validation success for keyword "${keyword}"`);

    // image agent
    const images = await runImageAgent(keyword, optimized.slug, optimized.imageAlts);

    const contentWithImages = applyImagesToContent(
      optimized.contentHtml,
      images
    );

    // publisher agent
    const publishResult = await runPublisherAgent({
      title: optimized.title,
      slug: optimized.slug,
      content: contentWithImages,
      metaDescription: optimized.metaDescription,
      focusKeyword: keyword,
      tags: parseTagsFromEnv(),
      categoryId: process.env.WP_DEFAULT_CATEGORY_ID
        ? Number(process.env.WP_DEFAULT_CATEGORY_ID)
        : undefined,
      featuredMediaId: images[0]?.mediaId,
    });

    postId = publishResult.postId;
    if (publishResult.status === "published") {
      saveKeyword(keyword);
      incrementCount();
      if (clusterPlanFile) markClusterPublished(clusterPlanFile, keyword);
    }
    return { status: publishResult.status, keyword, postId, wordCount };
  } catch (err) {
    console.error("PIPELINE ERROR FULL STACK:");
    console.error(err);
    console.error(err.stack);
    throw err;
  }
}
