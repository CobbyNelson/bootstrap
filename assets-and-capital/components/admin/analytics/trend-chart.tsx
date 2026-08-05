"use client";

import { useId, useMemo, useState } from "react";
import type { Point } from "@/lib/analytics-queries";

/**
 * Visitors and views over time.
 *
 * A line pair, not a dual axis. Both series are counts of the same kind of
 * thing on one scale, so they share it — two y-scales would let the reader
 * infer a relationship from where the lines happen to cross, which is an
 * artefact of the scaling and not in the data.
 *
 * Views are always ≥ visitors, so the pair reads as a band whose width is
 * "pages per visitor" without anyone having to compute it.
 *
 * Drawn by hand rather than with a charting library: the admin bundle stays
 * small (a library is ~100KB gzipped for one chart), and the marks follow the
 * house flat style — 2px strokes, no shadows, no gradients.
 */

const PAD = { top: 16, right: 16, bottom: 26, left: 40 };
const W = 760;
const H = 240;

export function TrendChart({ points }: { points: Point[] }) {
  const gid = useId();
  const [hover, setHover] = useState<number | null>(null);

  const { max, xs, visitorPath, viewPath, areaPath } = useMemo(() => {
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    // Headroom so the peak never touches the frame, and a floor of 4 so a quiet
    // day is not drawn as a full-height spike off a max of 1.
    const peak = Math.max(4, ...points.map((p) => p.views));
    const max = Math.ceil(peak * 1.15);

    const x = (i: number) =>
      PAD.left + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
    const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

    const line = (get: (p: Point) => number) =>
      points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(get(p)).toFixed(1)}`).join(" ");

    const viewPath = line((p) => p.views);
    const visitorPath = line((p) => p.visitors);
    // Band between the two, which is where "pages per visitor" lives.
    const areaPath =
      `${viewPath} ` +
      points
        .map((p, i) => `L${x(points.length - 1 - i).toFixed(1)} ${y(points[points.length - 1 - i].visitors).toFixed(1)}`)
        .join(" ") +
      " Z";

    return { max, xs: points.map((_, i) => x(i)), visitorPath, viewPath, areaPath };
  }, [points]);

  const plotH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, Math.round(max / 2), max];
  const active = hover !== null ? points[hover] : null;

  return (
    <figure className="m-0">
      {/* Legend is mandatory at two series, so identity never rests on colour
          alone. Swatches echo the marks; the text stays in ink tokens. */}
      <figcaption className="mb-3 flex items-center gap-4">
        {[
          { label: "Views", colour: "var(--chart-2)" },
          { label: "Visitors", colour: "var(--chart-1)" },
        ].map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-ink/70">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.colour }} aria-hidden />
            {s.label}
          </span>
        ))}
      </figcaption>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`Visitors and views per day. Peak ${max} views.`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * W;
            // Nearest point rather than a band: the reader is pointing at a
            // day, not at a pixel range.
            let best = 0;
            for (let i = 1; i < xs.length; i++) {
              if (Math.abs(xs[i] - px) < Math.abs(xs[best] - px)) best = i;
            }
            setHover(best);
          }}
        >
          <defs>
            <linearGradient id={`${gid}-band`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Recessive grid: present enough to read a value against, quiet
              enough that the marks stay the loudest thing. */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--chart-axis)">
                {t}
              </text>
            </g>
          ))}

          <path d={areaPath} fill={`url(#${gid}-band)`} />
          <path d={viewPath} fill="none" stroke="var(--chart-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={visitorPath} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {hover !== null && (
            <g pointerEvents="none">
              <line x1={xs[hover]} x2={xs[hover]} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--chart-axis)" strokeWidth="1" strokeDasharray="3 3" />
              {/* 2px surface ring so a marker stays legible where the two
                  lines overlap. */}
              <circle cx={xs[hover]} cy={y(points[hover].views)} r="4.5" fill="var(--chart-2)" stroke="var(--color-paper)" strokeWidth="2" />
              <circle cx={xs[hover]} cy={y(points[hover].visitors)} r="4.5" fill="var(--chart-1)" stroke="var(--color-paper)" strokeWidth="2" />
            </g>
          )}

          {/* First and last date only — a label per day collides at 90. */}
          {points.length > 0 && (
            <>
              <text x={PAD.left} y={H - 8} fontSize="11" fill="var(--chart-axis)">{fmt(points[0].date)}</text>
              <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize="11" fill="var(--chart-axis)">
                {fmt(points[points.length - 1].date)}
              </text>
            </>
          )}
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-2 rounded-[var(--radius-button)] border border-ink/10 bg-paper px-3 py-2 text-xs"
            style={{
              left: `${(xs[hover!] / W) * 100}%`,
              transform: `translateX(${xs[hover!] > W / 2 ? "-105%" : "5%"})`,
            }}
          >
            <p className="font-medium text-ink">{fmt(active.date, true)}</p>
            <p className="mt-1 text-ink/70">
              <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: "var(--chart-1)" }} />{" "}
              {active.visitors} visitors
            </p>
            <p className="text-ink/70">
              <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: "var(--chart-2)" }} />{" "}
              {active.views} views
            </p>
          </div>
        )}
      </div>
    </figure>
  );
}

function fmt(iso: string, long = false) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(long ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}
