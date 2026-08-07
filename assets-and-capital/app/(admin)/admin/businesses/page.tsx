import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { RecordPage, RecordTable } from "@/components/admin/record-page";
import { listBusinesses } from "@/lib/admin-queries";

const ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Businesses · Admin" };

export default async function BusinessesPage() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) redirect("/admin");
  const rows = await listBusinesses();

  return (
    <RecordPage
      kicker="Administration"
      title="Businesses"
      description="Organisations registered as businesses. A business becomes visible on the marketplace once it has a live listing."
      count={rows.length}
    >
      <RecordTable
        head={["Business", "Country", "Listings", "Team", "Verified", "Joined"]}
        empty="No business organisations have registered yet."
        rows={rows.map((o) => (
          <tr key={o.id}>
            <td className="px-5 py-3">
              <p className="font-medium text-ink">{o.legalName}</p>
              {o.business?.website && <p className="text-xs text-ink/55">{o.business.website}</p>}
            </td>
            <td className="px-5 py-3 text-ink/70">{o.country ?? "—"}</td>
            <td className="px-5 py-3 tnum text-ink/70">{o.business?._count.listings ?? 0}</td>
            <td className="px-5 py-3 tnum text-ink/70">{o._count.users}</td>
            <td className="px-5 py-3">
              <Badge variant={o.business?.verified ? "success" : "neutral"} size="sm">
                {o.business?.verified ? "Verified" : "Unverified"}
              </Badge>
            </td>
            <td className="px-5 py-3 text-ink/60">{o.createdAt.toLocaleDateString("en-GB")}</td>
          </tr>
        ))}
      />
    </RecordPage>
  );
}
