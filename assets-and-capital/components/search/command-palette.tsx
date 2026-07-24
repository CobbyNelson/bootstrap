"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Building2, FileText, LayoutDashboard, Clock, TrendingUp, CornerDownLeft } from "lucide-react";
import { MARKETPLACE } from "@/lib/marketplace-data";
import { slugify } from "@/lib/matching";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  group: "Opportunities" | "Pages" | "Workspace";
  icon: typeof Search;
};

const PAGES: Item[] = [
  { id: "p-market", title: "Marketplace", subtitle: "Browse vetted opportunities", href: "/marketplace", group: "Pages", icon: Search },
  { id: "p-pricing", title: "Pricing & listing tiers", subtitle: "Plans and success-fee model", href: "/pricing", group: "Pages", icon: FileText },
  { id: "p-inv", title: "For investors", subtitle: "Build a mandate", href: "/investors", group: "Pages", icon: TrendingUp },
  { id: "p-biz", title: "For businesses", subtitle: "List your business", href: "/businesses", group: "Pages", icon: Building2 },
  { id: "p-insights", title: "Insights", subtitle: "Research & market views", href: "/insights", group: "Pages", icon: FileText },
  { id: "p-events", title: "Events & roadshows", subtitle: "Upcoming sessions", href: "/events", group: "Pages", icon: FileText },
  { id: "w-dash", title: "Investor dashboard", subtitle: "Your workspace", href: "/dashboard", group: "Workspace", icon: LayoutDashboard },
  { id: "w-pipe", title: "Deal pipeline", subtitle: "Kanban & analytics", href: "/dashboard/pipeline", group: "Workspace", icon: LayoutDashboard },
  { id: "w-room", title: "Data rooms", subtitle: "Secure documents", href: "/dashboard/data-room", group: "Workspace", icon: LayoutDashboard },
  { id: "w-admin", title: "Admin — matching engine", subtitle: "Tune weights", href: "/admin/matching", group: "Workspace", icon: LayoutDashboard },
];

const OPPS: Item[] = MARKETPLACE.map((o) => ({
  id: `o-${slugify(o.name)}`,
  title: o.name,
  subtitle: `${o.sector} · ${o.country} · ${o.ask}`,
  href: `/marketplace/${slugify(o.name)}`,
  group: "Opportunities",
  icon: Building2,
}));

const ALL = [...OPPS, ...PAGES];
const POPULAR = ["Renewable energy", "FinTech", "Deal pipeline", "Pricing"];

/** lightweight fuzzy rank: higher is better, -1 = no match */
function rank(q: string, text: string): number {
  const t = text.toLowerCase();
  const query = q.toLowerCase();
  if (!query) return 0;
  if (t.startsWith(query)) return 100;
  const wordStart = t.split(/[\s·]+/).some((w) => w.startsWith(query));
  if (wordStart) return 80;
  const idx = t.indexOf(query);
  if (idx >= 0) return 60 - idx;
  // subsequence
  let qi = 0;
  for (let i = 0; i < t.length && qi < query.length; i++) if (t[i] === query[qi]) qi++;
  return qi === query.length ? 30 : -1;
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-brand-600">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ac-open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ac-open-search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
      try {
        setRecent(JSON.parse(localStorage.getItem("ac_recent_search") || "[]"));
      } catch {
        /* ignore */
      }
    }
  }, [open]);

  const results = useMemo(() => {
    if (!q.trim()) return [] as Item[];
    return ALL.map((it) => ({ it, s: Math.max(rank(q, it.title), rank(q, it.subtitle) - 10) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.it);
  }, [q]);

  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const it of results) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return Array.from(map.entries());
  }, [results]);

  function go(it: Item) {
    try {
      const next = [it.title, ...recent.filter((r) => r !== it.title)].slice(0, 5);
      localStorage.setItem("ac_recent_search", JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setOpen(false);
    router.push(it.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="Close search" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[var(--shadow-lift)]">
        <div className="flex items-center gap-3 border-b border-ink/[0.07] px-4">
          <Search className="h-[18px] w-[18px] text-ink/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search opportunities, pages, actions…"
            className="h-14 w-full bg-transparent text-[0.95rem] text-ink placeholder:text-ink/40 focus:outline-none"
          />
          <kbd className="rounded border border-ink/15 px-1.5 py-0.5 text-[0.65rem] text-ink/40">ESC</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {!q.trim() ? (
            <div className="px-2 py-2">
              {recent.length > 0 && (
                <>
                  <p className="px-2 pb-1.5 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/40">Recent</p>
                  {recent.map((r) => (
                    <button key={r} onClick={() => setQ(r)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink/70 hover:bg-paper-2">
                      <Clock className="h-4 w-4 text-ink/40" /> {r}
                    </button>
                  ))}
                </>
              )}
              <p className="px-2 pb-1.5 pt-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/40">Popular</p>
              <div className="flex flex-wrap gap-2 px-2 pt-1">
                {POPULAR.map((p) => (
                  <button key={p} onClick={() => setQ(p)} className="rounded-full border border-ink/12 px-3 py-1.5 text-sm text-ink/60 hover:border-ink/25 hover:text-ink">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink/45">No results for “{q}”.</p>
          ) : (
            groups.map(([group, items]) => (
              <div key={group} className="pb-1">
                <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/40">{group}</p>
                {items.map((it) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <button
                      key={it.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(it)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        active === idx ? "bg-brand-50" : "hover:bg-paper-2"
                      )}
                    >
                      <span className={cn("grid h-8 w-8 flex-none place-items-center rounded-lg", active === idx ? "bg-brand-600 text-white" : "bg-paper-2 text-ink/50")}>
                        <it.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{highlight(it.title, q)}</span>
                        <span className="block truncate text-xs text-ink/45">{it.subtitle}</span>
                      </span>
                      {active === idx && <CornerDownLeft className="h-3.5 w-3.5 text-ink/30" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-ink/[0.07] px-4 py-2.5 text-[0.7rem] text-ink/40">
          <span className="flex items-center gap-2">
            <kbd className="rounded border border-ink/15 px-1.5">↑</kbd><kbd className="rounded border border-ink/15 px-1.5">↓</kbd> navigate
            <kbd className="rounded border border-ink/15 px-1.5">↵</kbd> open
          </span>
          <span className="flex items-center gap-1">Search by <span className="font-medium text-ink/60">Assets &amp; Capital</span> <ArrowRight className="h-3 w-3" /></span>
        </div>
      </div>
    </div>
  );
}
