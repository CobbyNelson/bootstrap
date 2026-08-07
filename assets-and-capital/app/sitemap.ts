import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { allOpportunitySlugs } from "@/lib/matching";
import { publishedSlugs } from "@/lib/articles";
import { LOCALES, localePath, type Locale } from "@/lib/i18n/config";

const base = `https://${SITE.domain}`;

/**
 * Regenerated hourly as well as on publish.
 *
 * The publish path calls revalidatePath("/sitemap.xml"), which makes a new
 * article appear immediately. This is the floor underneath that: a sitemap is
 * prerendered, so any future write path that forgets to revalidate would leave
 * it frozen at deploy time with nothing to indicate it. An hour is far inside
 * any crawl interval and costs one query.
 */
export const revalidate = 3600;

/**
 * Pages that live under app/[locale], so they exist in all four languages.
 */
const LOCALISED_ROUTES = [
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
 * Pages that do NOT live under app/[locale] and therefore have exactly one URL.
 *
 * /login is at app/(auth)/login and is on the reserved list in next.config.ts,
 * so /fr/login is not a route at all — listing a translated variant of it would
 * have put a 404 in the sitemap, which is the thing this file was just fixed
 * for. The sitemap test walks every URL it emits, so it catches this.
 */
const UNLOCALISED_ROUTES = ["/login"];

/**
 * The absolute URL for a path in a language.
 *
 * Built with `localePath` rather than a second copy of the prefix rule: English
 * is unprefixed, and if that ever changes it must change in one place, not in
 * the sitemap as well.
 *
 * The lone trailing slash is dropped so the home page is
 * https://assetsandcapitalltd.com, matching what the canonical header and the
 * hreflang tags emit. Three spellings of the same URL is how a page competes
 * with itself.
 */
function absolute(path: string, locale: Locale): string {
  const p = localePath(path || "/", locale);
  return `${base}${p === "/" ? "" : p}`;
}

/**
 * hreflang alternates, as Google wants them: every language version listed on
 * every entry, INCLUDING the entry's own — a set where one member does not
 * point back at itself is ignored rather than half-applied.
 */
function alternatesFor(path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = absolute(path, l);
  languages["x-default"] = absolute(path, "en");
  return { languages };
}

/** One entry per language, each carrying the full alternates set. */
function localisedEntries(
  path: string,
  rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  const alternates = alternatesFor(path);
  return LOCALES.map((l) => ({ url: absolute(path, l), alternates, ...rest }));
}

/**
 * Articles come from the database, not from the ARTICLES constant.
 *
 * They used to come from `allArticleSlugs()`, which reads the hardcoded array
 * in lib/insights-data.ts — while the article PAGE reads the Article table. The
 * two agree only where somebody has run scripts/import-articles.ts, so on a
 * database nobody had imported into, the sitemap advertised eight URLs and
 * every one of them returned 404.
 *
 * A sitemap is a claim about what exists. Reading the same source the page
 * reads means it cannot make that claim wrongly again, whatever the table
 * happens to hold.
 *
 * Marketplace slugs stay on the static list deliberately: those pages ARE the
 * static content, so the list and the pages cannot disagree.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = LOCALISED_ROUTES.flatMap((path) =>
    localisedEntries(path, {
      changeFrequency: path === "" || path === "/marketplace" ? "daily" : "weekly",
      priority: path === "" ? 1 : path === "/marketplace" ? 0.9 : 0.7,
    }),
  );

  const unlocalised: MetadataRoute.Sitemap = UNLOCALISED_ROUTES.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const opportunities = allOpportunitySlugs().flatMap((slug) =>
    localisedEntries(`/marketplace/${slug}`, { changeFrequency: "weekly", priority: 0.6 }),
  );

  /**
   * Articles are listed in English only, deliberately.
   *
   * /fr/insights/<slug> is a real, reachable page — but it renders the English
   * article, because article bodies live in the database and their strings have
   * never been through extraction and translation the way the page copy has.
   * Everything else here is genuinely translated: /fr/about, /fr/pricing and
   * /fr/marketplace/accra-finpay were each checked against their English
   * counterpart and differ.
   *
   * Declaring hreflang="fr" for a page that is in English is not a small
   * inaccuracy. It is the specific thing hreflang exists to prevent, and
   * Google treats a language claim it can see is false as a reason to distrust
   * the cluster rather than one entry in it.
   *
   * So the day those articles are translated, wrap this in localisedEntries()
   * like the rest — the URLs already work.
   *
   * publishedSlugs() degrades to [] if the database cannot answer, so a sitemap
   * that is short is preferable to one that 500s — and to one that lies.
   */
  const articles: MetadataRoute.Sitemap = (await publishedSlugs()).map((slug) => ({
    url: `${base}/insights/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...unlocalised, ...opportunities, ...articles];
}
