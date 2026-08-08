/**
 * Who is forced to use a second factor, and who is not — yet.
 *
 *   npm run check:2fa
 *
 * This is a policy, and a policy about skipping authentication is worth an
 * assertion rather than a comment. The admin exemption in particular is
 * temporary and easy to forget, so this pins BOTH states: exempt while the flag
 * is off, required the moment it is on.
 */
import { twoFactorRequiredFor, adminTwoFactorRequired } from "../lib/two-factor-policy";

let bad = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  if (got !== want) { bad++; console.error(`  ${label}: got ${got}, want ${want}`); }
};

const ADMINS = ["ADMIN", "SUPER_ADMIN", "STAFF"];
const USERS = ["INVESTOR", "BUSINESS", "USER"];

// --- development: admins exempt, everyone else required
delete process.env.ADMIN_2FA_REQUIRED;
eq("flag off", adminTwoFactorRequired(), false);
for (const r of ADMINS) eq(`${r} exempt while developing`, twoFactorRequiredFor(r), false);
for (const r of USERS) eq(`${r} required always`, twoFactorRequiredFor(r), true);

// --- launch: the flag is the whole switch
process.env.ADMIN_2FA_REQUIRED = "true";
eq("flag on", adminTwoFactorRequired(), true);
for (const r of ADMINS) eq(`${r} required at launch`, twoFactorRequiredFor(r), true);
for (const r of USERS) eq(`${r} still required`, twoFactorRequiredFor(r), true);

// --- only the exact string enables it; a stray value must not silently exempt
for (const v of ["1", "yes", "TRUE", "", "false"]) {
  process.env.ADMIN_2FA_REQUIRED = v;
  eq(`ADMIN_2FA_REQUIRED=${JSON.stringify(v)} does not enforce`, twoFactorRequiredFor("ADMIN"), false);
}

// --- an unknown role must default to REQUIRED, never exempt
process.env.ADMIN_2FA_REQUIRED = "false";
for (const r of ["", "GUEST", "admin", "Admin", "SUPERADMIN"]) {
  eq(`unknown role ${JSON.stringify(r)} is required`, twoFactorRequiredFor(r), true);
}

if (bad > 0) { console.error(`\n2FA policy check FAILED — ${bad}`); process.exit(1); }
console.log("2FA policy check passed: admins exempt only while ADMIN_2FA_REQUIRED is unset, everyone else always, unknown roles fail closed");
