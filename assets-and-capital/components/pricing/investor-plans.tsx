"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { activateSubscription, cancelSubscription } from "@/lib/actions/entitlements";
import { CheckoutDialog } from "@/components/payments/checkout-dialog";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  featured?: boolean;
  /** null = the free tier (cancels any subscription) */
  activates: string | null;
};

const PLANS: Plan[] = [
  {
    name: "Investor Free",
    price: "$0",
    cadence: "forever",
    tagline: "Browse and build your shortlist.",
    activates: null,
    features: [
      "Core details on every listing",
      "Set your investment mandate",
      "Save & shortlist opportunities",
      "Newsletter & market insights",
    ],
  },
  {
    name: "Investor Pro",
    price: "$149",
    cadence: "month",
    tagline: "Full visibility across the marketplace.",
    activates: "Investor Pro",
    featured: true,
    features: [
      "Everything in Free",
      "Full financials & metrics on every business",
      "Express interest to unlock data rooms",
      "AI profiles & your personalised match rate",
      "Unlimited side-by-side compare",
    ],
  },
  {
    name: "Investor Elite",
    price: "$399",
    cadence: "month",
    tagline: "Concierge access to the whole pipeline.",
    activates: "Investor Elite",
    features: [
      "Everything in Pro",
      "Priority roadshow access",
      "Concierge deal support",
      "Quarterly portfolio review",
    ],
  },
];

export function InvestorPlans({
  signedIn = false,
  active = false,
  plan = null,
}: {
  signedIn?: boolean;
  active?: boolean;
  plan?: string | null;
}) {
  const router = useRouter();
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  function isCurrent(p: Plan) {
    if (p.activates === null) return !active;
    return active && plan === p.activates;
  }

  function choose(p: Plan) {
    setError("");
    if (!signedIn) {
      router.push("/login?next=/pricing");
      return;
    }
    if (p.activates === null) {
      startTransition(async () => {
        const res = await cancelSubscription();
        if (!res.ok) setError(res.error || "Something went wrong.");
        else router.refresh();
      });
    } else {
      setCheckout(p);
    }
  }

  function onPaid() {
    if (!checkout?.activates) return;
    startTransition(async () => {
      const res = await activateSubscription(checkout.activates!);
      if (!res.ok) setError(res.error || "We couldn't activate your subscription.");
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((p) => {
        const current = isCurrent(p);
        return (
          <div
            key={p.name}
            className={cn(
              "relative flex h-full flex-col rounded-3xl border p-7 transition-all hover:-translate-y-1",
              p.featured
                ? "border-brand-600/30 bg-white shadow-[var(--shadow-lift)] ring-1 ring-brand-600/20"
                : "border-ink/[0.07] bg-white hover:shadow-[var(--shadow-card)]"
            )}
          >
            {p.featured && (
              <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3 w-3" /> Most popular
              </span>
            )}
            <p className="font-display text-xl font-semibold text-navy-700">{p.name}</p>
            <p className="mt-1 text-sm text-ink/65">{p.tagline}</p>
            <div className="mt-5 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold text-navy-700 tnum">{p.price}</span>
              <span className="text-sm text-ink/65">/ {p.cadence}</span>
            </div>

            <button
              type="button"
              disabled={current}
              onClick={() => choose(p)}
              className={cn(
                "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors",
                current
                  ? "cursor-default border border-ink/12 bg-paper-2 text-ink/60"
                  : p.featured
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "border border-ink/15 bg-white text-ink hover:border-ink/30"
              )}
            >
              {current ? (
                <>
                  <Check className="h-4 w-4" /> Current plan
                </>
              ) : p.activates === null ? (
                "Switch to Free"
              ) : (
                <>
                  Subscribe <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <ul className="mt-7 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink/70">
                  <Check className={cn("mt-0.5 h-4 w-4 flex-none", p.featured ? "text-brand-600" : "text-navy-600")} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {error && <p className="lg:col-span-3 text-center text-sm font-medium text-brand-700">{error}</p>}
      <p className="lg:col-span-3 text-center text-xs text-ink/50">
        Payments run in test mode — checkout is fully simulated (no real charge) and unlocks the complete investor
        experience across the marketplace.
      </p>

      <CheckoutDialog
        open={checkout !== null}
        onClose={() => setCheckout(null)}
        onSuccess={onPaid}
        planName={checkout?.name ?? ""}
        priceLabel={checkout ? `${checkout.price} / ${checkout.cadence}` : ""}
      />
    </div>
  );
}
