"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, ListChecks, Wallet, Presentation,
  FileText, ScrollText, BadgeCheck, Search, Bell, ArrowLeft, SlidersHorizontal, Mailbox, Menu, X,
  Image as ImageIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Matching engine", href: "/admin/matching", icon: SlidersHorizontal },
  { label: "Approvals", href: "/admin#approvals", icon: BadgeCheck, badge: "6" },
  { label: "Businesses", href: "/admin#businesses", icon: Building2 },
  { label: "Investors", href: "/admin#investors", icon: Users },
  { label: "Listings", href: "/admin#listings", icon: ListChecks },
  { label: "Payments", href: "/admin#payments", icon: Wallet },
  { label: "Roadshows & events", href: "/admin/events", icon: Presentation },
  { label: "Email automation", href: "/admin/email", icon: Mailbox },
  { label: "Insights", href: "/admin/insights", icon: FileText },
  { label: "Media library", href: "/admin/media", icon: ImageIcon },
  { label: "Audit log", href: "/admin#audit", icon: ScrollText },
];

const TEAM = ["RO", "JA", "CD", "MP"];

function AdminNavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV.map((item) => {
        const active = item.href === pathname;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-full px-4 py-2.5 label-cta text-[0.68rem] transition-colors",
              active ? "bg-paper text-navy-900 shadow-sm" : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            <item.icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-navy-300")} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">{item.badge}</span>
            )}
          </Link>
        );
      })}
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-paper-2/60 lg:grid lg:grid-cols-[280px_1fr]">
      {/* dark sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-hidden bg-navy-900 text-white lg:flex lg:m-3 lg:h-[calc(100dvh-1.5rem)] lg:rounded-[1.75rem]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{ background: "radial-gradient(120% 60% at 0% 0%, rgba(229,50,43,0.22), transparent 60%)" }}
          aria-hidden
        />
        <div className="relative flex h-16 items-center gap-2 px-5">
          <Logo invert />
          <span className="ml-1 rounded-md bg-brand-600 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white">Admin</span>
        </div>

        {/* profile */}
        <div className="relative mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-[var(--radius-button)] bg-gradient-to-br from-brand-500 to-brand-800 text-sm font-semibold text-white ring-2 ring-brand-500/60 ring-offset-2 ring-offset-navy-900">
            PA
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Platform Admin</p>
            <p className="truncate text-[0.7rem] text-white/65">Super admin</p>
          </div>
        </div>

        <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 pb-2">
          <p className="kicker px-3 pb-1.5 pt-3 text-[0.6rem] text-navy-300/70">Administration</p>
          <AdminNavLinks pathname={pathname} />
        </nav>

        {/* active team */}
        <div className="relative border-t border-white/10 px-5 py-4">
          <p className="kicker mb-2 text-[0.6rem] text-navy-300/70">Active team</p>
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {TEAM.map((t) => (
                <span key={t} className="grid h-8 w-8 place-items-center rounded-full border-2 border-navy-900 bg-gradient-to-br from-brand-500 to-brand-800 text-[0.6rem] font-semibold text-white">
                  {t}
                </span>
              ))}
            </div>
            <span className="ml-2 grid h-8 items-center rounded-full bg-navy-500 px-2 text-[0.65rem] font-semibold text-white">+12</span>
          </div>
          <Link href="/" className="mt-4 flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-ink/50 backdrop-blur-sm" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-hidden bg-navy-900 text-white shadow-[var(--shadow-lift)]">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{ background: "radial-gradient(120% 60% at 0% 0%, rgba(229,50,43,0.22), transparent 60%)" }}
              aria-hidden
            />
            <div className="relative flex h-16 items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <Logo invert />
                <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white">Admin</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] text-white/70 hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
              <AdminNavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="relative border-t border-white/10 px-5 py-4">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Back to site
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* content */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink/[0.07] bg-paper/85 px-5 backdrop-blur-md md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-button)] text-ink/70 hover:bg-paper-2 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("ac-open-search"))}
              className="hidden items-center gap-2 rounded-[var(--radius-button)] border border-ink/10 bg-white/70 px-3.5 py-2 text-sm text-ink/65 transition-colors hover:border-ink/20 hover:text-ink/70 sm:flex"
            >
              <Search className="h-4 w-4" /><span className="w-36 text-left">Search admin…</span>
              <kbd className="rounded border border-ink/15 px-1.5 text-[0.65rem] text-ink/60">⌘K</kbd>
            </button>
            <ThemeToggle />
            <button className="relative grid h-10 w-10 place-items-center rounded-[var(--radius-button)] border border-ink/10 bg-white text-ink/60 hover:text-ink" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-600" />
            </button>
            <div className="flex items-center gap-2.5 rounded-[var(--radius-button)] border border-ink/10 bg-white py-1 pl-1 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-button)] bg-gradient-to-br from-brand-600 to-brand-800 text-xs font-semibold text-white ring-1 ring-navy-500/50">PA</span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xs font-medium text-ink">Platform Admin</span>
                <span className="block text-[0.65rem] text-ink/65">Super admin</span>
              </span>
            </div>
          </div>
        </header>
        <div className="flex-1 px-5 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
