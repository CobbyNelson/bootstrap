import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut, Mail, ShieldCheck, Users, Building2 } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getAccountSettings } from "@/lib/portal-queries";
import { logoutUser } from "@/lib/actions/auth";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { PrivacyControls } from "@/components/dashboard/privacy-controls";

export const metadata: Metadata = { title: "Account settings" };

/**
 * The real account.
 *
 * This page had four tabs of invented material: three signed-in devices with
 * IP addresses and cities, a login history whose fourth entry read "Blocked
 * sign-in attempt · Unknown · TOR exit", a four-person team at a firm that does
 * not exist, and toggles for two-factor and biometrics. Change, Revoke, Invite
 * member and "Sign out all others" all did nothing.
 *
 * The fabricated intrusion attempt was the worst of it — somebody reading that
 * would reasonably change their password or call us about a breach that never
 * happened.
 *
 * Sessions and login history are gone rather than wired: the platform holds one
 * signed cookie and keeps no session or sign-in table, so there is nothing
 * truthful to put there. Two-factor is gone for a sharper reason — the
 * `twoFactorOn` column exists but nothing in the sign-in path reads it, so the
 * toggle would have promised a protection that was not applied.
 */
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/settings");

  const account = await getAccountSettings(user);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">Workspace</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Account settings</h1>
      </div>

      {/* profile */}
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy-700">Your account</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink/60">Name</dt>
            <dd className="mt-1 font-medium text-ink">{account.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink/60">Email</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 font-medium text-ink">
              {account.email}
              <Badge variant={account.emailVerified ? "success" : "gold"} size="sm">
                <Mail className="h-3 w-3" /> {account.emailVerified ? "Verified" : "Unverified"}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink/60">Account type</dt>
            <dd className="mt-1 font-medium text-ink">{account.roleLabel}</dd>
          </div>
          {account.memberSince && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink/60">Member since</dt>
              <dd className="mt-1 font-medium text-ink">{formatDate(account.memberSince, "en")}</dd>
            </div>
          )}
          {account.orgName && (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-ink/60">Organisation</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium text-ink">
                <Building2 className="h-4 w-4 text-ink/50" /> {account.orgName}
              </dd>
            </div>
          )}
        </dl>
        <p className="mt-5 border-t border-ink/[0.06] pt-4 text-sm text-ink/65">
          To change your name, email or password, email{" "}
          <a href="mailto:support@assetsandcapitalltd.com" className="font-medium text-brand-700 hover:text-brand-800">
            support@assetsandcapitalltd.com
          </a>{" "}
          — self-service editing isn&rsquo;t available yet.
        </p>
      </div>

      {/* team — the other users on the same organisation */}
      {account.team.length > 1 && (
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-700">
            <Users className="h-4 w-4 text-ink/50" /> Team
          </h2>
          <p className="mt-1 text-sm text-ink/65">Everyone with access to {account.orgName ?? "this account"}.</p>
          <div className="mt-4 divide-y divide-ink/[0.06]">
            {account.team.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-[var(--radius-button)] bg-paper-2 text-xs font-semibold text-ink/70">
                  {m.name
                    .split(/[\s@.]+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {m.name}
                    {m.you && <span className="ml-2 text-xs font-normal text-ink/60">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-ink/65">{m.email}</p>
                </div>
                <Badge variant="neutral" size="sm">{m.role}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* security */}
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-700">
          <ShieldCheck className="h-4 w-4 text-ink/50" /> Security
        </h2>
        <p className="mt-1 text-sm text-ink/65">
          Signing out clears your session on this device. We don&rsquo;t keep a record of your other devices, so there is
          nothing here to revoke.
        </p>
        <form action={logoutUser} className="mt-5">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-brand-200 px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>

      {/* Data-subject rights sit beside account security rather than buried in a
          policy page: a right nobody can find is not much of a right. */}
      <PrivacyControls />
    </div>
  );
}
