"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, KeyRound } from "lucide-react";
import { submitCode, abandon } from "@/lib/actions/two-factor";

/** The code prompt at sign-in, for an account that has already paired an app. */
export function VerifyPanel({ dest, recoveryLeft }: { dest: string; recoveryLeft: number }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await submitCode(code);
    if (!res.ok) {
      setError(res.error ?? "That didn't work.");
      setBusy(false);
      setCode("");
      return;
    }
    // refresh() first: the cookie changed, and pushing to a guarded route with
    // a stale router cache bounces straight back here.
    router.refresh();
    router.push(dest);
  }

  return (
    <div>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold text-navy-700">Enter your code</h1>
      <p className="mt-2 text-sm text-ink/65">
        {useRecovery
          ? "Type one of the recovery codes you saved. Each one works once."
          : "Open your authenticator app and enter the six-digit code for Assets & Capital."}
      </p>

      <form onSubmit={submit} className="mt-6">
        <label htmlFor="code" className="sr-only">
          {useRecovery ? "Recovery code" : "Six-digit code"}
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => {
            // Digits and the recovery hyphen only — nothing else belongs here.
            setCode(e.target.value.replace(useRecovery ? /[^0-9-]/g : /\D/g, "").slice(0, useRecovery ? 11 : 6));
            setError("");
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder={useRecovery ? "00000-00000" : "000000"}
          className="w-full border-0 border-b border-ink/20 bg-transparent pb-3 font-display text-3xl tracking-[0.2em] text-brand-700 placeholder:text-ink/25 focus:border-brand-500 focus:outline-none focus:ring-0"
        />
        {error ? (
          <p role="alert" className="mt-3 text-sm text-brand-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || code.length < (useRecovery ? 11 : 6)}
          className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {busy ? "Checking…" : "Continue"}
        </button>
      </form>

      <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/[0.07] pt-5 text-sm">
        <button
          type="button"
          onClick={() => {
            setUseRecovery((v) => !v);
            setCode("");
            setError("");
          }}
          className="inline-flex items-center gap-1.5 text-ink/60 underline decoration-ink/20 underline-offset-4 hover:text-ink/85"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {useRecovery ? "Use my authenticator app" : "Use a recovery code"}
        </button>
        {useRecovery ? <span className="text-ink/45">{recoveryLeft} unused</span> : null}
        <button
          type="button"
          onClick={() => abandon()}
          className="ml-auto text-ink/45 underline decoration-ink/15 underline-offset-4 hover:text-ink/70"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
