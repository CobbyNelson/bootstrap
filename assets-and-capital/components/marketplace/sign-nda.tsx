"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, FileSignature, Check, ShieldCheck, Loader2 } from "lucide-react";
import { signNda } from "@/lib/actions/entitlements";
import { cn } from "@/lib/utils";
import { useTl } from "@/components/i18n/locale-provider";

/**
 * Sign-NDA control + agreement dialog. Signing records the signature for this
 * business (localStorage) which unlocks its data room. Real e-signature will
 * replace the simulated signing once the backend is wired.
 */
export function SignNdaButton({
  slug,
  businessName,
  signed,
  primary = false,
  className,
}: {
  slug: string;
  businessName: string;
  signed: boolean;
  primary?: boolean;
  className?: string;
}) {
  const tl = useTl();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function sign() {
    setError("");
    startTransition(async () => {
      const res = await signNda(slug);
      if (!res.ok) {
        setError(res.error || "We couldn't record your signature.");
        return;
      }
      setOpen(false);
      setAgreed(false);
      router.refresh();
    });
  }

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-button)] py-2.5 text-sm font-medium transition-colors";
  const btnClass = signed
    ? cn(base, "border border-emerald-600/30 bg-emerald-50 px-4 text-emerald-700", className)
    : primary
    ? cn(base, "bg-brand-600 px-5 font-semibold text-white hover:bg-brand-700", className)
    : cn(base, "border border-ink/12 px-4 text-ink/70 hover:border-ink/25", className);

  return (
    <>
      <button type="button" onClick={() => !signed && setOpen(true)} className={btnClass}>
        {signed ? (
          <>
            <Check className="h-4 w-4" /> {tl("NDA signed")}
          </>
        ) : (
          <>
            <FileSignature className="h-4 w-4" /> {tl("Sign NDA")}
          </>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] grid place-items-center p-4" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            aria-label={tl("Close")}
            onClick={() => setOpen(false)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between border-b border-ink/[0.07] px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <h3 className="font-display text-lg font-semibold text-navy-700">{tl("Mutual Non-Disclosure Agreement")}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-[var(--radius-button)] text-ink/50 hover:bg-paper-2"
                aria-label={tl("Close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 text-sm leading-relaxed text-ink/70">
              <p className="text-ink/60">
                {tl("Between")} <strong className="text-ink">{tl("Assets & Capital Ltd")}</strong>{" "}
                {tl("(on behalf of {business}) and you, the receiving investor.").replace("{business}", businessName)}
              </p>
              <ol className="mt-4 list-decimal space-y-3 pl-5">
                <li>
                  <strong className="text-ink/80">{tl("Confidential information.")}</strong> {tl("All financials, documents, projections and materials in the data room are confidential and provided solely to evaluate a potential investment.")}
                </li>
                <li>
                  <strong className="text-ink/80">{tl("Non-disclosure.")}</strong> {tl("You will not share, copy or distribute the materials to any third party without prior written consent.")}
                </li>
                <li>
                  <strong className="text-ink/80">{tl("No circumvention.")}</strong> {tl("You will not use the information to bypass Assets & Capital or approach the business outside the platform.")}
                </li>
                <li>
                  <strong className="text-ink/80">{tl("Term.")}</strong> {tl("These obligations remain in force for 24 months from the date of signature.")}
                </li>
                <li>
                  <strong className="text-ink/80">{tl("No offer.")}</strong> {tl("The materials do not constitute investment advice or an offer of securities.")}
                </li>
              </ol>
              <p className="mt-4 text-xs text-ink/50">
                {tl("Demonstration NDA for the platform prototype — not a substitute for legal advice.")}
              </p>
            </div>

            <div className="border-t border-ink/[0.07] px-6 py-4">
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/70">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                {tl("I have read and agree to the terms of this NDA for {business}.").replace("{business}", businessName)}
              </label>
              {error && <p className="mt-3 text-sm font-medium text-brand-700">{error}</p>}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-[var(--radius-button)] border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/25"
                >
                  {tl("Cancel")}
                </button>
                <button
                  onClick={sign}
                  disabled={!agreed || pending}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {pending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {tl("Signing…")}</>
                  ) : (
                    <><FileSignature className="h-4 w-4" /> {tl("Agree & sign")}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
