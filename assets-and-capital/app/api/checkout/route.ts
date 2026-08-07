import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { createIntent } from "@/lib/payments-server";
import { paymentsTestMode } from "@/lib/payments";

/**
 * Start checkout. Records a PENDING PaymentIntent server-side and returns its
 * reference; the client cannot mint or settle one itself.
 *
 * In live mode this is where each provider's server SDK creates the real
 * session/transaction, passing `reference` so the webhook can match it back:
 *   stripe   → checkout.sessions.create({ client_reference_id: reference })
 *   paystack → transaction/initialize { reference }
 *   paypal   → orders create { custom_id: reference }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  // Starting a checkout is cheap for the caller and not for us: each one can create a provider session. Metered per account.
  if (user) {
    const gate = rateLimit(`checkout:${user.id}`, 12, 60_000);
    if (!gate.ok) {
      return Response.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  }
  if (!user) return Response.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });

  let body: { provider?: string; plan?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  const { provider, plan } = body;
  if (!provider || !plan) {
    return Response.json({ ok: false, error: "Missing provider or plan." }, { status: 400 });
  }

  const result = await createIntent(user.id, provider, plan, user.email);
  if (!result.ok) return Response.json(result, { status: 400 });

  // redirectUrl is present only in live mode with a configured provider. The
  // dialog sends the visitor there; in test mode it stays put and simulates.
  return Response.json({
    ok: true,
    reference: result.reference,
    redirectUrl: result.redirectUrl,
    testMode: paymentsTestMode(),
  });
}
