"use client";

import { useEffect, useState } from "react";
import { X, Lock, Check, Loader2, TriangleAlert, ArrowRight, FlaskConical } from "lucide-react";
import { PAY_PROVIDERS, TEST_CARDS, paymentsTestMode, type ProviderId } from "@/lib/payments";
import { cn } from "@/lib/utils";

type Status = "idle" | "processing" | "success" | "declined";

export function CheckoutDialog({
  open,
  onClose,
  onSuccess,
  planName,
  priceLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planName: string;
  priceLabel: string;
}) {
  const testMode = paymentsTestMode();
  const [providerId, setProviderId] = useState<ProviderId>("stripe");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });

  const provider = PAY_PROVIDERS.find((p) => p.id === providerId)!;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Reset transient state whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) {
      setStatus("idle");
      setError("");
      setCard({ number: "", exp: "", cvc: "", name: "" });
      setProviderId("stripe");
    }
  }, [open]);

  if (!open) return null;

  function fillTestCard() {
    setCard({ number: TEST_CARDS.success, exp: "12 / 34", cvc: "123", name: "Test Investor" });
  }

  function validCard() {
    const digits = card.number.replace(/\D/g, "");
    return digits.length >= 12 && card.exp.trim().length >= 4 && card.cvc.trim().length >= 3;
  }

  async function pay() {
    setError("");
    if (provider.kind === "card" && !validCard()) {
      setError("Enter the card number, expiry and CVC to continue.");
      return;
    }
    setStatus("processing");
    const digits = card.number.replace(/\D/g, "");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, plan: planName, amount: priceLabel }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      // Give the flow a realistic beat.
      await new Promise((r) => setTimeout(r, 1100));

      if (provider.kind === "card" && digits === TEST_CARDS.decline.replace(/\s/g, "")) {
        setStatus("declined");
        setError("Your card was declined. (This is the test decline card.)");
        return;
      }
      if (!data.ok) {
        setStatus("declined");
        setError(data.error || "Payment could not be completed.");
        return;
      }
      setStatus("success");
      onSuccess();
      setTimeout(onClose, 1400);
    } catch {
      setStatus("declined");
      setError("Something went wrong reaching the payment service. Please try again.");
    }
  }

  const processing = status === "processing";

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-ink/50 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[var(--shadow-lift)]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-ink/[0.07] px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-navy-700">Checkout</h3>
            <p className="text-xs text-ink/60">
              {planName} · <span className="font-medium text-ink/80">{priceLabel}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-paper-2"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <Check className="h-8 w-8" />
            </div>
            <p className="mt-4 font-display text-xl font-semibold text-navy-700">Payment successful</p>
            <p className="mt-1 text-sm text-ink/65">
              You&apos;re now on <strong className="text-ink">{planName}</strong>. Full access is unlocked.
            </p>
            {testMode && <p className="mt-2 text-xs text-ink/45">Test mode — no real charge was made.</p>}
          </div>
        ) : (
          <div className="overflow-y-auto px-6 py-5">
            {testMode && (
              <div className="mb-5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                  <FlaskConical className="h-4 w-4" /> Test mode
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800/80">
                  No real charge. Card <strong>{TEST_CARDS.success}</strong> approves; <strong>{TEST_CARDS.decline}</strong>{" "}
                  declines. Any future expiry & CVC.
                </p>
                <button
                  onClick={fillTestCard}
                  className="mt-2 text-xs font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
                >
                  Autofill test card
                </button>
              </div>
            )}

            {/* provider selector */}
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/55">Payment method</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {PAY_PROVIDERS.map((p) => {
                const active = p.id === providerId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProviderId(p.id);
                      setError("");
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-all",
                      active ? "border-brand-600 ring-1 ring-brand-600/25" : "border-ink/10 hover:border-ink/25"
                    )}
                  >
                    <span
                      className="grid h-9 w-9 flex-none place-items-center rounded-xl text-white"
                      style={{ background: p.accent }}
                    >
                      <p.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
                      <span className="block truncate text-[0.68rem] text-ink/55">{p.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* payment body */}
            <div className="mt-5">
              {provider.kind === "card" ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink/70">Card number</label>
                    <input
                      inputMode="numeric"
                      value={card.number}
                      onChange={(e) => setCard((c) => ({ ...c, number: e.target.value }))}
                      placeholder="1234 5678 9012 3456"
                      className="w-full rounded-xl border border-ink/12 bg-paper-2/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/45 focus:border-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink/70">Expiry</label>
                      <input
                        value={card.exp}
                        onChange={(e) => setCard((c) => ({ ...c, exp: e.target.value }))}
                        placeholder="MM / YY"
                        className="w-full rounded-xl border border-ink/12 bg-paper-2/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/45 focus:border-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink/70">CVC</label>
                      <input
                        inputMode="numeric"
                        value={card.cvc}
                        onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value }))}
                        placeholder="123"
                        className="w-full rounded-xl border border-ink/12 bg-paper-2/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/45 focus:border-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink/70">Name on card</label>
                    <input
                      value={card.name}
                      onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                      placeholder="Full name"
                      className="w-full rounded-xl border border-ink/12 bg-paper-2/50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/45 focus:border-brand-600/40 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-ink/10 bg-paper-2/40 px-4 py-5 text-center">
                  <span
                    className="mx-auto grid h-11 w-11 place-items-center rounded-xl text-white"
                    style={{ background: provider.accent }}
                  >
                    <provider.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm text-ink/70">
                    You&apos;ll be redirected to <strong className="text-ink">{provider.via}</strong> to approve this
                    payment securely.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="mt-4 flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
                <TriangleAlert className="h-4 w-4 flex-none" /> {error}
              </p>
            )}

            {/* pay */}
            <button
              onClick={pay}
              disabled={processing}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : provider.kind === "card" ? (
                <>
                  <Lock className="h-4 w-4" /> Pay {priceLabel}
                </>
              ) : (
                <>
                  Continue with {provider.name} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.7rem] text-ink/45">
              <Lock className="h-3 w-3" /> Payments are encrypted. We never store your card details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
