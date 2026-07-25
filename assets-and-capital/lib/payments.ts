import { CreditCard, Wallet, Landmark, Smartphone } from "lucide-react";

/**
 * Payment layer — provider-agnostic. The UI (checkout-dialog) and the server
 * seam (app/api/checkout) both read this. Real charges require server SDKs +
 * secret keys (see .env.example); until then TEST MODE simulates the flow
 * end-to-end and activates the subscription without a real charge.
 */

export type ProviderId = "stripe" | "paystack" | "paypal" | "googlepay";
export type PayKind = "card" | "redirect" | "wallet";

export type PayProvider = {
  id: ProviderId;
  name: string;
  sub: string;
  via: string;
  accent: string;
  icon: typeof CreditCard;
  kind: PayKind;
};

export const PAY_PROVIDERS: PayProvider[] = [
  {
    id: "stripe",
    name: "Card",
    sub: "Visa · Mastercard · Amex",
    via: "Stripe",
    accent: "#635BFF",
    icon: CreditCard,
    kind: "card",
  },
  {
    id: "paystack",
    name: "Paystack",
    sub: "Cards & bank transfer",
    via: "Paystack",
    accent: "#0BA4DB",
    icon: Landmark,
    kind: "card",
  },
  {
    id: "paypal",
    name: "PayPal",
    sub: "Pay with your balance",
    via: "PayPal",
    accent: "#0070BA",
    icon: Wallet,
    kind: "redirect",
  },
  {
    id: "googlepay",
    name: "Google Pay",
    sub: "Fast wallet checkout",
    via: "Google",
    accent: "#1A73E8",
    icon: Smartphone,
    kind: "wallet",
  },
];

/** Stripe/Paystack-style test cards for the simulated card flow. */
export const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  decline: "4000 0000 0000 0002",
};

/**
 * Test mode is on unless explicitly disabled. Flip by setting
 * NEXT_PUBLIC_PAYMENTS_TEST_MODE="false" once live keys are in place.
 */
export function paymentsTestMode(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_TEST_MODE !== "false";
}
