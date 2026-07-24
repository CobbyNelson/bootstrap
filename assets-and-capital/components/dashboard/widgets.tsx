import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  trend = "up",
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-ink/[0.07] bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Icon className="h-4 w-4" />
        </span>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-brand-600",
              trend === "flat" && "text-ink/40"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-ink tnum">{value}</p>
      <p className="mt-1 text-sm text-ink/55">{label}</p>
    </div>
  );
}

export function Panel({
  id,
  title,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-3xl border border-ink/[0.07] bg-white p-6", className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {action && (
          <Link href={action.href} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            {action.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function ProgressRing({ value, size = 64 }: { value: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(12,13,16,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
        />
      </svg>
      <span className="absolute text-sm font-semibold text-ink tnum">{value}%</span>
    </div>
  );
}
