import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Columns3 } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getCommitments, getBusinessHome, type CommitmentRow } from "@/lib/portal-queries";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Deal pipeline" };

/**
 * Real commitments, in the stage they are really at.
 *
 * The board showed six invented deals — "Cedar Ridge IV", "Blue Harbor
 * Private Credit II" — spread across five columns, with a single button that
 * did nothing. The stages here are the CommitmentStatus enum, which is what
 * the platform actually moves a commitment through, and each card is a row
 * somebody created.
 *
 * Only the platform advances a commitment past SOFT_COMMITTED — allocation,
 * countersignature and funds movement are operated by staff — so there is
 * deliberately no drag-and-drop here. A board an investor can rearrange would
 * imply they can move their own deal to Funded.
 */
const STAGES = [
  { key: "SOFT_COMMITTED", label: "Soft committed", hint: "Intent recorded" },
  { key: "ALLOCATED", label: "Allocated", hint: "Allocation confirmed" },
  { key: "AGREEMENT_SENT", label: "Agreement sent", hint: "Awaiting signature" },
  { key: "SIGNED", label: "Signed", hint: "Countersigned" },
  { key: "FUNDED", label: "Funded", hint: "Funds received" },
] as const;

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

function Card({ c }: { c: CommitmentRow }) {
  return (
    <Link
      href={`/marketplace/${c.slug}`}
      className="block rounded-2xl border border-ink/[0.07] bg-white p-3.5 transition-colors hover:border-ink/20"
    >
      <p className="truncate text-sm font-medium text-ink">{c.name}</p>
      <p className="mt-1 font-display text-lg font-semibold text-navy-700 tnum">{usd(c.amountUsd)}</p>
      <p className="mt-1 text-[0.7rem] text-ink/60">{formatDate(c.createdAt, "en")}</p>
    </Link>
  );
}

export default async function PipelinePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/pipeline");

  // A business sees the commitments made INTO its listing; an investor sees
  // the ones they made. Same board, two directions — and scoped by the account
  // rather than by which URL was typed.
  const isBusiness = user.role === "BUSINESS";
  const commitments = isBusiness ? (await getBusinessHome(user)).commitments : await getCommitments(user);
  const total = commitments.reduce((n, c) => n + c.amountUsd, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/65">{isBusiness ? "Business" : "Investor"} workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Deal pipeline</h1>
          <p className="mt-1 text-sm text-ink/65">
            {isBusiness ? "Commitments made into your listing." : "Capital you have committed, and where each stands."}
          </p>
        </div>
        {commitments.length > 0 && (
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink/60">Total</p>
            <p className="font-display text-2xl font-semibold text-navy-700 tnum">{usd(total)}</p>
          </div>
        )}
      </div>

      {commitments.length === 0 ? (
        <EmptyState
          icon={Columns3}
          title="Nothing in the pipeline yet"
          description={
            isBusiness
              ? "When an investor commits capital to your listing, it will appear here and move across as the deal progresses."
              : "Commitments you make from a marketplace listing appear here, and move across as our team allocates and settles them."
          }
          action={isBusiness ? undefined : { label: "Browse the marketplace", href: "/marketplace" }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((stage) => {
            const inStage = commitments.filter((c) => c.status === stage.key);
            return (
              <div key={stage.key} className="rounded-3xl bg-paper-2/60 p-3">
                <div className="flex items-center justify-between gap-2 px-1.5 pb-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{stage.label}</p>
                    <p className="text-[0.68rem] text-ink/60">{stage.hint}</p>
                  </div>
                  <Badge variant={inStage.length > 0 ? "brand" : "neutral"} size="sm">
                    {inStage.length}
                  </Badge>
                </div>
                <div className={cn("space-y-2.5", inStage.length === 0 && "opacity-60")}>
                  {inStage.length === 0 ? (
                    <p className="px-1.5 py-3 text-xs text-ink/55">Nothing here.</p>
                  ) : (
                    inStage.map((c) => <Card key={c.id} c={c} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
