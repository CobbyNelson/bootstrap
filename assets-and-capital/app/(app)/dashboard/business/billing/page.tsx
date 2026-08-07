import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getBilling } from "@/lib/portal-queries";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Billing" };

/**
 * What this account has actually been charged.
 *
 * The page listed three invoices to every business that opened it — INV-2041
 * and INV-2088 marked Paid, INV-2131 marked Due — alongside a usage meter and
 * four plan cards whose buttons did nothing. No business had been billed a
 * cent.
 *
 * Real charges are PaymentIntent rows, written by lib/payments-server.ts when
 * a checkout starts, and the plan is the org's Subscription.
 */
const TIER_LABEL: Record<string, string> = {
  STANDARD: "Standard listing",
  SILVER: "Silver listing",
  GOLD: "Gold listing",
  PLATINUM: "Platinum listing",
};

const STATUS_VARIANT: Record<string, "success" | "gold" | "neutral" | "brand"> = {
  PAID: "success",
  PENDING: "gold",
  FAILED: "neutral",
  REFUNDED: "neutral",
};

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/business/billing");

  const billing = await getBilling(user);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">Business workspace</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Billing</h1>
        <p className="mt-1 text-sm text-ink/65">Your listing plan and payment history.</p>
      </div>

      {/* plan */}
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink/60">Current plan</p>
            {billing.tier ? (
              <>
                <p className="mt-1 font-display text-2xl font-semibold text-navy-700">
                  {TIER_LABEL[billing.tier] ?? billing.tier}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={billing.active ? "success" : "neutral"} size="sm">
                    {billing.active ? "Active" : "Inactive"}
                  </Badge>
                  {billing.renewsAt && (
                    <span className="text-xs text-ink/65">Renews {formatDate(billing.renewsAt, "en")}</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-2xl font-semibold text-navy-700">No active plan</p>
                <p className="mt-1 text-sm text-ink/65">
                  Your listing is on the free tier. Upgrading raises it in the marketplace.
                </p>
              </>
            )}
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            {billing.tier ? "Change plan" : "View plans"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* history */}
      <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
        <div className="border-b border-ink/[0.06] px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-navy-700">Payment history</h2>
        </div>
        {billing.intents.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Wallet}
              title="No payments yet"
              description="Charges appear here as soon as you take out a listing plan or a service."
            />
          </div>
        ) : (
          <div className="divide-y divide-ink/[0.06]">
            {billing.intents.map((i) => (
              <div key={i.reference} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{i.plan}</p>
                  <p className="text-xs text-ink/65">
                    {i.reference} · {formatDate(i.createdAt, "en")} · {i.provider}
                  </p>
                </div>
                <span className="font-medium text-ink tnum">{i.amountLabel}</span>
                <Badge variant={STATUS_VARIANT[i.status] ?? "neutral"} size="sm">
                  {i.status}
                </Badge>
                {/* Surfaced, not hidden. While no provider keys are set every
                    charge is a simulation, and a billing page that cannot say
                    so is the same lie in a smaller font. */}
                {i.testMode && <Badge variant="gold" size="sm">Test</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
