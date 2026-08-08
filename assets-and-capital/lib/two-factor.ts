import "server-only";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { verifyTotp, generateSecret, otpauthUri } from "@/lib/totp";

/**
 * Who must present a second factor, and what state their enrolment is in.
 *
 * The policy lives here rather than being repeated at each call site, because
 * a rule about who may skip authentication is exactly the sort of thing that
 * drifts when it is written down three times.
 */

/**
 * Admins are exempt until launch — ON PURPOSE, and temporarily.
 *
 * Every admin account is currently a developer account, and forcing enrolment
 * on them now means every fresh environment, every restored database and every
 * teammate joining mid-build starts by pairing an authenticator against a
 * throwaway account. That is friction with no attacker on the other side of it,
 * and the predictable result is somebody disabling 2FA wholesale to get work
 * done.
 *
 * The exemption is a single environment variable rather than a code branch, so
 * going live is a deploy setting rather than a pull request somebody has to
 * remember to write:
 *
 *     ADMIN_2FA_REQUIRED=true
 *
 * THIS MUST BE SET BEFORE LAUNCH. An admin account on a capital marketplace is
 * the highest-value credential on the platform; leaving it on a password alone
 * is only defensible while the platform holds nothing real. Admins can already
 * enrol voluntarily today — this governs whether they are *forced* to.
 */
export function adminTwoFactorRequired(): boolean {
  return process.env.ADMIN_2FA_REQUIRED === "true";
}

/** Roles that must complete enrolment before reaching anything. */
export function twoFactorRequiredFor(role: string): boolean {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "STAFF";
  return isAdmin ? adminTwoFactorRequired() : true;
}

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
  const secret = generateSecret();
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
