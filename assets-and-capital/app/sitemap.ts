import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { allOpportunitySlugs } from "@/lib/matching";
import { allArticleSlugs } from "@/lib/insights-data";

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

export default function sitemap(): MetadataRoute.Sitemap {
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
  const articles: MetadataRoute.Sitemap = allArticleSlugs().map((slug) => ({
    url: `${base}/insights/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
  return [...staticEntries, ...opportunities, ...articles];
}
