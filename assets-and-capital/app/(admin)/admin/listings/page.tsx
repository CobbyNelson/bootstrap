import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { RecordPage, RecordTable } from "@/components/admin/record-page";
import { listAllListings } from "@/lib/admin-queries";

const ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Listings · Admin" };

const TIER = (t: string) =>
  t === "PLATINUM" ? "brand" : t === "GOLD" ? "gold" : ("neutral" as const);

export default async function ListingsPage() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) redirect("/admin");
  const rows = await listAllListings();

  return (
    <RecordPage
      kicker="Administration"
      title="Listings"
      description="Every listing in the database, whatever its state. The public marketplace shows only LIVE ones — and still runs on the sample catalogue until the first real listing goes live."
      count={rows.length}
    >
      <RecordTable
        head={["Listing", "Sector", "Ask", "Tier", "Status", "Created"]}
        empty="No listings in the database yet."
        rows={rows.map((l) => (
          <tr key={l.id}>
            <td className="px-5 py-3">
              <p className="font-medium text-ink">{l.business?.organization?.legalName || l.title}</p>
              <p className="text-xs text-ink/55">{l.title}</p>
            </td>
            <td className="px-5 py-3 text-ink/70">{l.industry?.name ?? "—"}</td>
            <td className="px-5 py-3 tnum text-ink/70">
              {l.askAmount ? `$${(l.askAmount / 1_000_000).toFixed(1)}M` : "—"}
            </td>
            <td className="px-5 py-3">
              <Badge variant={TIER(l.tier)} size="sm">{l.tier}</Badge>
            </td>
            <td className="px-5 py-3">
              <Badge variant={l.status === "LIVE" ? "success" : l.status === "IN_REVIEW" ? "gold" : "neutral"} size="sm">
                {l.status}
              </Badge>
            </td>
            <td className="px-5 py-3 text-ink/60">{l.createdAt.toLocaleDateString("en-GB")}</td>
          </tr>
        ))}
      />
    </RecordPage>
  );
}
