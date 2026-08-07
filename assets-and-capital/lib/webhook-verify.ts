import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify that a webhook really came from the provider.
 *
 * This is the only thing standing between a stranger with a URL and a free
 * subscription. Every check below runs against the RAW body — parsing first and
 * re-serialising changes bytes, and a signature over different bytes is not a
 * signature.
 *
 * Comparisons are constant-time. A fast string compare leaks how much of a
 * candidate signature was correct, which over enough attempts is enough to
 * construct a valid one.
 */

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Stripe signs `t=<timestamp>,v1=<hmac>` over `timestamp.body`.
 *
 * The timestamp is checked as well as the signature: without that, a valid
 * payload captured once can be replayed for ever, and a replayed
 * checkout.session.completed settles the same intent again.
 */
export function verifyStripe(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, ...v] = p.split("=");
      return [k.trim(), v.join("=")];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Paystack signs the raw body with HMAC-SHA512 under the secret key. */
export function verifyPaystack(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  return safeEqual(expected, header);
}

/**
 * PayPal does not sign with a shared secret — verification is a call back to
 * PayPal with the transmission headers, which is why this one is async and the
 * others are not.
 */
export async function verifyPayPal(
  raw: string,
  headers: Headers,
  opts: { clientId: string; clientSecret: string; webhookId: string; base: string },
): Promise<boolean> {
  const required = [
    "paypal-transmission-id",
    "paypal-transmission-time",
    "paypal-transmission-sig",
    "paypal-cert-url",
    "paypal-auth-algo",
  ];
  if (required.some((h) => !headers.get(h))) return false;

  const tokenRes = await fetch(`${opts.base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${opts.clientId}:${opts.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) return false;
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return false;

  const res = await fetch(`${opts.base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_time: headers.get("paypal-transmission-time"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      cert_url: headers.get("paypal-cert-url"),
      auth_algo: headers.get("paypal-auth-algo"),
      webhook_id: opts.webhookId,
      // PayPal wants the event as JSON, not a string, so this one parse is
      // unavoidable — PayPal itself re-serialises to check.
      webhook_event: JSON.parse(raw),
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
