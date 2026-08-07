"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { NAV } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/actions/auth";
import { Logo } from "./logo";
import { usePresence } from "@/lib/use-motion";
import { useTl, useLocale, useT } from "@/components/i18n/locale-provider";
import { localePath, splitLocale } from "@/lib/i18n/config";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

type NavUser = { name: string | null; email: string; role: string };
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

export function Navbar() {
  const pathname = usePathname();
  const tl = useTl();
  const t = useT();
  const locale = useLocale();
  /** Keeps navigation inside the current language instead of dropping the
   *  visitor back into English on the first click. */
  const lp = (href: string) => (href.startsWith("/") ? localePath(href, locale) : href);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  /** Which drawer section is expanded. One at a time — an accordion. */
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  // Keeps each panel mounted while it animates out. React unmounts on state
  // change, so without this the exit transition never gets a frame to run in
  // and both simply vanish.
  const menu = usePresence(open !== null, 180);
  const drawer = usePresence(mobileOpen, 340);

  // Which menu to keep on screen while it closes. `open` is already null by
  // then, so rendering on `open` alone would unmount the panel a frame before
  // its exit animation could run. Held as state and set alongside `open`
  // rather than assigned during render, which is not allowed to read or write
  // a ref.
  const [lastMenu, setLastMenu] = useState<string | null>(null);
  const visibleMenu = open ?? lastMenu;
  const [user, setUser] = useState<NavUser | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setUser(d.user ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const dashHref = user && ADMIN_ROLES.has(user.role) ? "/admin" : "/dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Escape closes the drawer, and focus returns to the button that opened it —
  // without this a keyboard user is dropped at the top of the document after
  // closing, with no idea where they were.
  useEffect(() => {
    if (!mobileOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Route changes must dismiss the drawer. Tapping a link to the page you are
  // already on does not fire the link's own onClick close in every case, and a
  // drawer left open over the new page reads as a broken navigation.
  //
  // Adjusted during render rather than in an effect: React re-runs this pass
  // immediately with the corrected state, so the drawer is already closed on
  // the first paint of the new route instead of flashing open for one frame.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMobileSection(null);
  }

  /**
   * The home hero is now a full-bleed dark photograph, so the unscrolled navbar
   * sits on top of it. Its default ink-on-transparent styling measured as
   * near-black text over that image — invisible.
   *
   * Keyed to the route rather than to a scroll threshold because only the home
   * page has a dark hero; every other page starts on paper and still wants the
   * dark treatment. Once scrolled anywhere, the glass background takes over and
   * dark text is correct again.
   *
   * Compared against the path WITHOUT its locale prefix. This read
   * `pathname === "/"`, and once routing moved every page under a locale the
   * home page became /en, /fr, /es or /ar — so the comparison was false
   * everywhere, and the near-black-on-photograph problem this whole block
   * exists to prevent came straight back, on every language including English.
   */
  const { path: barePath } = splitLocale(pathname);
  const onDarkHero = barePath === "/" && !scrolled;

  return (
    <header
      data-tone={onDarkHero ? "light" : "dark"}
      className={cn(
        "fixed inset-x-0 top-0 transition-all duration-300",
        /*
         * The drawer lives inside this header, and the header is
         * `position: fixed` with a z-index — which makes it a STACKING CONTEXT.
         * Every z-index on the drawer is therefore resolved against its
         * siblings in here, not against the page, so no value on the drawer
         * could ever lift it above the cookie banner (z-150) or the chat
         * launcher (z-120) sitting at the root. Raising those numbers looked
         * like it worked and changed nothing: elementsFromPoint over the
         * drawer's language row still returned "Accept all".
         *
         * The context itself has to move. Only while the drawer is open, so the
         * header keeps its normal place in the stack the rest of the time.
         */
        mobileOpen ? "z-[200]" : "z-50",
        scrolled ? "glass border-b border-ink/[0.07] shadow-[0_1px_0_rgba(0,0,0,0.02)]" : "bg-transparent"
      )}
    >
      <nav className="container-x flex h-18 items-center justify-between" onMouseLeave={() => setOpen(null)}>
        <Logo invert={onDarkHero} />

        {/* desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((group, groupIndex) => {
            const hasMenu = !!group.columns;
            /**
             * Panels near the end of the bar are anchored to their trigger's
             * RIGHT edge instead of centred on it.
             *
             * Centring a 640px panel on the last trigger put its right edge at
             * x=1096 in a 1280 viewport, while the language button sits at
             * 966–1025 — so the panel covered the entire column beneath the
             * language switcher and the CTAs. elementFromPoint just under that
             * button returned the mega panel, not the switcher: the last menu
             * really did own all the space after it.
             */
            const alignEnd = groupIndex >= NAV.length - 2;
            return (
              <li key={tl(group.label)} className="relative" onMouseEnter={() => {
                  setOpen(hasMenu ? group.label : null);
                  if (hasMenu) setLastMenu(group.label);
                }}>
                {group.href ? (
                  <Link
                    href={lp(group.href!)}
                    className={cn(
                      "label-cta inline-flex items-center gap-1 rounded-[var(--radius-button)] px-3.5 py-2 text-[0.68rem] transition-colors",
                      onDarkHero ? "text-white/85 hover:text-white" : "text-ink/75 hover:text-ink"
                    )}
                  >
                    {tl(group.label)}
                  </Link>
                ) : (
                  <button
                    className={cn(
                      "label-cta inline-flex items-center gap-1 rounded-[var(--radius-button)] px-3.5 py-2 text-[0.68rem] transition-colors",
                      onDarkHero
                        ? open === group.label ? "text-white" : "text-white/85 hover:text-white"
                        : open === group.label ? "text-ink" : "text-ink/75 hover:text-ink"
                    )}
                    aria-expanded={open === group.label}
                  >
                    {tl(group.label)}
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform duration-200", open === group.label && "rotate-180")}
                    />
                  </button>
                )}

                {hasMenu && menu.mounted && visibleMenu === group.label && (
                  <div
                    data-state={menu.state}
                    className={cn(
                      "anim-menu absolute top-full z-50 pt-3",
                      alignEnd ? "end-0" : "left-1/2 -translate-x-1/2",
                    )}
                  >
                      <div className="glass-panel grid w-[min(90vw,640px)] grid-cols-2 gap-2 rounded-[var(--radius-button)] border border-ink/[0.08] p-3">
                        {group.columns!.map((col) => (
                          <div key={tl(col.title)} className="rounded-2xl p-2">
                            <p className="label-cta px-3 pb-1.5 pt-2 text-[0.62rem] text-ink/60">
                              {tl(col.title)}
                            </p>
                            {col.links.map((link) => (
                              <Link
                                key={link.href}
                                href={lp(link.href)}
                                className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-brand-50"
                              >
                                {link.icon && (
                                  <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-[var(--radius-button)] border border-ink/10 text-brand-600 transition-colors group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
                                    <link.icon className="h-4 w-4" />
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <span className="label-cta block text-[0.66rem] text-ink">{tl(link.label)}</span>
                                  {link.description && (
                                    <span className="mt-0.5 block text-xs leading-snug text-ink/65">{tl(link.description)}</span>
                                  )}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* desktop CTAs */}
        {/* Entering the controls dismisses any open mega menu. Reaching for the
            language switcher is an unambiguous signal that you are done with
            the nav menu, and without this the panel stays open under the
            switcher's own dropdown for as long as the pointer is in the bar. */}
        <div className="hidden items-center gap-2 lg:flex" onMouseEnter={() => setOpen(null)}>
          <LanguageSwitcher onDark={onDarkHero} />
          {user ? (
            <>
              <Button
                href={dashHref}
                variant="ghost"
                size="sm"
                className={onDarkHero ? "text-white/85 hover:bg-white/10 hover:text-white" : undefined}
              >
                {tl("Dashboard")}
              </Button>
              <form action={logoutUser}>
                <button
                  type="submit"
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-[var(--radius-button)] border px-4 text-sm font-medium transition-colors",
                    onDarkHero
                      ? "border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                      : "border-ink/15 bg-white/60 text-ink hover:border-ink/30 hover:bg-white"
                  )}
                >
                  {tl("Sign out")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Button
                href="/login"
                variant="ghost"
                size="sm"
                className={onDarkHero ? "text-white/85 hover:bg-white/10 hover:text-white" : undefined}
              >
                {t("nav.signIn")}
              </Button>
              <Button href="/register" variant="primary" size="sm">
                {t("nav.getStarted")}
              </Button>
            </>
          )}
        </div>

        {/* mobile toggle — the colour MUST follow onDarkHero like every other
            control here. It was hard-coded to text-ink, which put a near-black
            icon on the home page's dark hero photograph: invisible. */}
        <button
          ref={toggleRef}
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-button)] transition-colors lg:hidden",
            onDarkHero ? "text-white hover:bg-white/10" : "text-ink hover:bg-ink/5"
          )}
          onClick={() => setMobileOpen(true)}
          aria-label={tl("Open menu")}
          aria-expanded={mobileOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile drawer.
          Slides in from the right over the page rather than dropping the panel
          out of the header. The old version was pinned to `top-18`, so on the
          home page it opened against a transparent header and the hero photo
          showed through the seam; a full-height panel has no seam to get wrong
          and no dependency on the header's height staying in sync. */}
      {drawer.mounted && (
        <>
            {/* Scrim: dims the page so the drawer reads as above it, and gives
                a large tap target for dismissing without hunting for the X. */}
            <button
              type="button"
              aria-label={tl("Close menu")}
              data-state={drawer.state}
              onClick={() => {
                setMobileOpen(false);
                toggleRef.current?.focus();
              }}
              // Topmost while open. The drawer sat at z-50, under the chat
              // launcher (120) AND the cookie banner (150), both of which are
              // anchored bottom — exactly where the language row is. It is
              // aria-modal, so being under anything is wrong on its own terms:
              // a modal that other controls sit on top of is not modal.
              className="anim-fade fixed inset-0 z-[160] cursor-default bg-ink/50 backdrop-blur-[2px] lg:hidden"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label={tl("Site menu")}
              data-state={drawer.state}
              // anim-drawer carries ease-out-expo: fast to start, settling
              // rather than bouncing.
              className="anim-drawer fixed right-0 top-0 z-[161] flex h-dvh w-[min(88vw,22rem)] flex-col bg-paper shadow-[var(--shadow-lift)] lg:hidden"
            >
              {/* The drawer covers the site header, so it carries its own. */}
              <div className="flex h-18 flex-none items-center justify-between border-b border-ink/[0.07] px-5">
                <Logo />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    toggleRef.current?.focus();
                  }}
                  aria-label={tl("Close menu")}
                  className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-button)] text-ink transition-colors hover:bg-ink/5"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/*
                Rows divided by rules, one section open at a time.

                Every submenu used to render expanded, so the drawer was a single
                long scroll of thirty-odd links with nothing to tell one group
                from the next — the whole menu had to be read to find anything.
                An accordion means the top level fits on screen, which is what a
                menu is for: seeing the choices before making one.
              */}
              <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
            <div className="border-t border-ink/[0.07]">
              {NAV.map((group) => {
                const expanded = mobileSection === group.label;
                const panelId = `m-${group.label.replace(/\W+/g, "-").toLowerCase()}`;
                return group.href ? (
                  <Link
                    key={tl(group.label)}
                    href={lp(group.href!)}
                    onClick={() => setMobileOpen(false)}
                    className="label-cta flex items-center justify-between border-b border-ink/[0.07] px-5 py-3.5 text-[0.74rem] text-navy-700 transition-colors active:bg-brand-50"
                  >
                    {tl(group.label)}
                    <ChevronRight className="h-4 w-4 text-ink/25" />
                  </Link>
                ) : (
                  <div key={tl(group.label)} className="border-b border-ink/[0.07]">
                    <button
                      type="button"
                      onClick={() => setMobileSection(expanded ? null : group.label)}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      className="label-cta flex w-full items-center justify-between px-5 py-3.5 text-[0.74rem] text-navy-700 transition-colors active:bg-brand-50"
                    >
                      {tl(group.label)}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-ink/40 transition-transform duration-200",
                          expanded && "rotate-180",
                        )}
                      />
                    </button>
                    {expanded && (
                      <ul id={panelId} className="border-t border-ink/[0.06] bg-paper-2/50 py-1">
                        {group.columns!.flatMap((c) => c.links).map((link) => (
                          <li key={link.href}>
                            <Link
                              href={lp(link.href)}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 px-5 py-2.5 text-sm text-ink/70 transition-colors active:bg-brand-50 active:text-ink"
                            >
                              {link.icon && <link.icon className="h-4 w-4 flex-none text-brand-600" />}
                              <span className="min-w-0">{tl(link.label)}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col gap-3 px-5">
              {user ? (
                <>
                  <Button href={dashHref} variant="primary" size="lg" onClick={() => setMobileOpen(false)}>
                    {tl("Dashboard")}
                  </Button>
                  <form action={logoutUser} className="contents">
                    <button
                      type="submit"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex h-13 items-center justify-center rounded-[var(--radius-button)] border border-ink/15 bg-white px-8 text-base font-medium text-ink"
                    >
                      {tl("Sign out")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Button href="/register" variant="primary" size="lg" onClick={() => setMobileOpen(false)}>
                    {t("nav.getStarted")}
                  </Button>
                  <Button href="/login" variant="outline" size="lg" onClick={() => setMobileOpen(false)}>
                    {t("nav.signIn")}
                  </Button>
                </>
              )}
            </div>

            {/* Preferences, on the same ruled rhythm as the navigation above —
                these were two differently-padded rows floating under the
                buttons, one of them carrying its own px-5 inside a container
                that already had padding. */}
            <div className="mt-6 border-t border-ink/[0.07]">
              <div className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-3">
                <span className="text-sm text-ink/70">{tl("Appearance")}</span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-3">
                <span className="text-sm text-ink/70">{tl("Language")}</span>
                <LanguageSwitcher />
              </div>
            </div>
              </div>
            </div>
          </>
      )}
    </header>
  );
}
