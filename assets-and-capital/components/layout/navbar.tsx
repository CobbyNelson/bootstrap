"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/actions/auth";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type NavUser = { name: string | null; email: string; role: string };
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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
   */
  const onDarkHero = pathname === "/" && !scrolled;

  return (
    <header
      data-tone={onDarkHero ? "light" : "dark"}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass border-b border-ink/[0.07] shadow-[0_1px_0_rgba(0,0,0,0.02)]" : "bg-transparent"
      )}
    >
      <nav className="container-x flex h-18 items-center justify-between" onMouseLeave={() => setOpen(null)}>
        <Logo invert={onDarkHero} />

        {/* desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((group) => {
            const hasMenu = !!group.columns;
            return (
              <li key={group.label} className="relative" onMouseEnter={() => setOpen(hasMenu ? group.label : null)}>
                {group.href ? (
                  <Link
                    href={group.href}
                    className={cn(
                      "label-cta inline-flex items-center gap-1 rounded-[var(--radius-button)] px-3.5 py-2 text-[0.68rem] transition-colors",
                      onDarkHero ? "text-white/85 hover:text-white" : "text-ink/75 hover:text-ink"
                    )}
                  >
                    {group.label}
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
                    {group.label}
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform duration-200", open === group.label && "rotate-180")}
                    />
                  </button>
                )}

                <AnimatePresence>
                  {hasMenu && open === group.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
                    >
                      <div className="glass grid w-[min(90vw,640px)] grid-cols-2 gap-2 rounded-[var(--radius-button)] border border-ink/[0.08] p-3">
                        {group.columns!.map((col) => (
                          <div key={col.title} className="rounded-2xl p-2">
                            <p className="label-cta px-3 pb-1.5 pt-2 text-[0.62rem] text-ink/60">
                              {col.title}
                            </p>
                            {col.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-brand-50"
                              >
                                {link.icon && (
                                  <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-[var(--radius-button)] border border-ink/10 text-brand-600 transition-colors group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
                                    <link.icon className="h-4 w-4" />
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <span className="label-cta block text-[0.66rem] text-ink">{link.label}</span>
                                  {link.description && (
                                    <span className="mt-0.5 block text-xs leading-snug text-ink/65">{link.description}</span>
                                  )}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        {/* desktop CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Button
                href={dashHref}
                variant="ghost"
                size="sm"
                className={onDarkHero ? "text-white/85 hover:bg-white/10 hover:text-white" : undefined}
              >
                Dashboard
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
                  Sign out
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
                Sign in
              </Button>
              <Button href="/register" variant="primary" size="sm">
                Get started
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
          aria-label="Open menu"
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
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Scrim: dims the page so the drawer reads as above it, and gives
                a large tap target for dismissing without hunting for the X. */}
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              onClick={() => {
                setMobileOpen(false);
                toggleRef.current?.focus();
              }}
              className="fixed inset-0 z-40 cursor-default bg-ink/50 backdrop-blur-[2px] lg:hidden"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              // ease-out-expo: fast to start, settling rather than bouncing.
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 z-50 flex h-dvh w-[min(88vw,22rem)] flex-col bg-paper shadow-[var(--shadow-lift)] lg:hidden"
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
                  aria-label="Close menu"
                  className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-button)] text-ink transition-colors hover:bg-ink/5"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-2">
            <div className="flex flex-col divide-y divide-ink/[0.06]">
              {NAV.map((group) => (
                <div key={group.label} className="py-4">
                  {group.href ? (
                    <Link
                      href={group.href}
                      onClick={() => setMobileOpen(false)}
                      className="label-cta block text-[0.8rem] text-navy-700"
                    >
                      {group.label}
                    </Link>
                  ) : (
                    <>
                      <p className="label-cta text-[0.8rem] text-navy-700">{group.label}</p>
                      <div className="mt-3 grid gap-1">
                        {group.columns!.flatMap((c) => c.links).map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-ink/70 hover:bg-brand-50 hover:text-ink"
                          >
                            {link.icon && <link.icon className="h-4 w-4 text-brand-600" />}
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3">
              {user ? (
                <>
                  <Button href={dashHref} variant="primary" size="lg" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Button>
                  <form action={logoutUser} className="contents">
                    <button
                      type="submit"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex h-13 items-center justify-center rounded-[var(--radius-button)] border border-ink/15 bg-white px-8 text-base font-medium text-ink"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Button href="/register" variant="primary" size="lg" onClick={() => setMobileOpen(false)}>
                    Get started
                  </Button>
                  <Button href="/login" variant="outline" size="lg" onClick={() => setMobileOpen(false)}>
                    Sign in
                  </Button>
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-ink/70">Appearance</span>
                <ThemeToggle />
              </div>
            </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
