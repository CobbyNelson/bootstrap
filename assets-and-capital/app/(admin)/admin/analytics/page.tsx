import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Globe2, MonitorSmartphone, FileText, ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getSummary, getSeries, getBreakdowns, type Range } from "@/lib/analytics-queries";
import { geoAvailable } from "@/lib/geo";
import { TrendChart } from "@/components/admin/analytics/trend-chart";
import { BarList } from "@/components/admin/analytics/bar-list";
import Link from "next/link";

export const metadata: Metadata = { title: "Analytics" };
// Always current: a cached audience report is worse than a slow one.
export const dynamic = "force-dynamic";

/** Middleware lets STAFF into /admin. Visitor data is not support tooling. */
const ANALYTICS_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

const RANGES: { days: Range; label: string }[] = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !ANALYTICS_ROLES.has(user.role)) redirect("/admin");

  const { range } = await searchParams;
  const days: Range = range === "7" ? 7 : range === "90" ? 90 : 30;

  const [summary, series, breakdowns, geo] = await Promise.all([
    getSummary(days),
    getSeries(days),
    getBreakdowns(days),
    Promise.resolve(geoAvailable()),
  ]);

  const totalViews = summary.views;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-700">Analytics</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/65">
            First-party and cookieless. Visitors are identified by a hash that is thrown away every
            night, so these numbers answer how many people and from where — and cannot be turned
            back into who.
          </p>
        </div>
        {/* Range control sits in one row above the charts, and is a link set
            rather than a select so each range is its own shareable URL. */}
        <div className="inline-flex rounded-[var(--radius-button)] border border-ink/10 bg-white p-1">
          {RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/admin/analytics?range=${r.days}`}
              aria-current={days === r.days ? "page" : undefined}
              className={`rounded-[var(--radius-button)] px-3.5 py-1.5 text-sm font-medium transition-colors ${
                days === r.days ? "bg-brand-600 text-white" : "text-ink/60 hover:text-ink"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Visitors" value={summary.visitors} hint={`unique per day, over ${days} days`} />
        <Stat label="Page views" value={summary.views} />
        <Stat label="Visits" value={summary.visits} hint="30-minute sessions" />
        <Stat label="Pages / visit" value={summary.viewsPerVisit} decimal />
        <Stat label="Single-page visits" value={summary.bounceRate} suffix="%" />
      </section>

      <Panel title="Traffic over time">
        <TrendChart points={series} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pages" icon={<FileText className="h-4 w-4" />}>
          <BarList rows={breakdowns.pages} total={totalViews} />
        </Panel>

        <Panel
          title="Countries"
          icon={<Globe2 className="h-4 w-4" />}
          note={geo.country ? undefined : "No geo database installed — run deploy/geo-update.sh"}
        >
          <BarList
            rows={breakdowns.countries}
            total={totalViews}
            empty={geo.country ? "No located visits yet." : "Country lookup is not installed."}
          />
        </Panel>

        <Panel
          title="Cities"
          icon={<Globe2 className="h-4 w-4" />}
          note={geo.city ? undefined : "City-level needs the larger DB-IP file — country only for now"}
        >
          <BarList
            rows={breakdowns.cities}
            total={totalViews}
            empty={geo.city ? "No city-level data yet." : "City lookup is not installed."}
          />
        </Panel>

        <Panel title="Devices" icon={<MonitorSmartphone className="h-4 w-4" />}>
          <BarList rows={breakdowns.devices} total={totalViews} />
          <div className="mt-4 border-t border-ink/[0.07] pt-4">
            <p className="label-cta mb-2 text-[0.62rem] text-ink/55">Browsers</p>
            <BarList rows={breakdowns.browsers} total={totalViews} />
          </div>
        </Panel>

        <Panel title="Referrers" icon={<ExternalLink className="h-4 w-4" />}>
          <BarList
            rows={breakdowns.referrers}
            total={totalViews}
            empty="No external referrers yet — expected while the site is behind the gate."
          />
        </Panel>
      </div>

      <p className="text-xs leading-relaxed text-ink/50">
        Excludes the pre-launch gate, the admin area, and visitors who sent Do Not Track, Global
        Privacy Control, or declined analytics consent. Country data by{" "}
        <a href="https://db-ip.com" rel="noopener noreferrer" target="_blank" className="underline underline-offset-2">
          DB-IP
        </a>{" "}
        (CC BY 4.0).
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  suffix,
  decimal,
}: {
  label: string;
  value: number;
  hint?: string;
  suffix?: string;
  decimal?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ink/[0.07] bg-white p-4">
      <p className="label-cta text-[0.62rem] text-ink/55">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums text-navy-700">
        {decimal ? value.toFixed(1) : value.toLocaleString()}
        {suffix}
      </p>
      {hint && <p className="mt-0.5 text-[0.68rem] text-ink/45">{hint}</p>}
    </div>
  );
}

function Panel({
  title,
  icon,
  note,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink/[0.07] bg-white p-5">
      <header className="mb-3 flex items-center gap-2">
        {icon && <span className="text-ink/50">{icon}</span>}
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </header>
      {note && <p className="mb-3 text-xs text-ink/50">{note}</p>}
      {children}
    </section>
  );
}
