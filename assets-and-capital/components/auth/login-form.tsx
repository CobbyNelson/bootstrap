"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { isEmail, minLen } from "@/lib/validation";
import { loginUser, registerUser } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";
type Role = "INVESTOR" | "BUSINESS";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("INVESTOR");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [formError, setFormError] = useState("");

  function validate() {
    const e: { name?: string; email?: string; password?: string } = {};
    if (mode === "signup" && !minLen(name, 2)) e.name = "Enter your name.";
    if (!isEmail(email)) e.email = "Enter a valid email address.";
    if (!minLen(password, 8)) e.password = "Password must be at least 8 characters.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setTouched({ name: true, email: true, password: true });
    if (Object.keys(e).length) return;

    setStatus("loading");
    setFormError("");
    const result =
      mode === "signin"
        ? await loginUser({ email, password })
        : await registerUser({ name, email, password, role });

    if (!result.ok) {
      setStatus("idle");
      setFormError(result.error || "Something went wrong. Please try again.");
      return;
    }
    // Only honor an internal (relative, single-slash) next target — avoids open redirects.
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    const dest = safeNext || (result.role === "BUSINESS" ? "/dashboard/business" : "/dashboard");
    router.push(dest);
    router.refresh();
  }

  const input = (bad?: string) =>
    cn(
      "w-full rounded-xl border bg-paper-2/60 py-2.5 pl-11 pr-3.5 text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-brand-600/30",
      bad ? "border-brand-300" : "border-ink/10"
    );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700">
          <AlertCircle className="h-4 w-4 flex-none" /> {formError}
        </div>
      )}

      {mode === "signup" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {(["INVESTOR", "BUSINESS"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-medium transition-colors",
                  role === r ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/10 text-ink/70 hover:border-ink/25"
                )}
              >
                {r === "INVESTOR" ? "I'm an investor" : "I'm raising capital"}
              </button>
            ))}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => { setTouched((t) => ({ ...t, name: true })); setErrors(validate()); }}
                placeholder="Your full name"
                className={input(touched.name ? errors.name : undefined)}
              />
            </div>
            {touched.name && errors.name && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-brand-600"><AlertCircle className="h-3.5 w-3.5" /> {errors.name}</p>
            )}
          </div>
        </>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
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
          {mode === "signin" && <span className="text-xs font-medium text-ink/45">8+ characters</span>}
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60" />
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand-600 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {status === "loading" ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> {mode === "signin" ? "Signing in…" : "Creating account…"}</>
        ) : (
          <>{mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" /></>
        )}
      </button>

      <p className="text-center text-sm text-ink/65">
        {mode === "signin" ? "New to Assets & Capital? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setFormError(""); setErrors({}); setTouched({}); }}
          className="font-medium text-brand-700 hover:text-brand-800"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
