import Link from "next/link";
import { Mail, Globe } from "lucide-react";
import { SITE } from "@/lib/content";
import { NewsletterForm } from "./newsletter-form";
import { CurrencySwitcher } from "./currency-switcher";

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
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="container-x relative py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          {/* brand + newsletter */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-800">
                <span className="font-display text-[15px] font-bold text-white">A</span>
                <span className="absolute bottom-1 right-1.5 h-1.5 w-1.5 rounded-full bg-navy-400" aria-hidden />
              </span>
              <span className="font-display text-[17px] font-semibold">
                Assets <span className="text-navy-500">&amp;</span> Capital
              </span>
            </div>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-white/60">
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
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-white/25 hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white/65">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/65 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="hidden text-white/65 md:block">
              {SITE.domain} · Capital-raising & deal-making platform.
            </p>
            <CurrencySwitcher variant="dark" />
          </div>
        </div>
      </div>
    </footer>
  );
}
