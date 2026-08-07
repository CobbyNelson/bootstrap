import { Check, Clock, Loader2, X, ShieldCheck, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/dashboard/widgets";
import { KycForm } from "@/components/dashboard/kyc-form";
import { formatDate } from "@/lib/dates";
import type { VerificationState } from "@/lib/portal-queries";
import { cn } from "@/lib/utils";

/**
 * The account's real compliance state.
 *
 * Both verification pages told every account the same story: passport
 * approved, proof of address verified, tax ID matched to registry, OFAC / UN /
 * EU screening clean, with five or six named PDFs sitting on file. None of it
 * came from anywhere. An account that had never submitted anything was shown
 * "72% — your identity and AML screening are cleared", and the Upload button
 * had no handler.
 *
 * Of everything invented across this portal, this was the one that mattered
 * most: a compliance page cannot be decorative. Committing capital is gated on
 * KYC, so an investor reading "cleared" while their record said NOT_STARTED
 * would be told at the last step that they are not.
 *
 * Every step below is derived from the KycRecord. Where the platform does not
 * yet do something — document upload has no storage path — the page says so
 * rather than showing a control that does nothing.
 */

type VStatus = "Approved" | "Under Review" | "Pending" | "Rejected";

const STATUS_META: Record<VStatus, { badge: "success" | "brand" | "gold" | "neutral"; ring: string }> = {
  Approved: { badge: "success", ring: "bg-emerald-500 text-white" },
  "Under Review": { badge: "brand", ring: "bg-brand-600 text-white" },
  Pending: { badge: "gold", ring: "border border-ink/20 text-ink/60" },
  Rejected: { badge: "neutral", ring: "bg-brand-600 text-white" },
};

const OVERALL: Record<string, { label: VStatus; progress: number; intro: string }> = {
  NOT_STARTED: {
    label: "Pending",
    progress: 0,
    intro: "You haven't started verification yet. It takes a few minutes and unlocks data rooms and commitments.",
  },
  PENDING: {
    label: "Under Review",
    progress: 45,
    intro: "Your details are with our compliance team. We'll notify you here as soon as there's a decision.",
  },
  VERIFIED: {
    label: "Approved",
    progress: 100,
    intro: "You're fully verified. Data rooms and capital commitments are open to you.",
  },
  REJECTED: {
    label: "Rejected",
    progress: 100,
    intro: "We couldn't complete your checks. Our compliance team will be in touch with next steps.",
  },
  EXPIRED: {
    label: "Pending",
    progress: 20,
    intro: "Your verification has expired and needs to be renewed before you can commit capital.",
  },
};

function stepsFor(v: VerificationState, isBusiness: boolean): { label: string; status: VStatus; detail: string }[] {
  const submitted = v.status !== "NOT_STARTED";
  const decided = v.status === "VERIFIED" || v.status === "REJECTED";

  return [
    {
      label: isBusiness ? "Company details" : "Identity details",
      status: submitted ? "Approved" : "Pending",
      detail: submitted
        ? `${v.legalName ?? "Name on file"}${v.country ? ` · ${v.country}` : ""}`
        : "Legal name and country of registration.",
    },
    {
      label: "Sanctions & PEP screening",
      // Screening is only meaningful once a decision has been taken — a fresh
      // record has sanctionsClear=false because nobody has looked yet, not
      // because something was found.
      status: !decided ? (submitted ? "Under Review" : "Pending") : v.sanctionsClear ? "Approved" : "Rejected",
      detail: decided
        ? v.sanctionsClear
          ? "Screened against sanctions and PEP lists — clear."
          : "Flagged during screening. Our compliance team will be in touch."
        : "Screened against sanctions and politically-exposed-person lists.",
    },
    {
      label: isBusiness ? "Regulatory standing" : "Accredited / qualified-investor status",
      status: !decided ? (submitted ? "Under Review" : "Pending") : v.accredited ? "Approved" : "Pending",
      detail: v.accredited
        ? "Confirmed. Restricted opportunities are open to you."
        : "Required for opportunities restricted to accredited investors.",
    },
    {
      label: "Compliance decision",
      status: v.status === "VERIFIED" ? "Approved" : v.status === "REJECTED" ? "Rejected" : submitted ? "Under Review" : "Pending",
      detail: v.reviewedAt ? `Reviewed ${formatDate(v.reviewedAt, "en")}.` : "Final sign-off by a compliance officer.",
    },
  ];
}

export function VerificationFlow({
  eyebrow,
  subject,
  state,
  isBusiness = false,
}: {
  eyebrow: string;
  subject: string;
  state: VerificationState;
  isBusiness?: boolean;
}) {
  const overall = OVERALL[state.status] ?? OVERALL.NOT_STARTED;
  const steps = stepsFor(state, isBusiness);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">{eyebrow}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">{subject}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <div className="flex items-center gap-4">
            <ProgressRing value={overall.progress} />
            <div>
              <Badge variant={STATUS_META[overall.label].badge}>
                <ShieldCheck className="h-3.5 w-3.5" /> {overall.label}
              </Badge>
              <p className="mt-2 text-sm leading-snug text-ink/65">{overall.intro}</p>
            </div>
          </div>
          {state.updatedAt && (
            <p className="mt-4 border-t border-ink/[0.06] pt-3 text-xs text-ink/60">
              Last updated {formatDate(state.updatedAt, "en")}
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy-700">Verification steps</h2>
          <ol className="space-y-1">
            {steps.map((s, i) => {
              const m = STATUS_META[s.status];
              return (
                <li key={s.label} className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                  <span className={cn("mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-[var(--radius-button)] text-xs", m.ring)}>
                    {s.status === "Approved" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : s.status === "Under Review" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : s.status === "Rejected" ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      i + 1
                    )}
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

      {/* The form is the point of the page when there is nothing on file. */}
      {(state.status === "NOT_STARTED" || state.status === "EXPIRED") && (
        <KycForm isBusiness={isBusiness} defaultName={state.legalName} defaultCountry={state.country} />
      )}

      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-navy-700">Documents</h2>
        {/* There is no upload path yet — no storage bucket, no Document write.
            An "Upload" button with no handler was previously the whole feature.
            Saying so is better than a control that swallows the click. */}
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-ink/15 p-5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-paper-2 text-ink/65">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">No documents requested</p>
            <p className="mt-0.5 text-sm text-ink/65">
              If our compliance team needs supporting documents, we&rsquo;ll email you a secure upload link.
            </p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink/60">
          <ShieldCheck className="h-3.5 w-3.5" /> Documents are encrypted and reviewed by a compliance officer before approval.
        </p>
      </div>
    </div>
  );
}
