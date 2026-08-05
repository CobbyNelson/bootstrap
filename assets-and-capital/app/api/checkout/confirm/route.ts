import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { confirmIntent } from "@/lib/payments-server";

/**
 * Confirm a checkout attempt. In test mode the server validates the card and
 * settles; in live mode settlement comes from the provider webhook instead.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  // Confirmation drives entitlement. Metered so a loose reference cannot be brute-forced by replaying confirmations.
  if (user) {
    const gate = rateLimit(`checkout-confirm:${user.id}`, 20, 60_000);
    if (!gate.ok) {
      return Response.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
      );
    }
  }
  if (!user) return Response.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });

  let body: { reference?: string; cardNumber?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  if (!body.reference) return Response.json({ ok: false, error: "Missing payment reference." }, { status: 400 });

  const result = await confirmIntent(user.id, body.reference, body.cardNumber);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
