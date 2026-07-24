"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List, X, MapPin } from "lucide-react";
import { MARKETPLACE, REGIONS, SECTORS_FILTER, STAGES, INSTRUMENTS, TIERS, SORTS } from "@/lib/marketplace-data";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function askValue(ask: string): number {
  const num = parseFloat(ask.replace(/[^0-9.]/g, "")) || 0;
  if (/b/i.test(ask)) return num * 1000;
  if (/k/i.test(ask)) return num / 1000;
  return num;
}

type Facet = "region" | "sector" | "stage" | "instrument" | "tier";

export function MarketplaceView() {
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
              <button onClick={clearAll} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Clear all ({activeCount})
              </button>
            )}
          </div>
          <div className="mt-4 space-y-6">
            {facetGroups.map((g) => (
              <div key={g.key}>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/40">{g.label}</p>
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
            <Search className="h-4 w-4 text-ink/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search opportunities, sectors, countries…"
              className="h-10 w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
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
            <div className="hidden items-center rounded-xl border border-ink/10 p-0.5 sm:flex">
              <button
                onClick={() => setView("grid")}
                className={cn("grid h-9 w-9 place-items-center rounded-lg", view === "grid" ? "bg-ink text-white" : "text-ink/50")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("grid h-9 w-9 place-items-center rounded-lg", view === "list" ? "bg-ink text-white" : "text-ink/50")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-ink/55">
            <span className="font-semibold text-ink tnum">{results.length}</span> opportunities
          </p>
          {activeCount > 0 && (
            <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs font-medium text-ink/50 hover:text-ink">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-20 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-paper-2 text-ink/40">
              <Search className="h-6 w-6" />
            </div>
            <p className="mt-4 font-medium text-ink">No opportunities match your filters</p>
            <p className="mt-1 max-w-sm text-sm text-ink/50">Try widening your criteria or clearing a filter to see more of the marketplace.</p>
            <button onClick={clearAll} className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white hover:bg-ink-2">
              Clear all filters
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((o) => (
              <OpportunityCard key={o.name} o={o} />
            ))}
          </div>
        ) : (
          <div className="mt-6 divide-y divide-ink/[0.07] overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
            {results.map((o) => (
              <div key={o.name} className="flex flex-wrap items-center gap-4 p-5 transition-colors hover:bg-paper-2/50">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white">
                    {o.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{o.name}</p>
                    <p className="flex items-center gap-1 text-xs text-ink/50">
                      <MapPin className="h-3 w-3" /> {o.country} · {o.sector}
                    </p>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">{o.stage}</Badge>
                <div className="w-20 text-right">
                  <p className="text-[0.62rem] uppercase tracking-wide text-ink/40">Ask</p>
                  <p className="font-semibold text-ink tnum">{o.ask}</p>
                </div>
                <div className="w-24 text-right">
                  <p className="text-[0.62rem] uppercase tracking-wide text-ink/40">Target</p>
                  <p className="font-semibold text-ink tnum">{o.targetReturn}</p>
                </div>
                <div className="w-16 text-right">
                  <p className="text-[0.62rem] uppercase tracking-wide text-ink/40">Match</p>
                  <p className="font-semibold text-emerald-600 tnum">{o.match}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
