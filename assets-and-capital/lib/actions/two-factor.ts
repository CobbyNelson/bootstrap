"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, createSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { beginEnrolment, confirmEnrolment, verifySecondFactor } from "@/lib/two-factor";

export type TwoFactorResult = { ok: boolean; error?: string; recoveryCodes?: string[] };

/**
 * Actions for pairing and for proving a second factor.
 *
 * Each one re-reads the session rather than trusting an id from the client:
 * the whole point of this screen is that the caller is half-authenticated, so
 * anything they send about WHO they are is exactly what must not be believed.
 */

export async function startEnrolment(): Promise<{ secret: string; uri: string } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return beginEnrolment(user.id, user.email);
}

export async function finishEnrolment(code: string): Promise<TwoFactorResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session expired. Sign in again." };

  // Six digits is 1,000,000 possibilities and a 90-second window; without a
  // limit that is guessable at HTTP speed.
  if (!rateLimit(`2fa:enrol:${user.id}`, 10, 5 * 60_000).ok) {
    return { ok: false, error: "Too many attempts. Wait a few minutes." };
  }

  const result = await confirmEnrolment(user.id, code);
  if (!result.ok) return { ok: false, error: result.error };

  // The session is upgraded in place: they have just proved the second factor,
  // so making them sign in again would be theatre.
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role }, true);
  return { ok: true, recoveryCodes: result.recoveryCodes };
}

export async function submitCode(code: string): Promise<TwoFactorResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session expired. Sign in again." };

  if (!rateLimit(`2fa:verify:${user.id}`, 10, 5 * 60_000).ok) {
    return { ok: false, error: "Too many attempts. Wait a few minutes." };
  }

  if (!(await verifySecondFactor(user.id, code))) {
    return { ok: false, error: "That code isn't right. Use the current one from your app." };
  }

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role }, true);
  return { ok: true };
}

/** Leave the half-authenticated state without a code. */
export async function abandon(): Promise<void> {
  const { destroySession } = await import("@/lib/session");
  await destroySession();
  redirect("/login");
}
