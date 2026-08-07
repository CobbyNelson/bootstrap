import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { RecordPage, RecordTable } from "@/components/admin/record-page";
import { listInvestors } from "@/lib/admin-queries";

const ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Investors · Admin" };

export default async function InvestorsPage() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) redirect("/admin");
  const rows = await listInvestors();

  return (
    <RecordPage
      kicker="Administration"
      title="Investors"
      description="Accounts with the investor role. Verification and subscription are separate: an unverified investor can browse, a subscribed one sees full details."
      count={rows.length}
    >
      <RecordTable
        head={["Investor", "Country", "Verification", "Subscription", "Joined"]}
        empty="No investors have registered yet."
        rows={rows.map((u) => (
          <tr key={u.id}>
            <td className="px-5 py-3">
              <p className="font-medium text-ink">{u.name || "—"}</p>
              <p className="text-xs text-ink/55">{u.email}</p>
            </td>
            <td className="px-5 py-3 text-ink/70">{u.kyc?.country ?? "—"}</td>
            <td className="px-5 py-3">
              <Badge
                variant={u.kyc?.status === "VERIFIED" ? "success" : u.kyc?.status === "PENDING" ? "gold" : "neutral"}
                size="sm"
              >
                {u.kyc?.status ?? "NOT_STARTED"}
              </Badge>
              {u.kyc?.accredited && <span className="ml-2 text-xs text-ink/55">accredited</span>}
            </td>
            <td className="px-5 py-3">
              {u.subscription?.active ? (
                <Badge variant="brand" size="sm">{u.subscription.plan}</Badge>
              ) : (
                <span className="text-ink/55">Free</span>
              )}
            </td>
            <td className="px-5 py-3 text-ink/60">{u.createdAt.toLocaleDateString("en-GB")}</td>
          </tr>
        ))}
      />
    </RecordPage>
  );
}
