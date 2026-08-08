import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/session";
import { twoFactorState, adminTwoFactorRequired } from "@/lib/two-factor";
import { startEnrolment } from "@/lib/actions/two-factor";
import { EnrolPanel } from "@/components/security/enrol-panel";
import { VerifyPanel } from "@/components/security/verify-panel";

/**
 * The one door into an account that has not proved its second factor.
 *
 * Middleware sends anyone here whose session lacks the claim; this page makes
 * the branch middleware could not, because knowing whether an account is
 * ENROLLED is a database read and middleware runs on the edge.
 *
 * Rendered per request: it depends on a cookie and on a row that changes the
 * moment somebody finishes pairing.
 */
export const dynamic = "force-dynamic";

export const metadata = { title: "Security check", robots: { index: false, follow: false } };

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { next } = await searchParams;
  // Only an internal target — the same open-redirect rule the login form uses.
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  // Already satisfied, or exempt: nothing to do here.
  const state = await twoFactorState(user.id, user.role);
  if (user.mfa || (!state.required && !state.enrolled)) redirect(dest);

  return (
    <section className="container-x py-16 md:py-24">
      <div className="mx-auto max-w-xl rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-[var(--shadow-soft)] md:p-10">
        {state.enrolled ? (
          <VerifyPanel dest={dest} recoveryLeft={state.recoveryLeft} />
        ) : (
          <Enrol dest={dest} exempt={!state.required} />
        )}
      </div>
    </section>
  );
}

/**
 * The QR is rendered on the server as a data: URI.
 *
 * The CSP allows `img-src 'self' data:` and forbids every external host, so a
 * hosted chart API is not an option — which is the right outcome anyway: the
 * secret must never be handed to a third party to draw.
 */
async function Enrol({ dest, exempt }: { dest: string; exempt: boolean }) {
  const started = await startEnrolment();
  if (!started) redirect("/login");

  const qr = await QRCode.toDataURL(started.uri, { margin: 1, width: 220, errorCorrectionLevel: "M" });

  return (
    <EnrolPanel
      dest={dest}
      qr={qr}
      secret={started.secret}
      exempt={exempt}
      adminEnforced={adminTwoFactorRequired()}
    />
  );
}
