# AI Content Automation Platform

Production-grade multi-agent Node.js system that researches tech keywords, analyzes SERP strength, studies competitors, plans, writes, optimizes, illustrates, and publishes SEO articles to WordPress. Includes self-improving loops via Google Search Console data.

## Architecture
```
agents/
  keywordAgent.js        # trends + suggest, tech filter, scoring
  serpAgent.js           # SERP weakness detection (reddit/quora/medium/so)
  competitorAgent.js     # scrape top results, headings, wordcount, FAQ examples
  plannerAgent.js        # OpenAI outline & FAQ plan
  writerAgent.js         # OpenAI structured draft (1200-1800 words)
  seoOptimizerAgent.js   # markdown→HTML, TOC, internal links, FAQ schema, validate
  imageAgent.js          # generate images, upload to WP, slug-based filenames
  publisherAgent.js      # duplicate check, publish with RankMath meta, ping sitemaps
  performanceAgent.js    # Search Console feedback loop (positions 5–20)
  communityAgent.js      # Reddit/StackOverflow/YouTube mining for fresh questions
  clusterAgent.js        # pillar/cluster planning and tracking

services/
  googleTrends.js, googleSuggest.js, serpScraper.js, imageGenerator.js,
  imageFetch.js, schemaGenerator.js, wordpress.js

utils/
  logger.js, validator.js, textUtils.js, retry.js, topicHistory.js, dailyCounter.js

data/
  topic-history.json     # prevents repeat keywords
  post-counter.json      # per-day publish cap
  clusters/*.json        # cluster plans and publish tracking

scheduler/cron.js
services/pipeline.js
app.js
```

## Env (.env production example)
```
OPENAI_API_KEY=

WP_URL=https://techguide.tech
WP_USERNAME=
WP_APP_PASSWORD=
POST_STATUS=draft
WP_TAGS=ai,automation,tech
WP_DEFAULT_CATEGORY_ID=1
SITEMAP_URL=https://techguide.tech/sitemap_index.xml

POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme
POSTGRES_DB=ai_seo
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
REDIS_URL=redis://redis:6379

ENCRYPTION_KEY=replace_with_64_hex
JWT_SECRET=dev-secret

MAX_POSTS_PER_DAY=1
RUN_HOUR=9
RUN_MINUTE=0
GEO=IN

GSC_SITE_URL=
GSC_CLIENT_EMAIL=
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GSC_START_DATE=2026-02-01
GSC_END_DATE=2026-02-28
```

## Quick start
- Install: `npm install`
- Run migrations: `npx prisma migrate deploy --schema packages/database/prisma/schema.prisma`
- Start API: `npm run api`
- Start worker: `npm run worker`
- Or via Docker: `docker compose -f infra/docker/docker-compose.yml up -d --build`

## Output
Pipeline returns `{ status, keyword, postId, wordCount }` and logs every step to `logs/app.log`.
It prioritizes Search Console opportunities (positions 5–20), then community-mined questions, then trending tech keywords; enforces topic history, max posts/day, and pings sitemaps after publish.
