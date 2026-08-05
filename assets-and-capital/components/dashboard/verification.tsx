import { Check, Clock, Loader2, X, ShieldCheck, Upload, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";

export type VStatus = "Approved" | "Under Review" | "Pending" | "Rejected";
export type VStep = { label: string; status: VStatus; detail: string };
export type VDoc = { name: string; status: VStatus };

const STATUS_META: Record<VStatus, { badge: "success" | "brand" | "gold" | "neutral"; icon: typeof Check; ring: string }> = {
  Approved: { badge: "success", icon: Check, ring: "bg-emerald-500 text-white" },
  "Under Review": { badge: "brand", icon: Loader2, ring: "bg-brand-600 text-white" },
  Pending: { badge: "gold", icon: Clock, ring: "border border-ink/20 text-ink/60" },
  Rejected: { badge: "neutral", icon: X, ring: "bg-brand-600 text-white" },
};

export function VerificationFlow({
  eyebrow,
  subject,
  overall,
  progress,
  intro,
  steps,
  docs,
}: {
  eyebrow: string;
  subject: string;
  overall: VStatus;
  progress: number;
  intro: string;
  steps: VStep[];
  docs: VDoc[];
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">{eyebrow}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">{subject}</h1>
      </div>

      {/* overall */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <div className="flex items-center gap-4">
            <ProgressRing value={progress} />
            <div>
              <Badge variant={STATUS_META[overall].badge}>
                <ShieldCheck className="h-3.5 w-3.5" /> {overall}
              </Badge>
              <p className="mt-2 text-sm leading-snug text-ink/65">{intro}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy-700">Verification steps</h2>
          <ol className="space-y-1">
            {steps.map((s, i) => {
              const m = STATUS_META[s.status];
              return (
                <li key={s.label} className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                  <span className={cn("mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-[var(--radius-button)] text-xs", m.ring)}>
                    {s.status === "Approved" ? <Check className="h-3.5 w-3.5" /> : s.status === "Under Review" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : s.status === "Rejected" ? <X className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{s.label}</p>
                      <Badge variant={m.badge} size="sm">{s.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink/65">{s.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* documents */}
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-navy-700">Documents</h2>
          <button className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-ink/12 px-3.5 py-2 text-sm font-medium text-ink/70 hover:border-ink/25">
            <Upload className="h-4 w-4" /> Upload
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {docs.map((d) => {
            const m = STATUS_META[d.status];
            return (
              <div key={d.name} className="flex items-center gap-3 rounded-2xl border border-ink/[0.06] p-3.5">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-paper-2 text-ink/65">
                  <FileText className="h-4 w-4" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{d.name}</p>
                <Badge variant={m.badge} size="sm">{d.status}</Badge>
              </div>
            );
          })}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink/60">
          <ShieldCheck className="h-3.5 w-3.5" /> Documents are encrypted and reviewed by a compliance officer before approval.
        </p>
      </div>
    </div>
  );
}
