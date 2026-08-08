"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { ShieldPlus, Copy, Check, AlertTriangle } from "lucide-react";
import { finishEnrolment } from "@/lib/actions/two-factor";

/**
 * Pairing an authenticator app.
 *
 * Three states, in order: scan, prove, save the recovery codes. The last is not
 * skippable-by-accident — the codes exist only in this response, because what
 * is stored is their bcrypt hash.
 */
export function EnrolPanel({
  dest,
  qr,
  secret,
  exempt,
  adminEnforced,
}: {
  dest: string;
  qr: string;
  secret: string;
  exempt: boolean;
  adminEnforced: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await finishEnrolment(code);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "That didn't work.");
      setCode("");
      return;
    }
    setRecovery(res.recoveryCodes ?? []);
  }

  /* ---- the codes, shown exactly once ---- */
  if (recovery) {
    return (
      <div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Check className="h-5 w-5" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold text-navy-700">Save your recovery codes</h1>
        <p className="mt-2 text-sm text-ink/65">
          Each code signs you in once if you lose your phone. We store only a hash of them, so this is the
          only time they can be shown.
        </p>

        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border border-ink/[0.09] bg-paper-2/50 p-5 font-mono text-sm text-ink/80">
          {recovery.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(recovery.join("\n"));
              setCopied(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-ink/12 px-4 py-2 text-sm text-ink/75 hover:border-ink/25"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy all"}
          </button>
        </div>

        <label className="mt-6 flex items-start gap-2.5 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={saved}
            onChange={(e) => setSaved(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink/25 text-brand-600 focus:ring-brand-500"
          />
          I have saved these somewhere I can reach without my phone.
        </label>

        <button
          type="button"
          disabled={!saved}
          onClick={() => {
            router.refresh();
            router.push(dest);
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    );
  }

  /* ---- scan and prove ---- */
  return (
    <div>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <ShieldPlus className="h-5 w-5" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold text-navy-700">Set up two-factor authentication</h1>
      <p className="mt-2 text-sm text-ink/65">
        Your account holds financial information, so it takes a second step to sign in. Scan this with any
        authenticator app — Google Authenticator, 1Password, Authy.
      </p>

      {exempt && !adminEnforced ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-gold-200 bg-gold-50/60 p-3 text-sm text-ink/75">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
          Staff accounts are not yet required to do this while the platform is in development. Setting it up
          now is still a good idea, and it will be required before launch.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <Image
          src={qr}
          alt="QR code for pairing your authenticator app"
          width={180}
          height={180}
          unoptimized
          className="rounded-xl border border-ink/[0.09] bg-white p-2"
        />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink/45">Or enter this key</p>
          <p className="mt-2 break-all font-mono text-sm text-ink/80">{secret}</p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(secret);
              setCopied(true);
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink/60 underline decoration-ink/20 underline-offset-4 hover:text-ink/85"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy key"}
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="mt-8 border-t border-ink/[0.07] pt-6">
        <label htmlFor="code" className="text-sm text-ink/70">
          Enter the six-digit code your app is showing
        </label>
        <input
          id="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className="mt-3 w-full border-0 border-b border-ink/20 bg-transparent pb-3 font-display text-3xl tracking-[0.2em] text-brand-700 placeholder:text-ink/25 focus:border-brand-500 focus:outline-none focus:ring-0"
        />
        {error ? (
          <p role="alert" className="mt-3 text-sm text-brand-600">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy || code.length < 6}
          className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {busy ? "Checking…" : "Turn on two-factor"}
        </button>
      </form>
    </div>
  );
}
