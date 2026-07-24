import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

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
  return ROUTES.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" || path === "/marketplace" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/marketplace" ? 0.9 : 0.7,
  }));
}
