"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Target, Bookmark, MessageSquare, FileSignature,
  Settings, Bell, Search, ArrowLeft, BarChart3, Wallet, Building2, TrendingUp,
  Columns3, Lock, BadgeCheck, Menu, X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ProfileMenu } from "@/components/account/profile-menu";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };

const INVESTOR_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Deal pipeline", href: "/dashboard/pipeline", icon: Columns3 },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Data rooms", href: "/dashboard/data-room", icon: Lock },
  { label: "Agreements", href: "/dashboard/documents", icon: FileSignature },
  { label: "Verification", href: "/dashboard/verification", icon: BadgeCheck },
  { label: "Matches", href: "/dashboard#matches", icon: Target },
  { label: "Saved & watchlist", href: "/dashboard/saved", icon: Bookmark },
  { label: "Marketplace", href: "/marketplace", icon: Search },
];

const BUSINESS_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard/business", icon: LayoutDashboard },
  { label: "Deal pipeline", href: "/dashboard/pipeline", icon: Columns3 },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Data room", href: "/dashboard/data-room", icon: Lock },
  { label: "Agreements", href: "/dashboard/documents", icon: FileSignature },
  { label: "Verification", href: "/dashboard/business/verification", icon: BadgeCheck },
  { label: "Listing performance", href: "/dashboard/business#performance", icon: BarChart3 },
  { label: "Investor interest", href: "/dashboard/business#interest", icon: TrendingUp },
  { label: "Payments", href: "/dashboard/business#payments", icon: Wallet },
];

function SidebarBody({
  nav,
  pathname,
  roleLabel,
  isBusiness,
  canSwitch,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  roleLabel: string;
  isBusiness: boolean;
  canSwitch: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/60">
          {roleLabel} workspace
        </p>
        {nav.map((item) => {
          const active = item.href === pathname;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
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
        {/* Staff only. This was shown to every account as "View business view",
            which on a real investor account is a link into somebody else's
            workspace — and it worked, because the shell took the role from the
            URL rather than from the session. */}
        {canSwitch && (
          <Link href={isBusiness ? "/dashboard" : "/dashboard/business"} onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-paper-2 hover:text-ink">
            <Building2 className="h-4 w-4" />
            View {isBusiness ? "investor" : "business"} view
          </Link>
        )}
        <Link href="/dashboard/settings" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-paper-2 hover:text-ink">
          <Settings className="h-4 w-4" /> Settings
        </Link>
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-paper-2 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
        {/* Appearance sits with the other preferences at the foot of the rail
            rather than in the topbar beside search and notifications. */}
        <div className="mt-2 flex items-center justify-between gap-3 px-3 pt-2">
          <span className="text-sm font-medium text-ink/60">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

/**
 * The signed-in account, not the address bar.
 *
 * `isBusiness` used to be `pathname.startsWith("/dashboard/business")`, so the
 * workspace, the nav and the name in the corner were all decided by the URL. An
 * investor who typed a business URL got the business sidebar and was greeted as
 * "Accra FinPay"; a business account on /dashboard was "Aurora Family Office".
 */
type Chrome = {
  me: { name: string; kind: "investor" | "business"; orgName: string | null; initials: string };
  unread: number;
  canSwitch: boolean;
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [chrome, setChrome] = useState<Chrome | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/portal/chrome")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && setChrome(d))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  // Until the account is known, follow the URL rather than flashing the wrong
  // workspace — a business account landing on /dashboard/business should not
  // see the investor rail for a beat and then have it swap underneath them.
  const isBusiness = chrome ? chrome.me.kind === "business" : pathname.startsWith("/dashboard/business");
  const nav = isBusiness ? BUSINESS_NAV : INVESTOR_NAV;
  const roleLabel = isBusiness ? "Business" : "Investor";
  const canSwitch = chrome?.canSwitch ?? false;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-dvh bg-paper-2/50 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-ink/[0.07] bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-ink/[0.06] px-5">
          <Logo />
        </div>
        <SidebarBody nav={nav} pathname={pathname} roleLabel={roleLabel} isBusiness={isBusiness} canSwitch={canSwitch} />
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-white shadow-[var(--shadow-lift)]">
            <div className="flex h-16 items-center justify-between border-b border-ink/[0.06] px-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] text-ink/60 hover:bg-paper-2" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarBody nav={nav} pathname={pathname} roleLabel={roleLabel} isBusiness={isBusiness} canSwitch={canSwitch} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-ink/[0.07] bg-white/80 px-5 backdrop-blur-md md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-button)] text-ink/70 hover:bg-paper-2 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("ac-open-search"))}
              className="hidden items-center gap-2 rounded-[var(--radius-button)] border border-ink/10 bg-paper-2/60 px-3.5 py-2 text-sm text-ink/65 transition-colors hover:border-ink/20 hover:text-ink/70 sm:flex"
            >
              <Search className="h-4 w-4" />
              <span className="w-40 text-left">Search…</span>
              <kbd className="rounded border border-ink/15 px-1.5 text-[0.65rem] text-ink/60">⌘K</kbd>
            </button>
            <Link href="/dashboard/notifications" className="relative grid h-10 w-10 place-items-center rounded-[var(--radius-button)] border border-ink/10 text-ink/60 hover:text-ink" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              {/* Lit only when something is actually unread. A dot that is
                  always on says nothing, and teaches people to ignore the one
                  time it means something. */}
              {(chrome?.unread ?? 0) > 0 && (
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-600" />
              )}
            </Link>
            <ProfileMenu
              me={
                chrome
                  ? {
                      name: chrome.me.name,
                      role: chrome.me.orgName ?? `${roleLabel} account`,
                      initials: chrome.me.initials,
                    }
                  : null
              }
              settingsHref="/dashboard/settings"
              settingsLabel="Account settings"
            />
          </div>
        </header>

        <div className="flex-1 px-5 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
