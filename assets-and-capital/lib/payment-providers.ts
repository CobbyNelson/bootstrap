import "server-only";

/**
 * Real provider calls, behind one shape.
 *
 * Each adapter turns a plan and a reference into a URL to send the visitor to,
 * or reports that it is not configured. Called over REST rather than through
 * each vendor's SDK: three SDKs is three dependency trees and three upgrade
 * cadences for what is, in each case, one signed POST.
 *
 * Nothing here settles anything. The visitor comes back from the provider and
 * the WEBHOOK decides whether money moved — a return URL is a navigation, and
 * treating it as proof of payment is how a checkout gets given away for free.
 *
 * DECISIONS TAKEN, and why they are not more integrations:
 *
 *   Google Pay and Apple Pay are not processors. They are wallets that ride on
 *   Stripe's payment sheet and appear automatically on eligible devices once
 *   enabled in the Stripe dashboard. There is no fourth integration to write.
 *
 *   MTN Mobile Money runs through Paystack as a CHANNEL, not a separate rail.
 *   MTN's own Collections API is real, but it needs its own business account,
 *   per-market subscription keys and its own reconciliation — and offers no
 *   card fallback. Paystack settles MoMo in Ghana today through the
 *   integration that is already here.
 */

export type ProviderCharge =
  | { ok: true; url: string; providerRef?: string }
  | { ok: false; error: string; unconfigured?: boolean };

export type ChargeInput = {
  reference: string;
  amountMinor: number;
  currency: string;
  email: string;
  plan: string;
  returnUrl: string;
};

/**
 * Mobile Money is a Paystack CHANNEL presented as its own choice.
 *
 * Someone in Accra looks for MoMo, not for Paystack, so it is named at
 * checkout — but everything behind it is the Paystack integration, which is
 * why it resolves here rather than becoming a fourth adapter.
 */
function resolve(provider: string): string {
  return provider === "momo" ? "paystack" : provider;
}

export function providerConfigured(provider: string): boolean {
  switch (resolve(provider)) {
    case "stripe":
      return Boolean(process.env.STRIPE_SECRET_KEY);
    case "paystack":
      return Boolean(process.env.PAYSTACK_SECRET_KEY);
    case "paypal":
      return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
    default:
      return false;
  }
}

/** Which providers a visitor should actually be offered right now. */
export function configuredProviders(): string[] {
  return ["stripe", "paystack", "paypal"].filter(providerConfigured);
}

/* ----------------------------------------------------------------- Stripe */

/**
 * Cards, Google Pay and Apple Pay in one session.
 *
 * `automatic_payment_methods` lets Stripe decide what to show for the device
 * and the currency, which is what makes the wallets appear without a second
 * integration. `client_reference_id` is what the webhook matches back — it must
 * be our reference and not the session id, or a settlement cannot be tied to
 * the intent that started it.
 */
async function stripeCharge(input: ChargeInput): Promise<ProviderCharge> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ok: false, error: "Stripe is not configured.", unconfigured: true };

  const form = new URLSearchParams({
    mode: "payment",
    client_reference_id: input.reference,
    customer_email: input.email,
    success_url: `${input.returnUrl}?ref=${input.reference}&status=success`,
    cancel_url: `${input.returnUrl}?ref=${input.reference}&status=cancelled`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": input.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(input.amountMinor),
    "line_items[0][price_data][product_data][name]": `Assets & Capital — ${input.plan}`,
    "automatic_payment_methods[enabled]": "true",
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("stripe session failed", res.status, body);
    return { ok: false, error: "Could not start the card payment." };
  }
  const data = (await res.json()) as { id?: string; url?: string };
  if (!data.url) return { ok: false, error: "Stripe did not return a checkout URL." };
  return { ok: true, url: data.url, providerRef: data.id };
}

/* --------------------------------------------------------------- Paystack */

/**
 * Cards, bank transfer and MTN Mobile Money.
 *
 * The channels are listed explicitly rather than left to the account default:
 * `mobile_money` is what puts MTN MoMo on the sheet in Ghana, and a silent
 * account-level change should not be able to remove a payment method the
 * marketing pages promise.
 *
 * Paystack works in the smallest unit of the account's currency, same as
 * Stripe, so the caller's `amountMinor` needs no conversion.
 */
async function paystackCharge(input: ChargeInput): Promise<ProviderCharge> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { ok: false, error: "Paystack is not configured.", unconfigured: true };

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: `${input.returnUrl}?ref=${input.reference}`,
      channels: ["card", "mobile_money", "bank_transfer", "ussd"],
      metadata: { plan: input.plan },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("paystack init failed", res.status, body);
    return { ok: false, error: "Could not start the Paystack payment." };
  }
  const data = (await res.json()) as {
    status?: boolean;
    data?: { authorization_url?: string; reference?: string };
  };
  if (!data.status || !data.data?.authorization_url) {
    return { ok: false, error: "Paystack did not return a checkout URL." };
  }
  return { ok: true, url: data.data.authorization_url, providerRef: data.data.reference };
}

/* ----------------------------------------------------------------- PayPal */

const PAYPAL_BASE =
  process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function paypalToken(id: string, secret: string): Promise<string | null> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/**
 * Built, and off until keys exist.
 *
 * PayPal merchant accounts in Ghana and Nigeria frequently cannot RECEIVE
 * payments — only send — so this provider stays hidden from checkout until the
 * account is confirmed able to accept money in the settlement market. The
 * adapter is here so switching it on is a key, not a build.
 *
 * PayPal works in major units with two decimals, unlike Stripe and Paystack.
 */
async function paypalCharge(input: ChargeInput): Promise<ProviderCharge> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) return { ok: false, error: "PayPal is not configured.", unconfigured: true };

  const token = await paypalToken(id, secret);
  if (!token) return { ok: false, error: "Could not authenticate with PayPal." };

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: input.reference,
          description: `Assets & Capital — ${input.plan}`,
          amount: {
            currency_code: input.currency,
            value: (input.amountMinor / 100).toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${input.returnUrl}?ref=${input.reference}&status=success`,
        cancel_url: `${input.returnUrl}?ref=${input.reference}&status=cancelled`,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("paypal order failed", res.status, body);
    return { ok: false, error: "Could not start the PayPal payment." };
  }
  const data = (await res.json()) as { id?: string; links?: { rel: string; href: string }[] };
  const approve = data.links?.find((l) => l.rel === "approve")?.href;
  if (!approve) return { ok: false, error: "PayPal did not return an approval URL." };
  return { ok: true, url: approve, providerRef: data.id };
}

export async function startCharge(provider: string, input: ChargeInput): Promise<ProviderCharge> {
  switch (resolve(provider)) {
    case "stripe":
      return stripeCharge(input);
    case "paystack":
      return paystackCharge(input);
    case "paypal":
      return paypalCharge(input);
    default:
      return { ok: false, error: "Unknown payment provider." };
  }
}
