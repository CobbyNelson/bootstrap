import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { RecordPage, RecordTable } from "@/components/admin/record-page";
import { listPayments, listPaymentIntents } from "@/lib/admin-queries";

const ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Payments · Admin" };

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) redirect("/admin");
  const [payments, intents] = await Promise.all([listPayments(), listPaymentIntents()]);

  return (
    <RecordPage
      kicker="Administration"
      title="Payments"
      description="Invoices the platform has raised, and every checkout attempt behind them."
      count={payments.length}
    >
      <RecordTable
        head={["Invoice", "Business", "Amount", "Provider", "Status", "Raised"]}
        empty="No invoices raised yet."
        rows={payments.map((p) => (
          <tr key={p.id}>
            <td className="px-5 py-3">
              <p className="font-medium text-ink">{p.invoiceNo}</p>
              <p className="text-xs text-ink/55">{p.description}</p>
            </td>
            <td className="px-5 py-3 text-ink/70">{p.organization?.legalName ?? "—"}</td>
            <td className="px-5 py-3 tnum font-medium text-ink">{money(p.amountCents, p.currency)}</td>
            <td className="px-5 py-3 text-ink/70">{p.provider}</td>
            <td className="px-5 py-3">
              <Badge
                variant={p.status === "PAID" ? "success" : p.status === "FAILED" ? "brand" : "gold"}
                size="sm"
              >
                {p.status}
              </Badge>
              {p.isSuccessFee && <span className="ml-2 text-xs text-ink/55">success fee</span>}
            </td>
            <td className="px-5 py-3 text-ink/60">{p.createdAt.toLocaleDateString("en-GB")}</td>
          </tr>
        ))}
      />

      {/*
        Checkout attempts are shown separately, and deliberately.

        A Payment is an invoice the platform raised. A PaymentIntent is a
        visitor pressing pay. Reporting only the first hides every abandoned and
        declined attempt — which is exactly the population worth watching while
        checkout is new.
      */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-navy-700">Checkout attempts</h2>
        <RecordTable
          head={["Reference", "Investor", "Plan", "Provider", "Status", "When"]}
          empty="Nobody has started checkout yet."
          rows={intents.map((i) => (
            <tr key={i.id}>
              <td className="px-5 py-3 font-mono text-xs text-ink/70">{i.reference}</td>
              <td className="px-5 py-3 text-ink/70">{i.user?.email ?? "—"}</td>
              <td className="px-5 py-3 text-ink/70">
                {i.plan} <span className="text-ink/45">{i.amountLabel}</span>
              </td>
              <td className="px-5 py-3 text-ink/70">
                {i.provider}
                {i.testMode && <span className="ml-2 text-xs text-amber-700">test</span>}
              </td>
              <td className="px-5 py-3">
                <Badge
                  variant={i.status === "PAID" ? "success" : i.status === "FAILED" ? "brand" : "neutral"}
                  size="sm"
                >
                  {i.status}
                </Badge>
              </td>
              <td className="px-5 py-3 text-ink/60">{i.createdAt.toLocaleDateString("en-GB")}</td>
            </tr>
          ))}
        />
      </div>
    </RecordPage>
  );
}
