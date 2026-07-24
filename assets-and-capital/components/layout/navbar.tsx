"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { NAV } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass border-b border-ink/[0.07] shadow-[0_1px_0_rgba(0,0,0,0.02)]" : "bg-transparent"
      )}
    >
      <nav className="container-x flex h-18 items-center justify-between" onMouseLeave={() => setOpen(null)}>
        <Logo />

        {/* desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((group) => {
            const hasMenu = !!group.columns;
            return (
              <li key={group.label} className="relative" onMouseEnter={() => setOpen(hasMenu ? group.label : null)}>
                {group.href ? (
                  <Link
                    href={group.href}
                    className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-[0.925rem] font-medium text-ink/75 transition-colors hover:text-ink"
                  >
                    {group.label}
                  </Link>
                ) : (
                  <button
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-4 py-2 text-[0.925rem] font-medium transition-colors",
                      open === group.label ? "text-ink" : "text-ink/75 hover:text-ink"
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
                      <div className="grid w-[min(90vw,640px)] grid-cols-2 gap-2 rounded-3xl border border-ink/[0.07] bg-white/95 p-3 shadow-[var(--shadow-lift)] backdrop-blur-xl">
                        {group.columns!.map((col) => (
                          <div key={col.title} className="rounded-2xl p-2">
                            <p className="px-3 pb-1.5 pt-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
                              {col.title}
                            </p>
                            {col.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-brand-50"
                              >
                                {link.icon && (
                                  <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                                    <link.icon className="h-4 w-4" />
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-ink">{link.label}</span>
                                  {link.description && (
                                    <span className="mt-0.5 block text-xs leading-snug text-ink/50">{link.description}</span>
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
          <Button href="/login" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button href="/register" variant="primary" size="sm">
            Get started
          </Button>
        </div>

        {/* mobile toggle */}
        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-18 z-40 overflow-y-auto bg-paper px-5 pb-10 pt-4 lg:hidden"
          >
            <div className="flex flex-col divide-y divide-ink/[0.06]">
              {NAV.map((group) => (
                <div key={group.label} className="py-4">
                  {group.href ? (
                    <Link
                      href={group.href}
                      onClick={() => setMobileOpen(false)}
                      className="block font-display text-xl font-semibold text-ink"
                    >
                      {group.label}
                    </Link>
                  ) : (
                    <>
                      <p className="font-display text-xl font-semibold text-ink">{group.label}</p>
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
              <Button href="/register" variant="primary" size="lg" onClick={() => setMobileOpen(false)}>
                Get started
              </Button>
              <Button href="/login" variant="outline" size="lg" onClick={() => setMobileOpen(false)}>
                Sign in
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
