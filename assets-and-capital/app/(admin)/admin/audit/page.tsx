import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { RecordPage, RecordTable } from "@/components/admin/record-page";
import { listAuditLog } from "@/lib/admin-queries";

const ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Audit log · Admin" };

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) redirect("/admin");
  const rows = await listAuditLog();

  return (
    <RecordPage
      kicker="Administration"
      title="Audit log"
      description="Administrative actions, newest first. This is the record of who changed what."
      count={rows.length}
    >
      <RecordTable
        head={["Action", "Target", "Actor", "When"]}
        empty="Nothing recorded yet. Administrative actions are written here as they happen."
        rows={rows.map((a) => (
          <tr key={a.id}>
            <td className="px-5 py-3 font-medium text-ink">{a.action}</td>
            <td className="px-5 py-3 text-ink/70">{a.target ?? "—"}</td>
            <td className="px-5 py-3 text-ink/70">{a.actor}</td>
            <td className="px-5 py-3 text-ink/60">
              {a.createdAt.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
            </td>
          </tr>
        ))}
      />
    </RecordPage>
  );
}
