/**
 * WHO needs a second factor. No database, no `server-only`.
 *
 * Split out from lib/two-factor.ts because middleware runs on the edge runtime,
 * where `server-only` throws and Prisma cannot go. The policy is a pure
 * function of the role and one environment variable, so it is safe in both
 * places — and keeping it in one file means the edge gate and the server pages
 * cannot disagree about who is exempt.
 */

/**
 * Admins are exempt until launch — ON PURPOSE, and temporarily.
 *
 * Every admin account today is a developer account. Forcing enrolment now means
 * every fresh environment, every restored database and every teammate joining
 * mid-build begins by pairing an authenticator to a throwaway login. That is
 * friction with no attacker on the other side of it, and it ends with somebody
 * disabling 2FA wholesale to get work done.
 *
 * An environment variable rather than a code branch, so going live is a deploy
 * setting instead of a pull request somebody has to remember to write:
 *
 *     ADMIN_2FA_REQUIRED=true
 *
 * THIS MUST BE SET BEFORE LAUNCH. An admin account on a capital marketplace is
 * the highest-value credential here. Admins can already enrol voluntarily; this
 * governs only whether they are forced to.
 */
export function adminTwoFactorRequired(): boolean {
  return process.env.ADMIN_2FA_REQUIRED === "true";
}

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

/** Everyone must enrol; admins only once the flag above is on. */
export function twoFactorRequiredFor(role: string): boolean {
  return ADMIN_ROLES.has(role) ? adminTwoFactorRequired() : true;
}
