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
 * The canonical URL is NOT declared here. It is sent as a `Link` header from
 * middleware — see the note there.
 *
 * It used to be `alternates.canonical: "./"`, which Next resolves against the
 * current pathname. That was right while every locale was prefixed, and became
 * half-right the moment English moved to the root: the English pages are still
 * ROUTED at /en/…, so a prerendered page baked its build-time route and /about
 * declared itself canonical at /en/about — a URL that now 308s away. Only the
 * dynamically rendered pages, resolving at request time, got it right.
 *
 * A canonical pointing at a redirect is worse than no canonical: it is a
 * conflicting signal about the same page. Middleware is the one place that sees
 * the address the visitor actually used, before any rewrite, so that is where
 * it is now built.
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
      // English is the bare domain. Pointing en or x-default at /en would aim
      // both at a URL that 308s, which is the one thing an alternate must
      // never be — a crawler following it is told the page it was just given
      // lives somewhere else.
      languages: {
        en: "/",
        fr: "/fr",
        es: "/es",
        ar: "/ar",
        "x-default": "/",
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
