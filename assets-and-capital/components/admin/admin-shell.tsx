"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, ListChecks, Wallet, Presentation,
  FileText, Shield, ScrollText, BadgeCheck, Search, Bell, ArrowLeft, SlidersHorizontal, Mailbox,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
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
  { label: "CMS & content", href: "/admin#cms", icon: FileText },
  { label: "Audit log", href: "/admin#audit", icon: ScrollText },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-paper-2/50 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-ink/[0.07] bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-ink/[0.06] px-5">
          <Logo />
          <span className="ml-1 rounded-md bg-ink px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-white">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/40">Administration</p>
          {NAV.map((item) => {
            const active = item.href === pathname;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100" : "text-ink/60 hover:bg-paper-2 hover:text-ink"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink/[0.06] p-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-paper-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink/[0.07] bg-white/80 px-5 backdrop-blur-md md:px-8">
          <div className="lg:hidden"><Logo /></div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("ac-open-search"))}
              className="hidden items-center gap-2 rounded-full border border-ink/10 bg-paper-2/60 px-3.5 py-2 text-sm text-ink/50 transition-colors hover:border-ink/20 hover:text-ink/70 sm:flex"
            >
              <Search className="h-4 w-4" /><span className="w-40 text-left">Search admin…</span>
              <kbd className="rounded border border-ink/15 px-1.5 text-[0.65rem] text-ink/40">⌘K</kbd>
            </button>
            <button className="relative grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink/60 hover:text-ink" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-600" />
            </button>
            <div className="flex items-center gap-2.5 rounded-full border border-ink/10 py-1 pl-1 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-xs font-semibold text-white">
                <Shield className="h-4 w-4" />
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xs font-medium text-ink">Platform Admin</span>
                <span className="block text-[0.65rem] text-ink/50">Super admin</span>
              </span>
            </div>
          </div>
        </header>
        <div className="flex-1 px-5 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
