"use client";

import { useState } from "react";
import type { Row } from "@/lib/analytics-queries";

/**
 * Ranked categories — pages, countries, devices, browsers, referrers.
 *
 * A horizontal bar list rather than a pie or a donut. The job is comparing
 * magnitudes across labelled categories, and length on a common baseline is the
 * one encoding people read accurately; angle is not. It also lets the label sit
 * on the bar instead of in a legend the eye has to travel to.
 *
 * One series, so no legend and no categorical hues: every bar is the same
 * colour. Colour here would encode rank, and rank is already encoded by
 * order and length — a second encoding of the same thing that repaints itself
 * whenever the filter changes.
 */
export function BarList({
  rows,
  total,
  unit = "views",
  empty = "Nothing yet.",
}: {
  rows: Row[];
  /** Denominator for the share. Passed in so every list in a section agrees. */
  total?: number;
  unit?: string;
  empty?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  if (rows.length === 0) {
    return <p className="py-6 text-sm text-ink/55">{empty}</p>;
  }

  const max = Math.max(...rows.map((r) => r.value));
  const denom = total ?? rows.reduce((a, r) => a + r.value, 0);

  return (
    <ul className="space-y-1">
      {rows.map((r) => {
        const pct = denom ? Math.round((r.value / denom) * 100) : 0;
        return (
          <li
            key={r.label}
            className="relative"
            onMouseEnter={() => setHover(r.label)}
            onMouseLeave={() => setHover(null)}
          >
            {/* The bar sits behind the text rather than beside it, so long
                labels stay readable and the row height never depends on the
                value. 4px radius on the data end only — the baseline end stays
                square so the zero point is unambiguous. */}
            <div className="relative flex items-center justify-between gap-3 rounded-[var(--radius-button)] px-2.5 py-1.5">
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-l-[var(--radius-button)] rounded-r transition-[width] duration-500"
                style={{
                  width: `${max ? Math.max((r.value / max) * 100, 1.5) : 0}%`,
                  background:
                    hover === r.label
                      ? "color-mix(in srgb, var(--chart-1) 22%, transparent)"
                      : "color-mix(in srgb, var(--chart-1) 12%, transparent)",
                }}
              />
              <span className="relative min-w-0 truncate text-sm text-ink" title={r.label}>
                {r.label}
              </span>
              <span className="relative flex-none tabular-nums text-sm text-ink/70">
                {r.value.toLocaleString()}
                <span className="ml-2 text-xs text-ink/45">{pct}%</span>
              </span>
            </div>
            <span className="sr-only">
              {r.label}: {r.value} {unit}, {pct} percent
            </span>
          </li>
        );
      })}
    </ul>
  );
}
