"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { REGIONS, SECTORS_FILTER, STAGES } from "@/lib/marketplace-data";

/**
 * Hero search.
 *
 * This is a real query, not a decorative bar: it writes sector / region / stage
 * into the URL and the marketplace reads them back on mount, so a visitor lands
 * on a filtered result set rather than the full list with their choices thrown
 * away. Anything left on "Any" is omitted from the URL entirely, which keeps the
 * address readable and shareable.
 */

const FIELDS = [
  { key: "sector", label: "Sector", any: "Any sector", options: SECTORS_FILTER },
  { key: "region", label: "Region", any: "Any region", options: REGIONS },
  { key: "stage", label: "Stage", any: "Any stage", options: STAGES },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const f of FIELDS) {
      const v = values[f.key];
      if (v) params.set(f.key, v);
    }
    const qs = params.toString();
    router.push(qs ? `/marketplace?${qs}` : "/marketplace");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-9 w-full max-w-3xl rounded-[1.5rem] border border-ink/[0.08] bg-white/95 p-2 shadow-[var(--shadow-card)] backdrop-blur"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
        {FIELDS.map((f, i) => (
          <div
            key={f.key}
            className={`relative flex-1 ${
              i > 0 ? "sm:border-l sm:border-ink/[0.08]" : ""
            }`}
          >
            <label htmlFor={`hs-${f.key}`} className="sr-only">
              {f.label}
            </label>
            <select
              id={`hs-${f.key}`}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              /* appearance-none + our own chevron: the native arrow sits at a
                 different offset per browser and breaks the pill's rhythm. */
              className="w-full cursor-pointer appearance-none rounded-[var(--radius-button)] bg-transparent py-3 pl-5 pr-9 text-sm font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <option value="">{f.any}</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
              aria-hidden
            />
          </div>
        ))}

        <button
          type="submit"
          className="rounded-[var(--radius-button)] inline-flex shrink-0 items-center justify-center gap-2 bg-ink px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          <Search className="h-4 w-4" />
          Find opportunities
        </button>
      </div>
    </form>
  );
}
