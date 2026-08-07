import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media-store";
import { SITE_ORIGIN } from "@/lib/site-url";

/**
 * The image a page shows when it is shared.
 *
 * Every page on the site had no og:image at all — fourteen checked, fourteen
 * without — so every link posted to LinkedIn, WhatsApp or Slack rendered as a
 * bare grey card. For a marketplace whose listings are photographs of real
 * infrastructure, that is the difference between a link that gets opened and
 * one that does not.
 *
 * RESOLUTION ORDER, most specific first:
 *
 *   1. A real image the page already owns — a listing's hero, an article's
 *      cover. These are uploaded by the business or by staff, so they are the
 *      true picture of the thing being shared.
 *   2. An override a super admin has set for this exact path.
 *   3. An override a super admin has set as the site-wide default.
 *   4. A photograph from the site's own library, chosen per route, so /events
 *      shares the forum picture and /pricing shares the desk.
 *   5. The home hero, as the last resort.
 *
 * Steps 2 and 3 read the database. That is a build-time read for prerendered
 * pages, exactly like the translations already loaded here — so an override
 * takes effect on revalidation, which the media API triggers, rather than on
 * the next deploy.
 */

export type OgImage = { url: string; alt: string; width: number; height: number };

/** Facebook and LinkedIn both want 1200x630; anything else gets cropped. */
const OG_W = 1200;
const OG_H = 630;

const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_ORIGIN}${path}`);

/**
 * A photograph for each route, from the library the site already ships.
 *
 * Deliberately real photographs rather than a generated card with the page
 * title on it. The pages are about physical assets — a solar farm, a factory, a
 * skyline — and a picture of the thing beats a picture of its name.
 *
 * Longest prefix wins, so /services/roadshows takes the roadshow image and
 * /services falls back to the generic one.
 */
const ROUTE_IMAGE: [string, string, string][] = [
  ["/marketplace", "/img/skyline-figure.webp", "Investor reviewing opportunities against a city skyline"],
  ["/pricing", "/img/desk-report.webp", "A printed investment report on a desk"],
  ["/investors", "/img/handshake.webp", "Two people shaking hands after an agreement"],
  ["/businesses", "/img/factory.webp", "A working industrial facility"],
  ["/about", "/img/handshake.webp", "Two people shaking hands after an agreement"],
  ["/contact", "/img/desk-report.webp", "A printed investment report on a desk"],
  ["/events", "/img/forum.webp", "Delegates at an investment forum"],
  ["/insights", "/img/cover-market-intelligence.webp", "Market intelligence research"],
  ["/faq", "/img/desk-report.webp", "A printed investment report on a desk"],
  ["/register", "/img/handshake.webp", "Two people shaking hands after an agreement"],
  ["/services/roadshows", "/img/forum.webp", "Delegates at an investment forum"],
  ["/services", "/img/desk-report.webp", "A printed investment report on a desk"],
  ["/legal", "/img/desk-report.webp", "A printed investment report on a desk"],
];

const HOME: OgImage = {
  url: abs("/img/hero-tower.webp"),
  alt: "A cable-stayed bridge tower against a misty sky",
  width: OG_W,
  height: OG_H,
};

function routeDefault(path: string): OgImage {
  let best: [string, string, string] | null = null;
  for (const entry of ROUTE_IMAGE) {
    if ((path === entry[0] || path.startsWith(`${entry[0]}/`)) && (!best || entry[0].length > best[0].length)) {
      best = entry;
    }
  }
  return best ? { url: abs(best[1]), alt: best[2], width: OG_W, height: OG_H } : HOME;
}

/**
 * A super admin's override, if there is one.
 *
 * Stored in Setting rather than as a new column, because it is a handful of
 * key/value choices and a table already exists for exactly that. `cache()` so
 * a page rendering both the path override and the site default asks once.
 */
const overrideFor = cache(async (key: string): Promise<OgImage | null> => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key } });
    const mediaId = (setting?.value as { mediaId?: string } | null)?.mediaId;
    if (!mediaId) return null;

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      select: { storageKey: true, alt: true, originalName: true },
    });
    if (!asset) return null;

    return {
      url: abs(mediaUrl(asset.storageKey)),
      alt: asset.alt || asset.originalName,
      width: OG_W,
      height: OG_H,
    };
  } catch {
    // A share image is never worth failing a page render over.
    return null;
  }
});

/** The Setting key a super admin's per-path override lives under. */
export const ogSettingKey = (path: string) => `og:${path === "/" ? "home" : path}`;
export const OG_DEFAULT_KEY = "og:default";

/**
 * `own` takes either shape the codebase already produces: a raw storageKey
 * (an article's cover, straight off the model) or a resolved src (a listing
 * hero, which lib/listing-heroes.ts has already run through mediaUrl). Making
 * the caller normalise would mean every call site knowing which it holds.
 */
export async function ogImageFor(
  path: string,
  own?: { storageKey?: string | null; src?: string | null; alt?: string | null } | null,
): Promise<OgImage> {
  // 1. The page's own real image — a listing hero, an article cover.
  if (own?.storageKey) {
    return { url: abs(mediaUrl(own.storageKey)), alt: own.alt || "", width: OG_W, height: OG_H };
  }
  if (own?.src) {
    return { url: abs(own.src), alt: own.alt || "", width: OG_W, height: OG_H };
  }
  // 2 and 3. What a super admin chose, for this page or for the site.
  return (
    (await overrideFor(ogSettingKey(path))) ??
    (await overrideFor(OG_DEFAULT_KEY)) ??
    // 4 and 5.
    (path === "/" ? HOME : routeDefault(path))
  );
}

/** The absolute canonical URL for a path — og:url wants one, and had none. */
export const ogUrl = (path: string) => abs(path === "/" ? "" : path);
