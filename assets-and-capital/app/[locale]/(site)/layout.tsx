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
export const metadata: Metadata = {
  alternates: {
    canonical: "./",
    /**
     * Every language declares every other, including itself, plus x-default.
     * Without this the four versions of a page compete as duplicates instead
     * of being understood as one page in four languages — and a French reader
     * gets served the English one.
     *
     * "./" is resolved per-route against metadataBase, so these stay correct
     * on every path without being written out page by page.
     */
    languages: {
      en: "./",
      fr: "/fr",
      es: "/es",
      ar: "/ar",
      "x-default": "./",
    },
  },
};

/**
 * Kwaku sits here rather than in the root layout so he does not appear on the
 * pre-launch gate, which has no navigation and nothing for him to answer about.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-button)] focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
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
