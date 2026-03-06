import { getPrisma } from "./client.js";

const prisma = getPrisma();

// Users
export async function createUser({ email, password, plan = "starter" }) {
  return prisma.user.create({ data: { email, password, plan } });
}

export async function getUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

// Sites
export async function createSite(data) {
  return prisma.site.create({ data });
}

export async function listSitesByUser(userId) {
  return prisma.site.findMany({ where: { userId } });
}

export async function getSite(id) {
  return prisma.site.findUnique({ where: { id } });
}

export async function deleteSite(id) {
  return prisma.site.delete({ where: { id } });
}

// Articles
export async function createArticle(data) {
  return prisma.article.create({ data });
}

export async function updateArticle(id, data) {
  return prisma.article.update({ where: { id }, data });
}

export async function listArticles(siteId) {
  return prisma.article.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } });
}

export async function getArticle(id) {
  return prisma.article.findUnique({ where: { id } });
}

// Jobs
export async function createJob(data) {
  return prisma.job.create({ data });
}

export async function updateJob(id, data) {
  return prisma.job.update({ where: { id }, data });
}

// Clusters
export async function upsertCluster(siteId, pillar, plan, published = []) {
  const existing = await prisma.cluster.findFirst({ where: { siteId, pillar } });
  if (existing) {
    return prisma.cluster.update({
      where: { id: existing.id },
      data: { plan, published },
    });
  }
  return prisma.cluster.create({ data: { siteId, pillar, plan, published } });
}

export async function getClusterBySite(siteId) {
  return prisma.cluster.findFirst({ where: { siteId } });
}

// Metrics
export async function storeMetrics(siteId, rows) {
  if (!rows?.length) return;
  await prisma.metric.createMany({
    data: rows.map((r) => ({
      siteId,
      query: r.query,
      page: r.page,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      position: r.position,
      fetchedAt: new Date(),
    })),
    skipDuplicates: true,
  });
}
