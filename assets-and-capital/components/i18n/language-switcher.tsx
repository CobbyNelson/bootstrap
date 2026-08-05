"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { LOCALES, LOCALE_META, localePath, splitLocale, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Language switcher.
 *
 * Plain links, not a client-side state change: each language is a real URL, so
 * switching is a navigation the browser and any crawler both understand, and
 * the chosen language survives being bookmarked or shared.
 *
 * It swaps the prefix on the CURRENT path rather than sending everyone home —
 * being thrown back to the homepage for choosing your own language is the most
 * common way this control gets built wrong.
 *
 * Each language is written in itself. Someone who cannot read the current
 * language still has to be able to find theirs.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname() || "/";
  const { locale: current, path } = splitLocale(pathname);
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative", className)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] px-2.5 text-ink/70 transition-colors hover:text-ink"
      >
        <Globe className="h-4 w-4" />
        <span className="label-cta text-[0.66rem]">{current.toUpperCase()}</span>
      </button>

      {open && (
        <ul
          role="menu"
          // start-0 rather than left-0: in Arabic the whole layout flips, and a
          // menu pinned to the left would hang off the wrong edge.
          className="absolute end-0 top-full z-50 mt-1 min-w-[10rem] overflow-hidden rounded-[var(--radius-button)] border border-ink/10 bg-paper py-1"
        >
          {LOCALES.map((l: Locale) => (
            <li key={l} role="none">
              <a
                role="menuitem"
                href={localePath(path, l)}
                hrefLang={LOCALE_META[l].hreflang}
                lang={LOCALE_META[l].hreflang}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2 text-sm transition-colors hover:bg-brand-50",
                  l === current ? "text-ink" : "text-ink/70",
                )}
              >
                <span>{LOCALE_META[l].label}</span>
                {l === current && <Check className="h-3.5 w-3.5 text-brand-600" />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
