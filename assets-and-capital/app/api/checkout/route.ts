import { paymentsTestMode } from "@/lib/payments";

/**
 * Checkout seam. In TEST MODE it returns a simulated success (no real charge)
 * so the whole flow is exercisable. In live mode this is where each provider's
 * server SDK creates a real session/transaction:
 *
 *   stripe    → stripe.checkout.sessions.create(...)      → return session.url
 *   paystack  → POST transaction/initialize              → return authorization_url
 *   paypal    → POST /v2/checkout/orders                 → return approve link
 *   googlepay → confirm the token via the underlying PSP (Stripe/Paystack)
 *
 * Secrets stay server-side (see .env.example). A matching webhook route would
 * then confirm payment and flip the subscription in the database.
 */
export async function POST(req: Request) {
  let body: { provider?: string; plan?: string; amount?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  const { provider, plan, amount } = body;

  if (!provider || !plan) {
    return Response.json({ ok: false, error: "Missing provider or plan." }, { status: 400 });
  }

  if (paymentsTestMode()) {
    const reference = `TEST-${provider}-${plan}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
    return Response.json({
      ok: true,
      testMode: true,
      provider,
      plan,
      amount: amount ?? null,
      reference,
      message: "Test-mode payment — no real charge was made.",
    });
  }

  // Live mode: no server keys configured on this deployment yet.
  return Response.json(
    { ok: false, error: "Live payments are not configured on this deployment." },
    { status: 501 }
  );
}
