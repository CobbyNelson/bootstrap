import { settleFromWebhook } from "@/lib/payments-server";
import { verifyStripe, verifyPaystack, verifyPayPal } from "@/lib/webhook-verify";

/**
 * Provider webhooks — the authoritative settlement path in live mode.
 *
 * This is the only thing between a stranger with a URL and a free subscription.
 * Every provider signs its payload and the signature is checked against the RAW
 * body before anything is trusted; a route that cannot verify REFUSES rather
 * than settling, so a missing secret fails closed.
 *
 * Settlement happens here and not on the return URL. A visitor coming back from
 * a provider is a navigation, and anyone can navigate — treating that as proof
 * of payment is how a checkout gets given away.
 */

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const raw = await req.text();

  let verified = false;

  if (provider === "stripe") {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return notConfigured(provider);
    verified = verifyStripe(raw, req.headers.get("stripe-signature"), secret);
  } else if (provider === "paystack") {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return notConfigured(provider);
    verified = verifyPaystack(raw, req.headers.get("x-paystack-signature"), secret);
  } else if (provider === "paypal") {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!clientId || !clientSecret || !webhookId) return notConfigured(provider);
    verified = await verifyPayPal(raw, req.headers, {
      clientId,
      clientSecret,
      webhookId,
      base: PAYPAL_BASE,
    });
  } else {
    return Response.json({ ok: false, error: "Unknown provider." }, { status: 404 });
  }

  if (!verified) {
    // Deliberately terse. A detailed reason tells whoever is probing which part
    // of the signature they got wrong.
    return Response.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "Malformed payload." }, { status: 400 });
  }

  /*
   * A verified webhook is not the same as a successful payment.
   *
   * Providers send failures, expiries and disputes down the same signed
   * channel. Settling on any verified event would activate a subscription on
   * `payment_intent.payment_failed`.
   */
  if (!isSuccess(provider, event)) {
    return Response.json({ ok: true, ignored: true });
  }

  const reference = extractReference(event);
  if (!reference) {
    return Response.json({ ok: false, error: "No payment reference in payload." }, { status: 400 });
  }

  const result = await settleFromWebhook(reference);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}

function notConfigured(provider: string) {
  return Response.json(
    { ok: false, error: `Webhooks for ${provider} are not configured on this deployment.` },
    { status: 501 },
  );
}

function isSuccess(provider: string, event: Record<string, unknown>): boolean {
  const type = String(event.type ?? event.event ?? "");
  if (provider === "stripe") {
    if (type !== "checkout.session.completed") return false;
    const obj = (event.data as { object?: { payment_status?: string } })?.object;
    // A completed session can still be unpaid — an async method that has not
    // cleared yet. `payment_status` is the one that means money moved.
    return obj?.payment_status === "paid";
  }
  if (provider === "paystack") {
    if (type !== "charge.success") return false;
    const data = event.data as { status?: string } | undefined;
    return data?.status === "success";
  }
  if (provider === "paypal") {
    return type === "PAYMENT.CAPTURE.COMPLETED" || type === "CHECKOUT.ORDER.APPROVED";
  }
  return false;
}

function extractReference(event: Record<string, unknown>): string | undefined {
  const stripe = (event.data as { object?: { client_reference_id?: string } })?.object?.client_reference_id;
  const paystack = (event.data as { reference?: string })?.reference;
  const paypal =
    (event.resource as { custom_id?: string })?.custom_id ??
    (event.resource as { purchase_units?: { custom_id?: string }[] })?.purchase_units?.[0]?.custom_id;
  return stripe ?? paystack ?? paypal;
}
