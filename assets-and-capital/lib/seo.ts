import { SITE } from "@/lib/content";

/**
 * Site-level structured data.
 *
 * Scoped hard to what is actually true today. There are no real businesses on
 * the marketplace yet, so there is no Product, no Offer, no aggregateRating and
 * no Review here — inventing them would be the fastest route to a manual action
 * against the domain, and the listings are sample data. Organization and
 * WebSite describe the company and the site, both of which exist.
 *
 * FinancialService rather than plain Organization: it is the narrowest type
 * that is honestly true, and a narrower type is what lets an answer engine say
 * what this company does rather than that it is a company.
 */
export function organisationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "@id": `https://${SITE.domain}/#organisation`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: `https://${SITE.domain}`,
    logo: `https://${SITE.domain}/img/logo.png`,
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phone,
    // What the business does, stated once, in the vocabulary a search or
    // answer engine indexes on.
    knowsAbout: [
      "private capital",
      "capital raising",
      "investor mandates",
      "deal origination",
      "growth equity",
      "African private markets",
    ],
    areaServed: { "@type": "Place", name: "Africa" },
  };
}

/**
 * WebSite, with the search action pointing at the marketplace filter.
 *
 * Only claim SearchAction if the URL it describes really does run a search —
 * a target that 404s or ignores the parameter is worse than omitting it.
 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `https://${SITE.domain}/#website`,
    url: `https://${SITE.domain}`,
    name: SITE.name,
    publisher: { "@id": `https://${SITE.domain}/#organisation` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://${SITE.domain}/marketplace?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Breadcrumbs for a nested page. Pass the trail without the home entry. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `https://${SITE.domain}${c.path === "/" ? "" : c.path}`,
    })),
  };
}
