"use client";

import { useTl, useLocale } from "@/components/i18n/locale-provider";
import { localePath } from "@/lib/i18n/config";
import Link from "next/link";
import { Mail, Globe } from "lucide-react";
import { Logo } from "./logo";
import { SITE } from "@/lib/content";
import { NewsletterForm } from "./newsletter-form";
import { CurrencySwitcher } from "./currency-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CookieSettingsLink } from "./cookie-settings-link";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.02 8h4.96v16H.02V8zm7.98 0h4.75v2.2h.07c.66-1.2 2.28-2.47 4.7-2.47 5.03 0 5.96 3.3 5.96 7.6V24h-4.96v-7.1c0-1.7-.03-3.9-2.38-3.9-2.38 0-2.75 1.86-2.75 3.78V24H8V8z" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.9 1.5h3.68l-8.04 9.19L24 22.5h-7.4l-5.8-7.58-6.63 7.58H.49l8.6-9.83L0 1.5h7.59l5.24 6.93L18.9 1.5zm-1.3 18.8h2.04L6.49 3.6H4.3L17.6 20.3z" />
    </svg>
  );
}

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "For Investors",
    links: [
      { label: "Why Assets & Capital", href: "/investors" },
      { label: "Browse marketplace", href: "/marketplace" },
      { label: "Build your mandate", href: "/register/investor" },
      { label: "Roadshows", href: "/services/roadshows" },
    ],
  },
  {
    title: "For Businesses",
    links: [
      { label: "How it works", href: "/businesses" },
      { label: "List your business", href: "/register/business" },
      { label: "Business plan writing", href: "/services/business-plan" },
      { label: "Financial modelling", href: "/services/financial-modelling" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Insights", href: "/insights" },
      { label: "Events", href: "/events" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of service", href: "/legal/terms" },
      { label: "Cookie policy", href: "/legal/cookies" },
      { label: "Disclosures", href: "/legal/disclosures" },
    ],
  },
];

export function Footer() {
  const tl = useTl();
  const locale = useLocale();
  const lp = (href: string) => (href.startsWith("/") ? localePath(href, locale) : href);
  return (
    <footer className="relative overflow-hidden border-t border-ink/10 bg-paper-2 text-ink">
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="container-x relative py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          {/* brand + newsletter */}
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-[0.95rem] leading-relaxed text-ink/70">
              {SITE.tagline} We connect vetted businesses with a global network of ready investors — for
              capital raising, partnerships, and market expansion.
            </p>
            <NewsletterForm />
            <div className="mt-6 flex items-center gap-2">
              {[
                { icon: LinkedInIcon, href: "#", label: "LinkedIn" },
                { icon: XIcon, href: "#", label: "X" },
                { icon: Mail, href: `mailto:${SITE.email}`, label: "Email" },
                { icon: Globe, href: "#", label: "Website" },
              ].map((s) => (
                <a
                  key={tl(s.label)}
                  href={s.href}
                  aria-label={tl(s.label)}
                  className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] border border-ink/15 text-ink/60 transition-colors hover:border-ink/35 hover:text-ink"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={tl(col.title)}>
                <p className="label-cta text-[0.68rem] text-brand-600">{tl(col.title)}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={lp(l.href)} className="text-sm text-ink/70 transition-colors hover:text-brand-700">
                        {tl(l.label)}
                      </Link>
                    </li>
                  ))}
                  {/* Consent withdrawal has to be permanently reachable, so it
                      lives with the legal links rather than only in the banner. */}
                  {col.title === "Legal" && (
                    <li>
                      <CookieSettingsLink />
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-ink/10 pt-8 text-sm text-ink/65 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <p className="hidden text-ink/65 md:block">
              {SITE.domain} · Capital-raising & deal-making platform.
            </p>
            {/* Appearance lives here rather than in the header: it is a
                preference set once, not a navigation control, and the header
                was carrying it beside the primary CTAs. */}
            <ThemeToggle />
            <CurrencySwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
