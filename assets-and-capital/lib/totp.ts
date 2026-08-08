import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * TOTP — RFC 6238, on top of HOTP — RFC 4226.
 *
 * Written here rather than pulled in, because this is not the kind of "rolling
 * your own crypto" that gets people hurt: there is no cipher and no key
 * exchange, only HMAC-SHA1 over a counter and a documented truncation. The
 * whole algorithm is forty lines, and both RFCs publish official test vectors —
 * so unlike a dependency, this can be PROVEN correct against the spec rather
 * than trusted. See scripts/check-totp.mts, which runs those vectors.
 *
 * SHA-1 is correct here and not a weakness. HOTP specifies HMAC-SHA1, every
 * authenticator app implements it, and HMAC-SHA1 is unbroken as a MAC — the
 * SHA-1 collision attacks are irrelevant to it. Using SHA-256 would be more
 * modern and would silently fail in Google Authenticator, which is worse.
 */

const DIGITS = 6;
const PERIOD = 30;

/* ------------------------------------------------------------ base32 */

/**
 * RFC 4648 base32, which is what authenticator apps read.
 *
 * Not base64: the secret is shown on screen for anyone whose camera cannot
 * reach the QR, and base32's alphabet has no case ambiguity and no characters
 * that look like each other in most fonts.
 */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  // People retype these off a screen, so spaces and padding are forgiven and
  // lowercase is accepted. What is NOT forgiven is a character outside the
  // alphabet — that is a typo, and silently dropping it would produce a secret
  // that is subtly wrong and fails forever with no explanation.
  const clean = input.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
  if (!clean || /[^A-Z2-7]/.test(clean)) throw new Error("not valid base32");

  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/* -------------------------------------------------------------- codes */

/** HOTP: RFC 4226 §5.3 — HMAC, dynamic truncation, modulo. */
function hotp(secret: Buffer, counter: number, digits = DIGITS, algo = "sha1"): string {
  const buf = Buffer.alloc(8);
  // A 64-bit counter in a language whose integers are doubles: write it as two
  // 32-bit halves rather than pretend Number can hold it.
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);

  const mac = createHmac(algo, secret).update(buf).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);

  return String(bin % 10 ** digits).padStart(digits, "0");
}

/** The code an app would be showing at `atMs`. */
export function totp(secretB32: string, atMs: number, digits = DIGITS, period = PERIOD, algo = "sha1"): string {
  return hotp(base32Decode(secretB32), Math.floor(atMs / 1000 / period), digits, algo);
}

/**
 * Check a code somebody typed.
 *
 * `window` accepts the neighbouring steps. One either side is the usual
 * compromise: phone clocks drift, and a code entered in the last second of its
 * window arrives in the next one. Widening it to 2 would triple the guess
 * space for a six-digit code, so it stays at 1.
 *
 * Compared with `timingSafeEqual`, so the answer takes the same time whether
 * the first digit was wrong or only the last.
 */
export function verifyTotp(secretB32: string, code: string, atMs: number, window = 1): boolean {
  const typed = code.replace(/\D/g, "");
  if (typed.length !== DIGITS) return false;

  const typedBuf = Buffer.from(typed);
  let ok = false;
  for (let drift = -window; drift <= window; drift++) {
    const expected = totp(secretB32, atMs + drift * PERIOD * 1000);
    const expBuf = Buffer.from(expected);
    // No early return: every candidate is compared, so the loop takes the same
    // time whether the match was the first step or the last.
    if (expBuf.length === typedBuf.length && timingSafeEqual(expBuf, typedBuf)) ok = true;
  }
  return ok;
}

/* ------------------------------------------------------- enrolment */

/** A fresh secret. 20 bytes is what RFC 4226 §4 R6 requires as a minimum. */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

/**
 * The otpauth:// URI an authenticator app scans.
 *
 * The issuer appears twice on purpose — once in the label and once as a
 * parameter. Older apps read only the label; newer ones prefer the parameter,
 * and disagreeing about it is how an account ends up listed twice.
 */
export function otpauthUri(secretB32: string, account: string, issuer = "Assets & Capital"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretB32,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Seconds until the current code rolls over — for the countdown on screen. */
export function secondsRemaining(atMs: number, period = PERIOD): number {
  return period - (Math.floor(atMs / 1000) % period);
}
