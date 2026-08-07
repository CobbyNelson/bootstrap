import { isLocale, type Locale } from "@/lib/i18n/config";
import { getTranslator } from "@/lib/i18n/store";
import { SITE } from "@/lib/content";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ChatBox } from "@/components/chat/chat-box";
import { PageBeacon } from "@/components/analytics/page-beacon";
import { JsonLd } from "@/components/seo/json-ld";
import { organisationSchema, websiteSchema } from "@/lib/seo";
import type { Metadata } from "next";

/**
 * Canonical URL for every public page.
 *
 * "./" is resolved by Next against metadataBase AND the current pathname, so
 * one declaration here gives each route its own correct canonical instead of
 * pointing the whole site at the homepage — which is what a literal URL in a
 * layout would do.
 *
 * It matters here specifically because the marketplace takes filter query
 * parameters: without a canonical, every combination is a separate URL
 * competing with the others for the same content.
 */
/**
 * Metadata for the whole localised tree.
 *
 * generateMetadata rather than a static object, because the title and
 * description are copy like any other and were the last thing still rendering
 * in English — the browser tab on /ar read "Where quality assets meet ready
 * capital" while the page beneath it was Arabic. Search results and shared
 * links show this text, so it is the most public string on the site.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslator((isLocale(locale) ? locale : "en") as Locale);

  return {
    title: {
      default: `${SITE.name} — ${t.tl(SITE.tagline)}`,
      template: `%s · ${SITE.name}`,
    },
    description: t.tl(SITE.description),
    alternates: {
      canonical: "./",
      languages: {
        en: "/en",
        fr: "/fr",
        es: "/es",
        ar: "/ar",
        "x-default": "/en",
      },
    },
    openGraph: {
      title: `${SITE.name} — ${t.tl(SITE.tagline)}`,
      description: t.tl(SITE.description),
      locale,
    },
  };
}

/**
 * Kwaku sits here rather than in the root layout so he does not appear on the
 * pre-launch gate, which has no navigation and nothing for him to answer about.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // From the route segment, NOT from headers(). A header read here would make
  // every page under this layout dynamic — the prerender regression that has
  // already been reintroduced three times.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslator((isLocale(locale) ? locale : "en") as Locale);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-button)] focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        {t.tl("Skip to content")}
      </a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
      <ChatBox />
      {/* Public pages only: the gate and the admin area are not audience. */}
      <PageBeacon />
      {/* Sitewide, not per page: one Organization and one WebSite node that
          everything else can reference by @id. */}
      <JsonLd data={organisationSchema()} />
      <JsonLd data={websiteSchema()} />
    </>
  );
}
