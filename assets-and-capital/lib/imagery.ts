/**
 * Mood & design imagery.
 *
 * These are art-directed, non-documentary images: architectural abstracts,
 * editorial still lifes and sector mood shots. They illustrate sections — they
 * never stand in for a real business, person or event.
 *
 * Deliberately NOT used for marketplace listings. Those cards represent real
 * businesses, so a synthetic photo there would misrepresent them; they keep
 * their gradient/initial treatment until a business supplies its own asset.
 *
 * Files live in /public/img (see docs/IMAGERY.md for the source list).
 */
export const IMAGERY = {
  heroTower: {
    src: "/img/hero-tower.webp",
    alt: "Abstract upward view of a glass office tower at blue hour",
  },
  ctaTexture: {
    src: "/img/cta-texture.webp",
    alt: "",
  },
  deskReport: {
    src: "/img/desk-report.webp",
    alt: "A printed financial report, pen and reading glasses on a desk",
  },
  forum: {
    src: "/img/forum.webp",
    alt: "A business forum auditorium seen from the back of the room",
  },
  solar: {
    src: "/img/solar-farm.webp",
    alt: "Aerial view of rows of solar panels across open landscape",
  },
  factory: {
    src: "/img/factory.webp",
    alt: "Interior of a modern manufacturing facility",
  },
  skylineFigure: {
    src: "/img/skyline-figure.webp",
    alt: "A person in business dress looking out over a city skyline at dusk",
  },
  handshake: {
    src: "/img/handshake.webp",
    alt: "Two people shaking hands across a boardroom table",
  },
  coverMarketIntelligence: {
    src: "/img/cover-market-intelligence.webp",
    alt: "Overlapping printed charts at shallow focus, no figures legible",
  },
  coverCountryReport: {
    src: "/img/cover-country-report.webp",
    alt: "A folded paper map on a desk with a magnifying glass and pencil",
  },
  coverInvestmentGuide: {
    src: "/img/cover-investment-guide.webp",
    alt: "An open hardback book with a ribbon marker beside a fountain pen",
  },
  coverInterview: {
    src: "/img/cover-interview.webp",
    alt: "Two empty armchairs facing each other in a softly lit studio",
  },
} as const;

export type ImageryKey = keyof typeof IMAGERY;

/**
 * Editorial covers, keyed by an article's `type`.
 *
 * One image per category rather than per article: a category has a stable
 * meaning, so the same cover reading "Market Intelligence" across several
 * pieces is a signal rather than a repetition. Adding an article of an existing
 * type needs no new asset.
 *
 * Three of these reuse mood images that already existed but were never wired
 * to anything — desk-report, handshake and solar-farm — which is exactly the
 * use docs/IMAGERY.md designates for them.
 *
 * A type with no entry falls back to the gradient the component already draws,
 * so this map never has to be exhaustive.
 */
export const ARTICLE_COVERS: Record<string, { src: string; alt: string }> = {
  "Market Intelligence": IMAGERY.coverMarketIntelligence,
  "Country Report": IMAGERY.coverCountryReport,
  "Investment Guide": IMAGERY.coverInvestmentGuide,
  Interview: IMAGERY.coverInterview,
  "White Paper": IMAGERY.deskReport,
  "Case Study": IMAGERY.handshake,
  ESG: IMAGERY.solar,

  /* The home-page teasers in lib/content.ts label the same articles with a
     reader-facing category instead of the editorial type — "For Businesses"
     is the fundable-pitch Investment Guide, "Deal Structuring" is the private
     credit vs. equity White Paper. Aliasing them here means the teaser and the
     article it links to show the same cover instead of disagreeing. */
  "For Businesses": IMAGERY.coverInvestmentGuide,
  "Deal Structuring": IMAGERY.deskReport,
};

/* ─────────────────────────── listing imagery ───────────────────────────────
 *
 * STANDING RULE — listing imagery must be SPECIFIC to the business. Everything
 * in this section is a temporary stand-in used only until real listings supply
 * their own images, and a business's uploads replace it outright rather than
 * mixing with it. See docs/IMAGERY.md. As real listings arrive these maps
 * should SHRINK, not grow.
 * ------------------------------------------------------------------------- */

/**
 * Sector imagery for listing cards.
 *
 * This relaxes what rule 1 of docs/IMAGERY.md originally forbade, and the
 * reasoning behind that rule still stands, so the relaxation is narrow:
 *
 *   • Keyed by SECTOR, never by company. Nothing here is generated from a
 *     business's name, so no image can be read as a photograph of that
 *     specific company's asset — it says "renewable energy", not "this is
 *     Sahara Solar Grid's plant".
 *   • Every alt text names the sector, not the business, so a screen reader
 *     announces it as category imagery.
 *   • `Opportunity.image` always wins. The moment a business supplies its own
 *     asset it replaces this, which is exactly the escape hatch the original
 *     rule described.
 *
 * A sector with no entry still falls back to the gradient-and-initials
 * treatment, so this map never has to be exhaustive.
 */
export const SECTOR_IMAGERY: Record<string, { src: string; alt: string }> = {
  "Renewable Energy": { src: "/img/solar-farm.webp", alt: "Renewable energy sector imagery" },
  FinTech: { src: "/img/sector-fintech.webp", alt: "Financial technology sector imagery" },
  "Digital Health": { src: "/img/sector-digital-health.webp", alt: "Digital health sector imagery" },
  Healthcare: { src: "/img/sector-healthcare.webp", alt: "Healthcare sector imagery" },
  "Transport & Logistics": { src: "/img/sector-logistics.webp", alt: "Transport and logistics sector imagery" },
  "Real Estate": { src: "/img/sector-real-estate.webp", alt: "Real estate sector imagery" },
  "Natural Resources": { src: "/img/sector-natural-resources.webp", alt: "Natural resources sector imagery" },
  Infrastructure: { src: "/img/sector-infrastructure.webp", alt: "Infrastructure sector imagery" },
  Hospitality: { src: "/img/sector-hospitality.webp", alt: "Hospitality sector imagery" },
  "Food & Beverage": { src: "/img/sector-food-beverage.webp", alt: "Food and beverage sector imagery" },
  Education: { src: "/img/sector-education.webp", alt: "Education sector imagery" },
  Agriculture: { src: "/img/sector-agriculture.webp", alt: "Agriculture sector imagery" },
};

/**
 * The image a listing card should show, in priority order:
 * the business's own asset, then sector imagery, then nothing (the caller
 * keeps its gradient).
 */
export function listingImage(o: { sector: string; image?: string; name: string }) {
  // The alt deliberately does NOT claim the image was supplied by the business
  // or depicts its assets — an override may still be category imagery chosen by
  // hand (see Coastal Wind Partners). Describing it as "<sector> imagery" is the
  // only claim that stays true whoever set it.
  if (o.image) return { src: o.image, alt: `${o.sector} imagery` };
  return SECTOR_IMAGERY[o.sector] ?? null;
}

/**
 * Supporting sector imagery, so a listing that has not uploaded its own gallery
 * still has more than one frame to show.
 *
 * Same rule as SECTOR_IMAGERY and for the same reason: keyed by SECTOR, and
 * every alt names the sector rather than the business, so nothing here can be
 * read as a photograph of that company's assets. Sectors with no entry simply
 * show a single image instead of a slider — padding a listing with unrelated
 * photos to manufacture a carousel would be worse than one honest frame.
 */
const SECTOR_IMAGERY_SUPPORTING: Record<string, { src: string; alt: string }[]> = {
  "Renewable Energy": [
    { src: "/img/sector-wind.webp", alt: "Renewable energy sector imagery" },
    { src: "/img/factory.webp", alt: "Industrial operations sector imagery" },
  ],
  Infrastructure: [
    { src: "/img/hero-tower.webp", alt: "Infrastructure sector imagery" },
    { src: "/img/skyline-figure.webp", alt: "Urban development sector imagery" },
  ],
  "Transport & Logistics": [{ src: "/img/factory.webp", alt: "Industrial operations sector imagery" }],
  "Natural Resources": [{ src: "/img/factory.webp", alt: "Industrial operations sector imagery" }],
  "Real Estate": [{ src: "/img/skyline-figure.webp", alt: "Urban development sector imagery" }],
  FinTech: [{ src: "/img/desk-report.webp", alt: "Financial analysis sector imagery" }],
};

/**
 * Every frame a listing should show, in priority order. A business's own
 * uploads (passed in) always win outright; otherwise the sector set is used.
 * Deduplicated by src so an override that matches the sector image does not
 * appear twice.
 */
export function listingImages(o: { sector: string; image?: string; name: string }) {
  const primary = listingImage(o);
  const supporting = SECTOR_IMAGERY_SUPPORTING[o.sector] ?? [];
  const all = [primary, ...supporting].filter(Boolean) as { src: string; alt: string }[];
  const seen = new Set<string>();
  return all.filter((img) => (seen.has(img.src) ? false : (seen.add(img.src), true)));
}

/**
 * Responsive sources for a library image.
 *
 * Every /img photograph is built at two widths: the full 1376 and a 768 for
 * phones. Without a srcSet a phone downloads the desktop frame and throws most
 * of it away — the single most expensive thing a small screen can do on a slow
 * connection, and the majority of this site's audience is on one.
 *
 * Returns undefined for anything without a companion variant (the logos), so
 * callers can spread it unconditionally.
 */
export function srcSetFor(src: string): string | undefined {
  if (!src.endsWith(".webp")) return undefined;
  return `${src.slice(0, -5)}-768.webp 768w, ${src} 1376w`;
}
