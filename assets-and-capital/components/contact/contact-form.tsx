"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    // Integration seam: POST /api/contact (Resend email). Simulated here.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("done");
  }

  const input =
    "w-full rounded-xl border border-ink/10 bg-paper-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-600/30";

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-navy-700">Message sent</h3>
        <p className="mt-2 text-sm text-ink/60">Thank you — our team will be in touch within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Full name</label>
        <input required className={input} placeholder="Jane Doe" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Email</label>
        <input type="email" required className={input} placeholder="you@company.com" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Company</label>
        <input className={input} placeholder="Company name" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">I am a(n)</label>
        <select className={input} defaultValue="">
          <option value="" disabled>Select…</option>
          <option>Investor</option>
          <option>Business seeking capital</option>
          <option>Partner / advisor</option>
          <option>Other</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-ink/80">How can we help?</label>
        <textarea required rows={4} className={`${input} resize-y`} placeholder="Tell us a little about what you're looking for…" />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              Send message <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
