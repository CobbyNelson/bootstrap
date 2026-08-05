"use client";

import { useState } from "react";

/**
 * Bypass-code entry for the pre-launch gate.
 *
 * Deliberately plain: one field, one button, one error line. The failure text
 * is identical for a wrong code and a rate-limited attempt so the form cannot
 * be used to probe whether a given code was "close".
 */
export function UnlockForm() {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || state === "checking") return;
    setState("checking");
    setMessage("");

    try {
      const res = await fetch("/api/site-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        // Full reload rather than router.push: the cookie has just been set and
        // middleware must re-evaluate the request from scratch. A client-side
        // navigation can be served from the router cache and bounce straight
        // back to the gate.
        window.location.href = "/";
        return;
      }

      const body = await res.json().catch(() => ({}));
      setMessage(body.error ?? "That code was not recognised.");
      setState("error");
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-10 max-w-sm">
      <label htmlFor="unlock-code" className="sr-only">
        Preview access code
      </label>
      <div className="flex gap-2">
        <input
          id="unlock-code"
          name="code"
          type="password"
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="Preview access code"
          aria-invalid={state === "error"}
          aria-describedby={state === "error" ? "unlock-error" : undefined}
          className="min-w-0 flex-1 rounded-lg border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/55 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        />
        <button
          type="submit"
          disabled={state === "checking" || !code.trim()}
          className="shrink-0 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "checking" ? "Checking…" : "Enter"}
        </button>
      </div>

      {/* role="alert" so a screen reader announces the failure without the user
          having to hunt for what changed. */}
      {state === "error" && (
        <p id="unlock-error" role="alert" className="mt-3 text-sm text-brand-300">
          {message}
        </p>
      )}
    </form>
  );
}
