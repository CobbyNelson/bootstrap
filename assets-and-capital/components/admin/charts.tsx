import { cn } from "@/lib/utils";

/* ============================================================
   Lightweight, dependency-free SVG charts for the admin
   dashboard. Deterministic geometry — safe in server
   components. Palette: ink + gold + brand red.
   ============================================================ */

const C = {
  ink: "var(--color-ink)",
  gold: "var(--color-gold-500)",
  goldSoft: "var(--color-gold-300)",
  brand: "var(--color-brand-600)",
  teal: "#0f766e",
  line: "rgba(20,18,14,0.08)",
};

/* ---------- smooth path (Catmull-Rom → cubic bezier) ---------- */
function smooth(points: [number, number][]): string {
  if (points.length < 2) return "";
  const d = [`M ${points[0][0]},${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`);
  }
  return d.join(" ");
}

/* ---------- dual-segment bar chart (ink base + gold cap) ---------- */
export function BarChartDual({
  data,
  labels,
  className,
}: {
  data: { base: number; cap: number }[];
  labels: string[];
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.base + d.cap));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex h-44 items-end gap-2.5">
        {data.map((d, i) => {
          const total = ((d.base + d.cap) / max) * 100;
          const capPct = (d.cap / (d.base + d.cap)) * 100;
          return (
            <div key={i} className="flex h-full flex-1 flex-col justify-end">
              <div className="relative w-full overflow-hidden rounded-lg" style={{ height: `${total}%` }}>
                <div className="absolute inset-x-0 top-0 bg-gold-400" style={{ height: `${capPct}%` }} />
                <div className="absolute inset-x-0 bottom-0 bg-ink" style={{ height: `${100 - capPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex gap-2.5">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[0.7rem] text-ink/45">{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------- donut share chart with center label ---------- */
export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 200,
}: {
  data: { label: string; value: number; color: keyof typeof C }[];
  centerValue: string;
  centerLabel: string;
  size?: number;
}) {
  const stroke = 26;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0);
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative flex-none" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.map((d, i) => {
            const frac = d.value / total;
            const len = frac * circ;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={C[d.color]}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-grotesk text-2xl font-semibold text-ink tnum">{centerValue}</p>
            <p className="text-[0.7rem] text-ink/50">{centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: C[d.color] }} />
            <span className="flex-1 text-ink/70">{d.label}</span>
            <span className="font-medium text-ink tnum">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- smooth dual-series area/line chart with tooltip ---------- */
export function AreaChart({
  primary,
  secondary,
  labels,
  peakIndex,
  peakLabel,
  className,
}: {
  primary: number[];
  secondary?: number[];
  labels: string[];
  peakIndex?: number;
  peakLabel?: string;
  className?: string;
}) {
  const W = 640;
  const H = 240;
  const padX = 16;
  const padTop = 28;
  const padBottom = 28;
  const all = [...primary, ...(secondary ?? [])];
  const max = Math.max(...all) * 1.18;
  const min = 0;
  const n = primary.length;
  const xFor = (i: number) => padX + (i / (n - 1)) * (W - padX * 2);
  const yFor = (v: number) => H - padBottom - ((v - min) / (max - min)) * (H - padTop - padBottom);

  const ptsP = primary.map((v, i) => [xFor(i), yFor(v)] as [number, number]);
  const pathP = smooth(ptsP);
  const areaP = `${pathP} L ${ptsP[n - 1][0]},${H - padBottom} L ${ptsP[0][0]},${H - padBottom} Z`;

  const ptsS = secondary?.map((v, i) => [xFor(i), yFor(v)] as [number, number]);
  const pathS = ptsS ? smooth(ptsS) : null;

  const pk = peakIndex ?? primary.indexOf(Math.max(...primary));
  const pkX = xFor(pk);
  const pkY = yFor(primary[pk]);
  const gridY = [0.25, 0.5, 0.75, 1];

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.brand} stopOpacity="0.22" />
            <stop offset="100%" stopColor={C.brand} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridY.map((g, i) => (
          <line key={i} x1={padX} x2={W - padX} y1={padTop + g * (H - padTop - padBottom)} y2={padTop + g * (H - padTop - padBottom)} stroke={C.line} strokeWidth="1" />
        ))}
        <path d={areaP} fill="url(#areaFill)" />
        {pathS && <path d={pathS} fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />}
        <path d={pathP} fill="none" stroke={C.brand} strokeWidth="3" strokeLinecap="round" />
        {/* peak marker */}
        <circle cx={pkX} cy={pkY} r="5.5" fill="#fff" stroke={C.brand} strokeWidth="3" />
      </svg>
      {peakLabel && (
        <div className="pointer-events-none -mt-2 flex" style={{ paddingLeft: `${(pkX / W) * 100}%` }}>
          <span className="-translate-x-1/2 rounded-lg bg-ink px-2.5 py-1 text-[0.7rem] font-medium text-white shadow-sm">
            {peakLabel}
          </span>
        </div>
      )}
      <div className="mt-1 flex justify-between px-1">
        {labels.map((l, i) => (
          <span key={i} className="text-[0.7rem] text-ink/45">{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------- tiny sparkline for KPI cards ---------- */
export function Sparkline({ data, stroke = "#fff", className }: { data: number[]; stroke?: string; className?: string }) {
  const W = 120;
  const H = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - ((v - min) / (max - min || 1)) * H,
  ] as [number, number]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-9 w-28", className)} preserveAspectRatio="none">
      <path d={smooth(pts)} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
