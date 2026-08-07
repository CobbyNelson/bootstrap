import "server-only";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { paymentsTestMode, TEST_CARDS } from "@/lib/payments";
import { startCharge, providerConfigured } from "@/lib/payment-providers";

/**
 * Server-authoritative payment flow.
 *
 *   create()  → records a PENDING PaymentIntent (requires a session)
 *   confirm() → validates the attempt and, only on success, marks the intent
 *               SUCCEEDED and activates the subscription
 *
 * The client can never activate a subscription directly: activation happens
 * here, keyed to an intent this server created and verified. In live mode the
 * provider webhook calls settle() instead of the test-mode branch.
 */

export type CreateResult = { ok: boolean; reference?: string; error?: string; redirectUrl?: string };
export type ConfirmResult = { ok: boolean; plan?: string; error?: string; declined?: boolean };

const PLAN_PRICES: Record<string, string> = {
  "Investor Pro": "$149 / month",
  "Investor Elite": "$399 / month",
};

/**
 * The charge in the smallest currency unit.
 *
 * Kept beside the labels rather than parsed out of them: "$149 / month" is
 * copy, and deriving money from a display string means a wording change can
 * alter what a card is charged.
 */
const PLAN_AMOUNTS_MINOR: Record<string, number> = {
  "Investor Pro": 14900,
  "Investor Elite": 39900,
};

const CURRENCY = process.env.PAYMENTS_CURRENCY || "USD";

export function isKnownPlan(plan: string): boolean {
  return Object.prototype.hasOwnProperty.call(PLAN_PRICES, plan);
}

export async function createIntent(
  userId: string,
  provider: string,
  plan: string,
  email: string,
): Promise<CreateResult> {
  if (!isKnownPlan(plan)) return { ok: false, error: "Unknown plan." };
  try {
    const reference = `AC-${randomUUID()}`;
    await prisma.paymentIntent.create({
      data: {
        userId,
        reference,
        provider,
        plan,
        amountLabel: PLAN_PRICES[plan],
        testMode: paymentsTestMode(),
        status: "PENDING",
      },
    });
    return { ok: true, reference };
  } catch (e) {
    console.error("createIntent failed", e);
    return { ok: false, error: "We couldn't start checkout. Please try again." };
  }
}

/** Activate the subscription for a SUCCEEDED intent. Idempotent. */
async function settle(reference: string): Promise<ConfirmResult> {
  const intent = await prisma.paymentIntent.findUnique({ where: { reference } });
  if (!intent) return { ok: false, error: "Unknown payment reference." };
  if (intent.status === "PAID") return { ok: true, plan: intent.plan };

  await prisma.$transaction([
    prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: "PAID" } }),
    prisma.investorSubscription.upsert({
      where: { userId: intent.userId },
      create: { userId: intent.userId, plan: intent.plan, active: true },
      update: { plan: intent.plan, active: true },
    }),
  ]);
  return { ok: true, plan: intent.plan };
}

/**
 * Confirm a checkout attempt.
 * TEST MODE: the card number is validated here on the server — the decline card
 * always declines, so a client cannot fake a success.
 * LIVE MODE: this does not settle; the provider webhook does.
 */
export async function confirmIntent(
  userId: string,
  reference: string,
  cardNumber?: string
): Promise<ConfirmResult> {
  try {
    const intent = await prisma.paymentIntent.findUnique({ where: { reference } });
    if (!intent || intent.userId !== userId) return { ok: false, error: "Unknown payment reference." };
    if (intent.status === "PAID") return { ok: true, plan: intent.plan };

    if (!paymentsTestMode()) {
      return {
        ok: false,
        error: "Awaiting confirmation from the payment provider.",
      };
    }

    const digits = (cardNumber ?? "").replace(/\D/g, "");
    const decline = TEST_CARDS.decline.replace(/\s/g, "");
    const approve = TEST_CARDS.success.replace(/\s/g, "");

    // Card providers must present a test card; wallets (PayPal/Google Pay)
    // approve in test mode without card entry.
    const isCardFlow = intent.provider === "stripe" || intent.provider === "paystack";
    if (isCardFlow) {
      if (digits === decline) {
        await prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: "FAILED" } });
        return { ok: false, declined: true, error: "Your card was declined. (This is the test decline card.)" };
      }
      if (digits !== approve) {
        await prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: "FAILED" } });
        return {
          ok: false,
          declined: true,
          error: `In test mode use ${TEST_CARDS.success} to approve or ${TEST_CARDS.decline} to decline.`,
        };
      }
    }

    return settle(reference);
  } catch (e) {
    console.error("confirmIntent failed", e);
    return { ok: false, error: "We couldn't complete the payment. Please try again." };
  }
}

/** Called by provider webhooks once a real payment is confirmed. */
export async function settleFromWebhook(reference: string, providerRef?: string): Promise<ConfirmResult> {
  try {
    const intent = await prisma.paymentIntent.findUnique({ where: { reference } });
    if (!intent) return { ok: false, error: "Unknown payment reference." };
    if (providerRef) {
      await prisma.paymentIntent.update({ where: { id: intent.id }, data: { providerRef } });
    }
    return settle(reference);
  } catch (e) {
    console.error("settleFromWebhook failed", e);
    return { ok: false, error: "Could not settle payment." };
  }
}
