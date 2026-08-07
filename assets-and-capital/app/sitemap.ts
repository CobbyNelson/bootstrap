import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { allOpportunitySlugs } from "@/lib/matching";
import { publishedSlugs } from "@/lib/articles";

const base = `https://${SITE.domain}`;

const ROUTES = [
  "",
  "/marketplace",
  "/pricing",
  "/investors",
  "/businesses",
  "/about",
  "/contact",
  "/events",
  "/insights",
  "/faq",
  "/register",
  "/register/investor",
  "/register/business",
  "/login",
  "/services/roadshows",
  "/services/market-access",
  "/services/business-plan",
  "/services/financial-modelling",
  "/services/teaser",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/legal/disclosures",
];

/**
 * Articles come from the database, not from the ARTICLES constant.
 *
 * They used to come from `allArticleSlugs()`, which reads the hardcoded array
 * in lib/insights-data.ts — while the article PAGE reads the Article table. The
 * two agree only where somebody has run scripts/import-articles.ts, so on this
 * production database, which has never been imported into, the sitemap
 * advertised eight URLs and every one of them returned 404.
 *
 * A sitemap is a claim about what exists. Reading the same source the page
 * reads means it cannot make that claim wrongly again, whatever the table
 * happens to hold.
 *
 * Marketplace slugs stay on the static list deliberately: those pages ARE the
 * static content, so the list and the pages cannot disagree.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = ROUTES.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" || path === "/marketplace" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/marketplace" ? 0.9 : 0.7,
  }));
  const opportunities: MetadataRoute.Sitemap = allOpportunitySlugs().map((slug) => ({
    url: `${base}/marketplace/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  // publishedSlugs() degrades to [] if the database cannot answer, so a sitemap
  // that is short is preferable to one that 500s — and to one that lies.
  const articles: MetadataRoute.Sitemap = (await publishedSlugs()).map((slug) => ({
    url: `${base}/insights/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...staticEntries, ...opportunities, ...articles];
}
