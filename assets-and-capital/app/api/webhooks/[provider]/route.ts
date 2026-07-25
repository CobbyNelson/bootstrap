import { settleFromWebhook } from "@/lib/payments-server";

/**
 * Provider webhooks — the authoritative settlement path in live mode.
 *
 * Each provider signs its payload; that signature MUST be verified against the
 * raw body before trusting it. The verification seams are marked below and the
 * route refuses to settle unless the relevant secret is configured, so an
 * unsigned request can never activate a subscription.
 *
 *   stripe   → constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)
 *              reference = event.data.object.client_reference_id
 *   paystack → HMAC-SHA512(raw, PAYSTACK_SECRET_KEY) === x-paystack-signature
 *              reference = event.data.reference
 *   paypal   → verify transmission via PayPal webhook API
 *              reference = resource.custom_id
 */

const SECRET_ENV: Record<string, string | undefined> = {
  stripe: process.env.STRIPE_WEBHOOK_SECRET,
  paystack: process.env.PAYSTACK_SECRET_KEY,
  paypal: process.env.PAYPAL_CLIENT_SECRET,
};

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const raw = await req.text();

  const secret = SECRET_ENV[provider];
  if (!secret) {
    // No secret configured → cannot verify → must not settle.
    return Response.json(
      { ok: false, error: `Webhooks for ${provider} are not configured on this deployment.` },
      { status: 501 }
    );
  }

  // ---- signature verification seam -------------------------------------
  // Implement per provider using `raw` + the signature header before settling.
  // Until implemented, refuse rather than trust an unverified payload.
  const verified = false;
  if (!verified) {
    return Response.json(
      { ok: false, error: "Webhook signature verification is not implemented for this provider yet." },
      { status: 501 }
    );
  }

  let reference: string | undefined;
  try {
    const event = JSON.parse(raw);
    reference =
      event?.data?.object?.client_reference_id ?? event?.data?.reference ?? event?.resource?.custom_id;
  } catch {
    return Response.json({ ok: false, error: "Malformed payload." }, { status: 400 });
  }
  if (!reference) return Response.json({ ok: false, error: "No payment reference in payload." }, { status: 400 });

  const result = await settleFromWebhook(reference);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
