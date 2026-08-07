"use client";

import { useEffect, useRef, useState } from "react";
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
  const wrap = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  /**
   * Closing is DELAYED, and the panel touches the button.
   *
   * The previous version closed on the wrapper's mouseleave and floated the
   * panel on a 4px margin. Between the button and the panel was therefore a
   * strip belonging to neither, and crossing it — which is what selecting a
   * language requires — fired mouseleave and shut the menu. What survived was a
   * narrow vertical corridor: move straight down fast enough and it worked, and
   * any diagonal towards an option lost it.
   *
   * Two fixes, because either alone still leaves a way to lose it: the panel now
   * sits in a wrapper flush to the button with its inset as PADDING, so the
   * pointer never leaves the element; and leaving cancels after a beat rather
   * than instantly, which forgives a pointer that clips a corner.
   */
  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(false), 220);
  };
  useEffect(() => cancelClose, []);

  // A menu opened by hover still has to be dismissable by someone who never
  // hovers: Escape returns focus to the button, and a click anywhere else
  // closes it. Without these the only way out was to find the panel again.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={wrap}
      className={cn("relative", className)}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={closeSoon}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
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
        // end-0 rather than left-0: in Arabic the whole layout flips, and a menu
        // pinned to the left would hang off the wrong edge. pt-1 on THIS element
        // rather than mt-1 on the list keeps the gap inside the hoverable area.
        <div className="absolute end-0 top-full z-[130] pt-1">
          <ul
            role="menu"
            className="min-w-[10rem] overflow-hidden rounded-[var(--radius-button)] border border-ink/10 bg-paper py-1 shadow-[var(--shadow-card)]"
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
        </div>
      )}
    </div>
  );
}
