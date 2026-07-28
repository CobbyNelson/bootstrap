"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List, X, MapPin, Tag, Lock } from "lucide-react";
import { REGIONS, SECTORS_FILTER, STAGES, INSTRUMENTS, TIERS, SORTS } from "@/lib/marketplace-data";
import { SCORED_MARKETPLACE as MARKETPLACE, slugify } from "@/lib/matching";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { Money } from "@/components/ui/money";
import { CurrencySwitcher } from "@/components/layout/currency-switcher";
import { cn } from "@/lib/utils";

const LIST_GRADIENTS = [
  "from-navy-700 to-navy-900",
  "from-brand-600 to-brand-800",
  "from-ink to-navy-900",
  "from-navy-600 to-brand-800",
];
function rowInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}
function rowGradient(name: string) {
  const sum = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return LIST_GRADIENTS[sum % LIST_GRADIENTS.length];
}

function askValue(ask: string): number {
  const num = parseFloat(ask.replace(/[^0-9.]/g, "")) || 0;
  if (/b/i.test(ask)) return num * 1000;
  if (/k/i.test(ask)) return num / 1000;
  return num;
}

type Facet = "region" | "sector" | "stage" | "instrument" | "tier";

export function MarketplaceView({ unlockedSlugs = [] }: { unlockedSlugs?: string[] }) {
  const unlocked = new Set(unlockedSlugs);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("match");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<Facet, Set<string>>>({
    region: new Set(),
    sector: new Set(),
    stage: new Set(),
    instrument: new Set(),
    tier: new Set(),
  });

  function toggle(facet: Facet, value: string) {
    setFilters((prev) => {
      const next = new Set(prev[facet]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [facet]: next };
    });
  }

  function clearAll() {
    setFilters({ region: new Set(), sector: new Set(), stage: new Set(), instrument: new Set(), tier: new Set() });
    setQuery("");
  }

  const activeCount = Object.values(filters).reduce((n, s) => n + s.size, 0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = MARKETPLACE.filter((o) => {
      if (q && !`${o.name} ${o.sector} ${o.country} ${o.blurb}`.toLowerCase().includes(q)) return false;
      if (filters.region.size && !filters.region.has(o.region)) return false;
      if (filters.sector.size && !filters.sector.has(o.sector)) return false;
      if (filters.stage.size && !filters.stage.has(o.stage)) return false;
      if (filters.instrument.size && !filters.instrument.has(o.instrument)) return false;
      if (filters.tier.size && !filters.tier.has(o.tier)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === "match") return b.match - a.match;
      if (sort === "ask-desc") return askValue(b.ask) - askValue(a.ask);
      return askValue(a.ask) - askValue(b.ask);
    });
    return list;
  }, [query, filters, sort]);

  const facetGroups: { key: Facet; label: string; options: readonly string[] }[] = [
    { key: "region", label: "Region", options: REGIONS },
    { key: "sector", label: "Sector", options: SECTORS_FILTER },
    { key: "stage", label: "Stage", options: STAGES },
    { key: "instrument", label: "Instrument", options: INSTRUMENTS },
    { key: "tier", label: "Listing tier", options: TIERS },
  ];

  return (
    <div className="container-x grid gap-8 py-12 lg:grid-cols-[260px_1fr]">
      {/* filter rail */}
      <aside className={cn("lg:block", showFilters ? "block" : "hidden")}>
        <div className="sticky top-24 rounded-3xl border border-ink/[0.07] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">Filters</p>
            {activeCount > 0 && (
              <button onClick={clearAll} className="text-xs font-medium text-brand-700 hover:text-brand-800">
                Clear all ({activeCount})
              </button>
            )}
          </div>
          <div className="mt-4 space-y-6">
            {facetGroups.map((g) => (
              <div key={g.key}>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/60">{g.label}</p>
                <div className="mt-2.5 space-y-1.5">
                  {g.options.map((opt) => {
                    const checked = filters[g.key].has(opt);
                    return (
                      <label key={opt} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink/70 hover:text-ink">
                        <span
                          className={cn(
                            "grid h-4 w-4 place-items-center rounded border transition-colors",
                            checked ? "border-brand-600 bg-brand-600 text-white" : "border-ink/25"
                          )}
                        >
                          {checked && (
                            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M2 6l3 3 5-6" />
                            </svg>
                          )}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => toggle(g.key, opt)} className="sr-only" />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* results */}
      <div>
        <div className="flex flex-col gap-3 rounded-2xl border border-ink/[0.07] bg-white p-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-paper-2 px-3.5">
            <Search className="h-4 w-4 text-ink/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opportunities, sectors, countries…"
              className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-ink/60 focus:outline-none"
              aria-label="Search opportunities"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink/10 px-3 text-sm font-medium text-ink/70 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-sm text-ink/70 focus:outline-none"
              aria-label="Sort"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="hidden sm:block"><CurrencySwitcher /></div>
            <div className="hidden items-center rounded-xl border border-ink/10 p-0.5 sm:flex">
              <button
                onClick={() => setView("grid")}
                className={cn("grid h-9 w-9 place-items-center rounded-lg", view === "grid" ? "bg-ink text-white" : "text-ink/65")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("grid h-9 w-9 place-items-center rounded-lg", view === "list" ? "bg-ink text-white" : "text-ink/65")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink/65">
            <span className="font-semibold text-ink tnum">{results.length}</span> opportunities
          </p>
          {activeCount > 0 && (
            <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs font-medium text-ink/65 hover:text-ink">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-20 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-paper-2 text-ink/60">
              <Search className="h-6 w-6" />
            </div>
            <p className="mt-4 font-medium text-ink">No opportunities match your filters</p>
            <p className="mt-1 max-w-sm text-sm text-ink/65">Try widening your criteria or clearing a filter to see more of the marketplace.</p>
            <button onClick={clearAll} className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-2">
              Clear all filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((o) => (
              <OpportunityCard key={o.name} o={o} unlocked={unlocked.has(slugify(o.name))} />
            ))}
          </div>
        ) : (
          <div className="mt-6 divide-y divide-ink/[0.07] overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
            {results.map((o) => (
              <Link
                key={o.name}
                href={`/marketplace/${slugify(o.name)}`}
                className="group flex items-center gap-4 p-4 transition-colors hover:bg-paper-2/50"
              >
                {/* thumbnail */}
                <div className={cn("relative hidden h-16 w-24 flex-none overflow-hidden rounded-xl bg-gradient-to-br sm:block", rowGradient(o.name))}>
                  <div className="grid-noise absolute inset-0 opacity-20" aria-hidden />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-lg font-extrabold tracking-tight text-white/90">{rowInitials(o.name)}</span>
                  </div>
                  {unlocked.has(slugify(o.name)) ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-[0.55rem] font-semibold text-white tnum">{o.match}%</span>
                  ) : (
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-ink/70 px-1.5 py-0.5 text-[0.55rem] font-semibold text-white backdrop-blur-sm">
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                {/* title + meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-base font-bold text-brand-600">{o.name}</h3>
                    <span className="hidden flex-none rounded-full bg-paper-2 px-2 py-0.5 text-[0.58rem] kicker text-ink md:inline">{o.tier}</span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-ink/60">
                    <MapPin className="h-3 w-3" /> {o.country} · {o.region}
                  </p>
                </div>

                {/* category tag */}
                <span className="hidden items-center gap-1.5 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700 lg:inline-flex">
                  <Tag className="h-3.5 w-3.5" /> {o.sector}
                </span>

                {/* seeking */}
                <div className="w-24 flex-none text-right">
                  <p className="text-[0.6rem] uppercase tracking-wide text-ink/60">Seeking</p>
                  <p className="font-bold text-ink tnum"><Money usd={o.ask} /></p>
                </div>

                {/* invest */}
                <span className="hidden flex-none rounded-lg bg-paper-2 px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors group-hover:bg-brand-600 group-hover:text-white sm:inline-block">
                  Invest
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
