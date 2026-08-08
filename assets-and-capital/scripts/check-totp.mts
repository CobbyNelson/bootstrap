/**
 * lib/totp.ts against the vectors published in the RFCs themselves.
 *
 *   npm run check:totp
 *
 * This is the reason it was reasonable to implement TOTP rather than install
 * it. A dependency is trusted; this is CHECKED — every number below is copied
 * from RFC 4226 Appendix D, RFC 6238 Appendix B, or RFC 4648 §10, so a passing
 * run means the implementation agrees with the specification every
 * authenticator app was written against, not merely with itself.
 *
 * If these ever fail, do not adjust the expectations. The RFCs are right.
 */
import { base32Encode, base32Decode, totp, verifyTotp, generateSecret, otpauthUri, secondsRemaining } from "../lib/totp";

let bad = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  if (got !== want) {
    bad++;
    console.error(`  ${label}\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`);
  }
};

/* ------------------------------------------- RFC 4648 §10 — base32 */

// The encoder emits no padding, so the expectations are unpadded.
for (const [plain, b32] of [
  ["", ""], ["f", "MY"], ["fo", "MZXQ"], ["foo", "MZXW6"],
  ["foob", "MZXW6YQ"], ["fooba", "MZXW6YTB"], ["foobar", "MZXW6YTBOI"],
] as const) {
  eq(`base32Encode(${JSON.stringify(plain)})`, base32Encode(Buffer.from(plain)), b32);
  if (b32) eq(`base32Decode(${b32})`, base32Decode(b32).toString(), plain);
}

// Padding and lowercase are forgiven, because people retype these off a screen.
eq("padded input decodes", base32Decode("MZXW6YTBOI======").toString(), "foobar");
eq("lowercase decodes", base32Decode("mzxw6ytboi").toString(), "foobar");
eq("spaced input decodes", base32Decode("MZXW 6YTB OI").toString(), "foobar");

// A character outside the alphabet is a typo, and must not be silently dropped.
let threw = false;
try { base32Decode("MZXW6YTB0I"); } catch { threw = true; }  // 0 is not base32
eq("invalid base32 throws", threw, true);

/* --------------------------------------- RFC 4226 Appendix D — HOTP */

// The RFC's secret is the ASCII string "12345678901234567890".
const SEED = base32Encode(Buffer.from("12345678901234567890"));

// HOTP counter N is TOTP at time N*30, so the published HOTP vectors are
// reachable through the same function.
const HOTP = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"];
HOTP.forEach((want, counter) => {
  eq(`RFC 4226 counter ${counter}`, totp(SEED, counter * 30 * 1000), want);
});

/* --------------------------------------- RFC 6238 Appendix B — TOTP */

// Eight digits, SHA-1, as published.
for (const [seconds, want] of [
  [59, "94287082"],
  [1111111109, "07081804"],
  [1111111111, "14050471"],
  [1234567890, "89005924"],
  [2000000000, "69279037"],
  [20000000000, "65353130"],
] as const) {
  eq(`RFC 6238 t=${seconds}`, totp(SEED, seconds * 1000, 8), want);
}

/* ------------------------------------------------ behaviour we rely on */

const NOW = 1_700_000_000_000;
const secret = generateSecret();

eq("a fresh secret is 32 base32 chars (20 bytes)", secret.length, 32);
eq("the current code verifies", verifyTotp(secret, totp(secret, NOW), NOW), true);

// Clock drift: one step either side is accepted, two is not.
eq("previous step accepted", verifyTotp(secret, totp(secret, NOW - 30_000), NOW), true);
eq("next step accepted", verifyTotp(secret, totp(secret, NOW + 30_000), NOW), true);
eq("two steps back refused", verifyTotp(secret, totp(secret, NOW - 90_000), NOW), false);
eq("two steps forward refused", verifyTotp(secret, totp(secret, NOW + 90_000), NOW), false);

// Rubbish is refused rather than throwing — this runs on user input.
for (const junk of ["", "12345", "1234567", "abcdef", "<script>", "000000 "]) {
  const got = verifyTotp(secret, junk, NOW);
  if (got && junk.replace(/\D/g, "") !== totp(secret, NOW)) {
    bad++;
    console.error(`  junk code accepted: ${JSON.stringify(junk)}`);
  }
}

// A code for one account must not work for another.
eq("another user's code is refused", verifyTotp(generateSecret(), totp(secret, NOW), NOW), false);

// The URI an app scans.
const uri = otpauthUri(secret, "ama@kumasiagri.com");
for (const part of ["otpauth://totp/", "secret=" + secret, "issuer=Assets", "digits=6", "period=30", "algorithm=SHA1"]) {
  if (!uri.includes(part)) { bad++; console.error(`  otpauth URI missing ${part}\n      ${uri}`); }
}

// Derived, not hand-computed: the first attempt at these asserted 20 and 30
// against a function that correctly returns 30 and 10, so the test was wrong
// and the code was right. A literal here only ever tests my mental arithmetic.
for (const ms of [1_700_000_000_000, 1_700_000_010_000, 1_700_000_029_000]) {
  eq(`countdown at ${ms}`, secondsRemaining(ms), 30 - (Math.floor(ms / 1000) % 30));
}
// And whatever it returns must land inside the step.
for (const ms of [NOW, NOW + 7_000, NOW + 29_000]) {
  const left = secondsRemaining(ms);
  if (left < 1 || left > 30) { bad++; console.error(`  countdown out of range: ${left}`); }
}

if (bad > 0) {
  console.error(`\nTOTP check FAILED — ${bad} case(s)`);
  process.exit(1);
}
console.log("TOTP check passed: RFC 4226 + RFC 6238 + RFC 4648 vectors, drift window, junk input, cross-account isolation");
