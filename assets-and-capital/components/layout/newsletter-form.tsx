"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    // Integration seam: POST /api/newsletter (Resend). Simulated here.
    await new Promise((r) => setTimeout(r, 700));
    setStatus("done");
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      {status === "done" ? (
        <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2.5 text-sm font-medium text-emerald-300">
          <Check className="h-4 w-4" /> You&apos;re on the list.
        </p>
      ) : (
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] p-1.5 focus-within:border-white/30">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Work email"
            className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/40 focus:outline-none"
            aria-label="Email address"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gold-500 px-4 text-sm font-medium text-ink transition-colors hover:bg-gold-400 disabled:opacity-60"
          >
            {status === "loading" ? "Joining…" : "Subscribe"}
            {status !== "loading" && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
      <p className="mt-2.5 text-xs text-white/40">Market intelligence and curated opportunities. No spam.</p>
    </form>
  );
}
