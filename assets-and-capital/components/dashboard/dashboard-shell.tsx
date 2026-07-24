"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Target, Bookmark, MessageSquare, Presentation,
  Settings, Bell, Search, ArrowLeft, BarChart3, Wallet, Building2, TrendingUp,
  Columns3, Lock,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };

const INVESTOR_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Deal pipeline", href: "/dashboard/pipeline", icon: Columns3 },
  { label: "Data rooms", href: "/dashboard/data-room", icon: Lock },
  { label: "Matches", href: "/dashboard#matches", icon: Target },
  { label: "Saved & watchlist", href: "/dashboard#saved", icon: Bookmark },
  { label: "Messages", href: "/dashboard#messages", icon: MessageSquare },
  { label: "Marketplace", href: "/marketplace", icon: Search },
];

const BUSINESS_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard/business", icon: LayoutDashboard },
  { label: "Deal pipeline", href: "/dashboard/pipeline", icon: Columns3 },
  { label: "Data room", href: "/dashboard/data-room", icon: Lock },
  { label: "Listing performance", href: "/dashboard/business#performance", icon: BarChart3 },
  { label: "Investor interest", href: "/dashboard/business#interest", icon: TrendingUp },
  { label: "Payments", href: "/dashboard/business#payments", icon: Wallet },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBusiness = pathname.startsWith("/dashboard/business");
  const nav = isBusiness ? BUSINESS_NAV : INVESTOR_NAV;
  const roleLabel = isBusiness ? "Business" : "Investor";
  const person = isBusiness ? { name: "Accra FinPay", sub: "Gold listing" } : { name: "Aurora Family Office", sub: "PE mandate" };

  return (
    <div className="min-h-dvh bg-paper-2/50 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-ink/[0.07] bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-ink/[0.06] px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/40">
            {roleLabel} workspace
          </p>
          {nav.map((item) => {
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
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ink/[0.06] p-3">
          <Link href={isBusiness ? "/dashboard" : "/dashboard/business"} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-paper-2 hover:text-ink">
            <Building2 className="h-4 w-4" />
            View {isBusiness ? "investor" : "business"} view
          </Link>
          <Link href="#settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-paper-2 hover:text-ink">
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-paper-2 hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink/[0.07] bg-white/80 px-5 backdrop-blur-md md:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-ink/10 bg-paper-2/60 px-3.5 py-2 text-sm text-ink/50 sm:flex">
              <Search className="h-4 w-4" />
              <span className="w-40">Search…</span>
              <kbd className="rounded border border-ink/15 px-1.5 text-[0.65rem] text-ink/40">⌘K</kbd>
            </div>
            <button className="relative grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink/60 hover:text-ink" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-600" />
            </button>
            <div className="flex items-center gap-2.5 rounded-full border border-ink/10 py-1 pl-1 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-ink to-ink-2 text-xs font-semibold text-white">
                {person.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xs font-medium text-ink">{person.name}</span>
                <span className="block text-[0.65rem] text-ink/50">{person.sub}</span>
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 px-5 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
