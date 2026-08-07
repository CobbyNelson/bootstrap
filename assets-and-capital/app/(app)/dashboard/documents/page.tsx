import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileSignature } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataRooms } from "@/lib/portal-queries";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Agreements" };

/**
 * The agreements this account has actually signed.
 *
 * The page rendered an e-signature product: five documents at "Awaiting
 * counterparty" / "Signed" / "Draft", a per-document audit trail with IP
 * addresses and timestamps, and Send / Remind / Void buttons. None of it was
 * stored anywhere and every button was inert.
 *
 * What is real is NdaSignature, written by `signNda` when an investor signs to
 * open a data room. That is the only agreement the platform currently executes,
 * so it is the only one listed. Countersigned agreements for commitments are
 * handled offline by the deal team today — the commitment's own status says
 * where it has got to.
 */
export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/documents");

  const signed = await getDataRooms(user);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">Workspace</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Agreements</h1>
        <p className="mt-1 text-sm text-ink/65">Non-disclosure agreements you have signed on the platform.</p>
      </div>

      {signed.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No agreements yet"
          description="When you sign an NDA to open a business's data room, it will be listed here with the date you signed."
          action={{ label: "Browse the marketplace", href: "/marketplace" }}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
          <div className="divide-y divide-ink/[0.06]">
            {signed.map((s) => (
              <div key={s.slug} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <FileSignature className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">Non-disclosure agreement — {s.name}</p>
                  <p className="text-xs text-ink/65">Signed {formatDate(s.signedAt, "en")}</p>
                </div>
                <Badge variant="success" size="sm">Signed</Badge>
                <Link
                  href={`/marketplace/${s.slug}`}
                  className="text-sm font-medium text-brand-700 hover:text-brand-800"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
