"use client";

import { useState } from "react";
import { Download, ShieldAlert, Trash2 } from "lucide-react";
import { OPEN_CONSENT_EVENT } from "@/components/layout/cookie-consent";

/**
 * Self-service privacy controls: export (Art. 15/20), cookie choices (Art. 7(3)
 * withdrawal), and account closure (Art. 17).
 *
 * Deletion uses a two-step confirm plus password rather than a browser
 * confirm() — an irreversible action deserves a deliberate pause, and the
 * password is what actually stops a hijacked session from using it.
 */
export function PrivacyControls() {
  const [arming, setArming] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function erase() {
    if (!password) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Could not close the account.");
        setBusy(false);
        return;
      }
      setDone(body.message ?? "Account closed.");
      // Session is destroyed server-side; land somewhere public.
      setTimeout(() => (window.location.href = "/"), 2500);
    } catch {
      setError("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white p-6">
        <h2 className="text-base font-semibold text-ink">Account closed</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{done}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6">
      <h2 className="text-base font-semibold text-ink">Your data and privacy</h2>
      <p className="mt-1 text-sm text-ink/60">
        Rights you can exercise yourself, without contacting us.
      </p>

      <div className="mt-5 space-y-4">
        <Item
          icon={<Download className="h-4 w-4" />}
          title="Download your data"
          description="Everything we hold about your account, as a JSON file."
        >
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
              /api/account/export is a route handler that streams a file, not a
              page. The rule only flags it because app/[locale] made a dynamic
              segment match "api". <Link> would client-side navigate and never
              start the download. */}
          <a
            href="/api/account/export"
            className="rounded-[var(--radius-button)] border border-ink/15 px-4 py-2 text-sm font-medium text-ink/80 transition-colors hover:border-ink/30"
          >
            Download
          </a>
        </Item>

        <Item
          icon={<ShieldAlert className="h-4 w-4" />}
          title="Cookie choices"
          description="Change or withdraw your consent at any time."
        >
          <button
            onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
            className="rounded-[var(--radius-button)] border border-ink/15 px-4 py-2 text-sm font-medium text-ink/80 transition-colors hover:border-ink/30"
          >
            Manage
          </button>
        </Item>

        <Item
          icon={<Trash2 className="h-4 w-4" />}
          title="Close your account"
          description="Removes your personal details. Records we must keep by law are retained in anonymised form."
        >
          {!arming ? (
            <button
              onClick={() => setArming(true)}
              className="rounded-[var(--radius-button)] border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:border-brand-400"
            >
              Close account
            </button>
          ) : (
            <button
              onClick={() => {
                setArming(false);
                setPassword("");
                setError("");
              }}
              className="rounded-[var(--radius-button)] px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink"
            >
              Cancel
            </button>
          )}
        </Item>

        {arming && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
            <p className="text-sm font-medium text-ink">
              This cannot be undone. Enter your password to confirm.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Your password"
                aria-label="Confirm your password"
                className="min-w-0 flex-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <button
                onClick={erase}
                disabled={busy || !password}
                className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Closing…" : "Permanently close"}
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-sm text-brand-700">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Item({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-ink/8 pt-4 first:border-0 first:pt-0 sm:flex-row sm:items-center">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-ink/5 text-ink/70">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{description}</p>
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}
