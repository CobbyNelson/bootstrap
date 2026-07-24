"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { isEmail, minLen } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  function validate() {
    const e: { email?: string; password?: string } = {};
    if (!isEmail(email)) e.email = "Enter a valid email address.";
    if (!minLen(password, 8)) e.password = "Password must be at least 8 characters.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setTouched({ email: true, password: true });
    if (Object.keys(e).length) return;
    setStatus("loading");
    // Integration seam: Supabase Auth signInWithPassword. Simulated here.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("error"); // demo: no backend, surface a friendly message
  }

  const input = (bad?: string) =>
    cn(
      "w-full rounded-xl border bg-paper-2/60 py-2.5 pl-11 pr-3.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-600/30",
      bad ? "border-brand-300" : "border-ink/10"
    );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700">
          <AlertCircle className="h-4 w-4" /> We couldn&apos;t sign you in. Check your details and try again.
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => { setTouched((t) => ({ ...t, email: true })); setErrors(validate()); }}
            placeholder="you@company.com"
            className={input(touched.email ? errors.email : undefined)}
          />
        </div>
        {touched.email && errors.email && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-brand-600"><AlertCircle className="h-3.5 w-3.5" /> {errors.email}</p>
        )}
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-ink/80">Password</label>
          <Link href="#" className="text-xs font-medium text-brand-600 hover:text-brand-700">Forgot?</Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => { setTouched((t) => ({ ...t, password: true })); setErrors(validate()); }}
            placeholder="••••••••"
            className={input(touched.password ? errors.password : undefined)}
          />
        </div>
        {touched.password && errors.password && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-brand-600"><AlertCircle className="h-3.5 w-3.5" /> {errors.password}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {status === "loading" ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
        ) : (
          <>Sign in <ArrowRight className="h-4 w-4" /></>
        )}
      </button>
      <p className="text-center text-sm text-ink/55">
        New here?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">Create an account</Link>
      </p>
    </form>
  );
}
