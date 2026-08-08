import "server-only";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyTotp, generateSecret, otpauthUri } from "@/lib/totp";
import { twoFactorRequiredFor } from "./two-factor-policy";

/**
 * Who must present a second factor, and what state their enrolment is in.
 *
 * The policy lives here rather than being repeated at each call site, because
 * a rule about who may skip authentication is exactly the sort of thing that
 * drifts when it is written down three times.
 */

// The policy itself lives in an edge-safe module, because middleware needs it
// and this file cannot go there. Re-exported so callers have one import.
export { adminTwoFactorRequired, twoFactorRequiredFor } from "./two-factor-policy";

export type TwoFactorState = {
  /** An app has been paired and proved with a code. */
  enrolled: boolean;
  /** This person cannot use the site until they enrol. */
  required: boolean;
  /** Recovery codes still unspent. */
  recoveryLeft: number;
};

export async function twoFactorState(userId: string, role: string): Promise<TwoFactorState> {
  const row = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { twoFactorConfirmedAt: true, twoFactorRecovery: true },
    })
    .catch(() => null);

  return {
    enrolled: Boolean(row?.twoFactorConfirmedAt),
    required: twoFactorRequiredFor(role),
    recoveryLeft: row?.twoFactorRecovery.length ?? 0,
  };
}

/**
 * Begin enrolment: mint a secret and hand back what the screen needs.
 *
 * The secret is written immediately but `twoFactorConfirmedAt` is NOT, so an
 * abandoned enrolment leaves an unusable half-state rather than locking anybody
 * out of an account they never finished pairing. Calling this again replaces
 * the secret, which is what somebody who lost their phone mid-setup expects.
 */
export async function beginEnrolment(userId: string, email: string): Promise<{ secret: string; uri: string }> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorConfirmedAt: true },
  });

  // Reuse an enrolment already in progress.
  //
  // This page renders on every visit, and minting a fresh secret each time
  // meant refreshing the tab — or coming back after fetching your phone —
  // silently invalidated the QR you had just scanned. The app would then show
  // codes that could never be right, with nothing on screen to say why.
  //
  // A secret with no confirmation is unusable for signing in, so keeping it
  // costs nothing. A CONFIRMED one is replaced: reaching this function while
  // already enrolled means re-enrolling, and that should start clean.
  const secret =
    existing?.twoFactorSecret && !existing.twoFactorConfirmedAt
      ? existing.twoFactorSecret
      : generateSecret();

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret, twoFactorConfirmedAt: null },
  });
  return { secret, uri: otpauthUri(secret, email) };
}

/** Ten codes, grouped for reading off a screen. */
function makeRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // randomInt, not Math.random: these are password-equivalent.
    const a = String(randomInt(0, 100000)).padStart(5, "0");
    const b = String(randomInt(0, 100000)).padStart(5, "0");
    codes.push(`${a}-${b}`);
  }
  return codes;
}

/**
 * Finish enrolment with a code from the app.
 *
 * Returns the recovery codes exactly once — they are stored hashed, so this is
 * the only moment they can be shown. Refusing here rather than accepting the
 * pairing on faith is the point: it proves the app actually has the secret,
 * rather than that somebody clicked past a QR they never scanned.
 */
export async function confirmEnrolment(
  userId: string,
  code: string,
): Promise<{ ok: true; recoveryCodes: string[] } | { ok: false; error: string }> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });
  if (!row?.twoFactorSecret) return { ok: false, error: "Start again — no setup is in progress." };
  if (!verifyTotp(row.twoFactorSecret, code, Date.now())) {
    return { ok: false, error: "That code isn't right. Check your app and try the current one." };
  }

  const recoveryCodes = makeRecoveryCodes();
  const hashed = await Promise.all(recoveryCodes.map((c) => bcrypt.hash(c, 10)));

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorConfirmedAt: new Date(), twoFactorRecovery: hashed, twoFactorOn: true },
  });

  return { ok: true, recoveryCodes };
}

/**
 * Check a code at sign-in. Accepts a recovery code as well as a TOTP.
 *
 * A recovery code is SPENT on use — removed from the array — so the sheet
 * somebody printed cannot be replayed by whoever finds it afterwards.
 */
export async function verifySecondFactor(userId: string, code: string): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorConfirmedAt: true, twoFactorRecovery: true },
  });
  if (!row?.twoFactorSecret || !row.twoFactorConfirmedAt) return false;

  if (verifyTotp(row.twoFactorSecret, code, Date.now())) return true;

  // Not a TOTP. It may be a recovery code — compare against every remaining
  // hash rather than short-circuiting, so a hit and a miss cost the same.
  const typed = code.trim();
  if (!/^\d{5}-\d{5}$/.test(typed)) return false;

  let matched = -1;
  for (let i = 0; i < row.twoFactorRecovery.length; i++) {
    if (await bcrypt.compare(typed, row.twoFactorRecovery[i])) matched = i;
  }
  if (matched < 0) return false;

  const remaining = row.twoFactorRecovery.filter((_, i) => i !== matched);
  await prisma.user.update({ where: { id: userId }, data: { twoFactorRecovery: remaining } });
  return true;
}

/** Turn it off. Requires a current code, so a hijacked session cannot. */
export async function disableTwoFactor(userId: string, code: string): Promise<boolean> {
  if (!(await verifySecondFactor(userId, code))) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: null, twoFactorConfirmedAt: null, twoFactorRecovery: [], twoFactorOn: false },
  });
  return true;
}
