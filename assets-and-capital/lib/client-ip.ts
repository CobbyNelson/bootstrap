/**
 * Who is actually making this request.
 *
 * Every rate limit on the site keys on this, so getting it wrong is not a
 * cosmetic bug: one shared value throttles the whole internet as a single
 * visitor, and an attacker-controlled one throttles nobody.
 *
 * THE CLOUDFLARE TRAP. `X-Forwarded-For` is a LIST, and each proxy APPENDS to
 * it. Behind Cloudflare a request from an attacker who sends
 *
 *     X-Forwarded-For: 1.2.3.4
 *
 * arrives at the origin as `1.2.3.4, <their real IP>` — so reading the first
 * entry, which is what all six call sites used to do, returns a value the
 * caller chose. Rotating it defeats the login throttle, the site-unlock
 * brute-force limit and every form's submission cap at once. The header was
 * safe only while Caddy was the sole proxy, because Caddy REPLACES it (verified
 * by probing two spoofed values and landing in the same bucket).
 *
 * `CF-Connecting-IP` is a single value Cloudflare sets itself and does not
 * append to, so it cannot be smuggled through — provided the request really
 * came from Cloudflare. That proviso is the whole reason for the flag below:
 * anyone hitting the origin directly can set the header themselves, so it is
 * trusted only once the origin is closed to everything but Cloudflare.
 */

/**
 * Set to "true" only AFTER the origin firewall is closed to non-Cloudflare
 * traffic. Trusting the header while the origin is still reachable directly
 * hands an attacker the same spoof through a different name.
 */
function trustCloudflare(): boolean {
  return process.env.TRUST_CLOUDFLARE === "true";
}

/** A conservative sanity check — this string ends up in a rate-limit key. */
function plausible(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  return /^[0-9a-fA-F:.]+$/.test(ip);
}

export function clientIp(headers: Headers): string {
  if (trustCloudflare()) {
    const cf = headers.get("cf-connecting-ip")?.trim();
    if (cf && plausible(cf)) return cf;
  }

  // Not behind Cloudflare (or not trusting it yet): Caddy replaces this header
  // rather than appending, so the first entry is the peer it actually saw.
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff && plausible(xff)) return xff;

  const real = headers.get("x-real-ip")?.trim();
  if (real && plausible(real)) return real;

  // Deliberately a constant rather than a random value: everything unidentified
  // shares one bucket, which throttles rather than exempts.
  return "unknown";
}
