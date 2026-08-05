import type { Metadata } from "next";
import { FileText, Eye, Download, Clock, ShieldCheck, Droplet, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatCard, Panel } from "@/components/dashboard/widgets";

export const metadata: Metadata = { title: "Data Room" };

type Doc = { name: string; category: string; status: "Approved" | "Pending"; permission: "Download" | "View only"; watermark: boolean; expiry: string; views: number; size: string };
const DOCS: Doc[] = [
  { name: "Audited Financial Statements FY25.pdf", category: "Financial Statements", status: "Approved", permission: "View only", watermark: true, expiry: "30 days", views: 42, size: "2.8 MB" },
  { name: "Management Accounts Q1-Q2.xlsx", category: "Financial Statements", status: "Approved", permission: "Download", watermark: false, expiry: "30 days", views: 28, size: "640 KB" },
  { name: "Investor Pitch Deck v4.pdf", category: "Pitch Decks", status: "Approved", permission: "Download", watermark: true, expiry: "60 days", views: 96, size: "5.2 MB" },
  { name: "Business Plan 2026-2029.pdf", category: "Business Plans", status: "Approved", permission: "View only", watermark: true, expiry: "30 days", views: 51, size: "3.1 MB" },
  { name: "Certificate of Incorporation.pdf", category: "Company Registration", status: "Approved", permission: "Download", watermark: false, expiry: "No expiry", views: 12, size: "180 KB" },
  { name: "Tax Clearance Certificate.pdf", category: "Tax Certificates", status: "Approved", permission: "View only", watermark: true, expiry: "30 days", views: 9, size: "220 KB" },
  { name: "Shareholder Register.pdf", category: "Shareholder Register", status: "Pending", permission: "View only", watermark: true, expiry: "14 days", views: 0, size: "310 KB" },
  { name: "5-Year Financial Forecast.xlsx", category: "Forecasts", status: "Approved", permission: "View only", watermark: true, expiry: "30 days", views: 33, size: "1.1 MB" },
  { name: "Market Research — East Africa Solar.pdf", category: "Market Research", status: "Approved", permission: "Download", watermark: false, expiry: "60 days", views: 24, size: "4.6 MB" },
  { name: "Key Supply Agreements.pdf", category: "Contracts", status: "Pending", permission: "View only", watermark: true, expiry: "14 days", views: 0, size: "2.0 MB" },
];

const GRANTS = [
  { investor: "Aurora Family Office", tier: "Top Investor", permission: "Download", expiry: "in 24 days", status: "Active" },
  { investor: "Meridian Growth", tier: "Premium", permission: "View only", expiry: "in 12 days", status: "Active" },
  { investor: "Rift Valley Capital", tier: "Verified", permission: "View only", expiry: "in 6 days", status: "Active" },
  { investor: "Delta Partners", tier: "Verified", permission: "View only", expiry: "expired", status: "Expired" },
];

const AUDIT = [
  { who: "Aurora Family Office", action: "Downloaded", doc: "Investor Pitch Deck v4.pdf", when: "09:42", meta: "watermarked" },
  { who: "Meridian Growth", action: "Viewed", doc: "Audited Financial Statements FY25.pdf", when: "09:18", meta: "6m 24s" },
  { who: "Rift Valley Capital", action: "Viewed", doc: "5-Year Financial Forecast.xlsx", when: "08:55", meta: "3m 10s" },
  { who: "Meridian Growth", action: "Print blocked", doc: "Business Plan 2026-2029.pdf", when: "08:40", meta: "policy" },
  { who: "Aurora Family Office", action: "Viewed", doc: "Market Research — East Africa Solar.pdf", when: "Yest", meta: "11m 02s" },
];

export default function DataRoomPage() {
  const categories = Array.from(new Set(DOCS.map((d) => d.category)));
  const pending = DOCS.filter((d) => d.status === "Pending").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/65">Secure data room</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Sahara Solar Grid</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="success" size="sm"><ShieldCheck className="h-3.5 w-3.5" /> Encrypted</Badge>
            <Badge variant="neutral" size="sm"><Droplet className="h-3.5 w-3.5" /> Watermarking on</Badge>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          <FileText className="h-4 w-4" /> Upload document
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Documents" value={`${DOCS.length}`} icon={FileText} />
        <StatCard label="Total views" value="328" delta="+42 this week" icon={Eye} />
        <StatCard label="Active access grants" value="3" icon={Lock} />
        <StatCard label="Pending approval" value={`${pending}`} delta="admin review" trend="down" icon={ShieldCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* documents */}
        <Panel title="Documents" action={{ label: "Manage folders", href: "#" }}>
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat}>
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/60">{cat}</p>
                <div className="divide-y divide-ink/[0.06] overflow-hidden rounded-2xl border border-ink/[0.06]">
                  {DOCS.filter((d) => d.category === cat).map((d) => (
                    <div key={d.name} className="flex items-center gap-3 p-3.5">
                      <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{d.name}</p>
                        <p className="text-[0.7rem] text-ink/60">{d.size} · {d.views} views · expires {d.expiry}</p>
                      </div>
                      <div className="hidden items-center gap-1.5 sm:flex">
                        {d.watermark && <Badge variant="neutral" size="sm"><Droplet className="h-3 w-3" /> WM</Badge>}
                        <Badge variant={d.permission === "Download" ? "brand" : "neutral"} size="sm">
                          {d.permission === "Download" ? <Download className="h-3 w-3" /> : <Eye className="h-3 w-3" />} {d.permission}
                        </Badge>
                        <Badge variant={d.status === "Approved" ? "success" : "gold"} size="sm">{d.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          {/* access grants */}
          <Panel title="Access grants">
            <div className="space-y-2.5">
              {GRANTS.map((g) => (
                <div key={g.investor} className="rounded-2xl border border-ink/[0.06] p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{g.investor}</p>
                      <p className="text-[0.7rem] text-ink/60">{g.tier} · {g.permission}</p>
                    </div>
                    {g.status === "Active" ? (
                      <CheckCircle2 className="h-4 w-4 flex-none text-emerald-700" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-none text-ink/30" />
                    )}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[0.7rem] text-ink/60">
                      <Clock className="h-3 w-3" /> {g.status === "Active" ? `Expires ${g.expiry}` : "Access expired"}
                    </span>
                    <button className="text-[0.7rem] font-medium text-brand-700 hover:text-brand-800">
                      {g.status === "Active" ? "Revoke" : "Renew"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* audit */}
          <Panel title="Audit trail">
            <div className="space-y-3">
              {AUDIT.map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${a.action === "Print blocked" ? "bg-brand-600" : a.action === "Downloaded" ? "bg-navy-500" : "bg-emerald-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-ink/80">
                      <span className="font-medium text-ink">{a.who}</span> {a.action.toLowerCase()}
                    </p>
                    <p className="truncate text-[0.7rem] text-ink/60">{a.doc} · {a.meta}</p>
                  </div>
                  <span className="text-[0.7rem] text-ink/60 tnum">{a.when}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-ink/[0.06] pt-3 text-[0.7rem] text-ink/60">
              Every view, download, and print attempt is logged with viewer, timestamp, and duration.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
