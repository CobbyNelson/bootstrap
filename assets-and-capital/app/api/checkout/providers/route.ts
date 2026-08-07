import { getCurrentUser } from "@/lib/session";
import { configuredProviders } from "@/lib/payment-providers";
import { paymentsTestMode } from "@/lib/payments";

/**
 * Which payment methods to actually offer.
 *
 * Offering a provider that has no keys means a visitor picks it, fills in a
 * form, and gets an error the platform could have predicted before showing it.
 * In TEST MODE everything is offered, because that is the mode's whole purpose:
 * exercising each path without any provider being live.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ providers: [], testMode: paymentsTestMode() }, { status: 401 });

  if (paymentsTestMode()) {
    return Response.json({ providers: ["stripe", "paystack", "paypal", "momo"], testMode: true });
  }

  const live = configuredProviders();
  // Mobile Money rides on Paystack, so it is offered exactly when Paystack is.
  if (live.includes("paystack")) live.push("momo");
  return Response.json({ providers: live, testMode: false });
}
