import { getCurrentUser } from "@/lib/session";
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

  const result = await createIntent(user.id, provider, plan);
  if (!result.ok) return Response.json(result, { status: 400 });

  return Response.json({ ok: true, reference: result.reference, testMode: paymentsTestMode() });
}
