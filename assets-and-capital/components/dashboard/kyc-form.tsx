"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { submitKyc } from "@/lib/actions/kyc";

/**
 * Actually starting verification.
 *
 * `submitKyc` has existed in lib/actions/kyc.ts since the compliance work went
 * in, with nothing in the interface calling it — so the only route to a KYC
 * record was an admin creating one by hand, while the page told the investor
 * their checks were already 72% done.
 *
 * The accreditation claim is collected but explicitly not trusted; the action
 * stores `accredited: false` regardless and a reviewer confirms it. Saying that
 * on the form is the difference between a claim and a grant.
 */
export function KycForm({
  isBusiness,
  defaultName,
  defaultCountry,
}: {
  isBusiness: boolean;
  defaultName: string | null;
  defaultCountry: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError(null);

    const res = await submitKyc({
      legalName: String(data.get("legalName") ?? ""),
      country: String(data.get("country") ?? ""),
      accreditedClaim: data.get("accredited") === "on",
    });

    setPending(false);
    if (!res.ok) {
      setError(res.error ?? "We couldn't submit your verification.");
      return;
    }
    // The server action revalidates; refresh so the steps above re-render
    // against the record that now exists.
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-ink/[0.07] bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy-700">Start verification</h2>
      <p className="mt-1 text-sm text-ink/65">
        {isBusiness
          ? "Your registered company name and country, exactly as they appear on the certificate of incorporation."
          : "Your full legal name and country of residence, exactly as they appear on your ID."}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {isBusiness ? "Registered company name" : "Full legal name"}
          </span>
          <input
            name="legalName"
            required
            defaultValue={defaultName ?? ""}
            autoComplete={isBusiness ? "organization" : "name"}
            className="w-full rounded-[var(--radius-button)] border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand-600"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Country</span>
          <input
            name="country"
            required
            defaultValue={defaultCountry ?? ""}
            autoComplete="country-name"
            className="w-full rounded-[var(--radius-button)] border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand-600"
          />
        </label>
      </div>

      {!isBusiness && (
        <label className="mt-4 flex items-start gap-3">
          <input type="checkbox" name="accredited" className="mt-1 h-4 w-4 accent-[var(--color-brand-600)]" />
          <span className="text-sm text-ink/70">
            I believe I qualify as an accredited or professional investor.
            <span className="block text-xs text-ink/60">
              A claim, not a grant — a compliance officer confirms this before it unlocks anything.
            </span>
          </span>
        </label>
      )}

      {error && <p className="mt-4 text-sm font-medium text-brand-700">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {pending ? "Submitting…" : "Submit for review"}
        </button>
        <p className="text-xs text-ink/60">Usually reviewed within two business days.</p>
      </div>
    </form>
  );
}
