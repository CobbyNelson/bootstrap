import { Mail, CheckCircle2, AlertTriangle, MinusCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Email, reduced to what is measurable.
 *
 * This page reported "15,560 sent · 63.4% open rate · 27.8% click rate · 4
 * active journeys". Nothing recorded a send at all, and open and click rates
 * require provider webhooks that were never built — there was no path from any
 * of those numbers back to a fact.
 *
 * Sends ARE recordable, so they are recorded now and shown here. Engagement is
 * not, without building webhook ingestion nobody asked for, so the page stopped
 * claiming it. The "journeys" were four invented automations; the triggers
 * below are the ones that exist in the code, which is what an operator actually
 * needs to know — what will fire, and whether the last one got through.
 */

export type EmailStats = {
  sent: number;
  failed: number;
  skipped: number;
  configured: boolean;
  from: string;
  recent: { id: string; to: string; subject: string; status: string; createdAt: Date }[];
};

/** The sends that exist in the codebase, by where they are triggered from. */
const TRIGGERS = [
  {
    name: "Welcome email",
    when: "A visitor registers an account",
    where: "lib/actions/auth.ts",
  },
  {
    name: "Staff chat notification",
    when: "A visitor asks to speak to a person in the chat",
    where: "app/api/chat/staff/route.ts",
  },
];

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  tone: "ink" | "good" | "warn";
}) {
  const colour =
    tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-brand-700" : "text-navy-700";
  return (
    <div className="rounded-3xl border border-ink/[0.07] bg-white p-5">
      <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] bg-paper-2 text-ink/60">
        <Icon className="h-4 w-4" />
      </span>
      <p className={`mt-4 font-grotesk text-[1.75rem] font-semibold leading-none tnum ${colour}`}>{value}</p>
      <p className="mt-1.5 kicker text-[0.68rem] text-ink/60">{label}</p>
    </div>
  );
}

export function EmailAutomation({ stats }: { stats: EmailStats }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="kicker text-[0.7rem] text-brand-700">Email</p>
        <h1 className="mt-1.5 font-display text-3xl font-medium text-navy-700">Transactional email</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/65">
          Every send is recorded so you can answer whether a message went out. Open and click rates
          are not shown because nothing tracks them — that needs delivery webhooks from the provider,
          which is a separate piece of work.
        </p>
      </div>

      {!stats.configured && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-5">
          <p className="text-sm font-semibold text-amber-900">No email provider configured</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/75">
            RESEND_API_KEY is not set, so sends are recorded as skipped and no mail leaves the
            server. Registration and chat escalation still work — they are written not to fail when
            email is unavailable.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Mail} label="Recorded sends" value={String(stats.sent + stats.failed + stats.skipped)} tone="ink" />
        <Metric icon={CheckCircle2} label="Delivered to provider" value={String(stats.sent)} tone="good" />
        <Metric icon={AlertTriangle} label="Failed" value={String(stats.failed)} tone={stats.failed ? "warn" : "ink"} />
        <Metric icon={MinusCircle} label="Skipped — no provider" value={String(stats.skipped)} tone="ink" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <p className="font-display text-lg font-semibold text-navy-700">What sends mail</p>
          <p className="mt-1 text-sm text-ink/60">
            Sending from <span className="font-medium text-ink">{stats.from}</span>.
          </p>
          <ul className="mt-5 space-y-4">
            {TRIGGERS.map((t) => (
              <li key={t.name} className="flex gap-3">
                <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-[var(--radius-button)] border border-ink/10 text-brand-600">
                  <Zap className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-ink">{t.name}</p>
                  <p className="text-sm text-ink/60">{t.when}</p>
                  <p className="mt-0.5 font-mono text-[0.7rem] text-ink/45">{t.where}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <p className="font-display text-lg font-semibold text-navy-700">Recent sends</p>
          {stats.recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/55">
              Nothing sent yet. Sends appear here as they happen.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/[0.06]">
              {stats.recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{r.subject}</p>
                    <p className="truncate text-xs text-ink/60">{r.to}</p>
                  </div>
                  <Badge
                    variant={r.status === "sent" ? "success" : r.status === "failed" ? "brand" : "neutral"}
                    size="sm"
                  >
                    {r.status}
                  </Badge>
                  <span className="flex-none text-xs text-ink/50">
                    {r.createdAt.toLocaleDateString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
