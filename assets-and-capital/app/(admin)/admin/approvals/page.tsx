import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { RecordPage } from "@/components/admin/record-page";
import { getApprovals } from "@/lib/admin-queries";
import { ApprovalsQueue } from "@/components/admin/approvals-queue";

const ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Approvals · Admin" };

/**
 * Deciding is ADMIN only, not staff.
 *
 * Verifying an investor and putting a listing in front of the network are the
 * two decisions on this platform that carry real consequence. Reading the queue
 * is a reasonable thing for staff to do; deciding it is not.
 */
export default async function ApprovalsPage() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) redirect("/admin");
  const items = await getApprovals(50);

  return (
    <RecordPage
      kicker="Administration"
      title="Approvals"
      description="Investor verifications awaiting a decision, and listings submitted for review. Approving a listing publishes it to the marketplace."
      count={items.length}
    >
      <ApprovalsQueue
        items={items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))}
      />
    </RecordPage>
  );
}
