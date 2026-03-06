# AI SEO SaaS Migration Checklist

1) Migrate state to DB: topic history, counters, clusters, articles, jobs.
2) Implement Prisma models (`packages/database/prisma/schema.prisma`), run `prisma:migrate`.
3) Secure secrets: encrypt WP creds, store app key.
4) Queue: configure Redis URL; run `npm run worker`.
5) API: add auth/JWT + per-site schedules; enforce plan quotas.
6) Worker: load site config from DB; pass creds into agents; record results to articles/jobs tables.
7) Dashboard: list sites, articles, schedules, metrics.
8) Billing: add Stripe when ready; gate posts/month.
