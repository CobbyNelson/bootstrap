"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Sparkles, Check, ArrowRight, Loader2 } from "lucide-react";
import { expressInterest } from "@/lib/actions/entitlements";
import { cn } from "@/lib/utils";
import { useTl } from "@/components/i18n/locale-provider";

/**
 * Locked placeholder rendered IN PLACE OF gated content. The gated data never
 * reaches the client — the server omits it entirely (see entitlements-server).
 */
export function LockPanel({
  variant,
  title,
  desc,
  cta,
  href,
  action,
  className,
}: {
  variant: "subscribe" | "interest";
  title: string;
  desc: string;
  cta?: string;
  href?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const Icon = variant === "subscribe" ? Sparkles : Lock;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-dashed border-ink/15 bg-paper-2/40 p-8 text-center",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(223,45,37,0.06), transparent 60%)" }}
        aria-hidden
      />
      <div className="relative">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-ink/[0.06]">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-navy-700">{title}</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink/65">{desc}</p>
        <div className="mt-5 flex justify-center">
          {action ?? (
            href && (
              <Link
                href={href}
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                {cta} <ArrowRight className="h-4 w-4" />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Express-interest control. Requires an active subscription (enforced again in
 * the server action); without one it routes to plans or sign-in.
 */
export function ExpressInterestButton({
  slug,
  subscribed,
  interested,
  signedIn = true,
  className,
}: {
  slug: string;
  subscribed: boolean;
  interested: boolean;
  signedIn?: boolean;
  className?: string;
}) {
  const tl = useTl();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!subscribed) {
    const href = signedIn ? "/pricing#investor" : `/login?next=/marketplace/${slug}`;
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700",
          className
        )}
      >
        {signedIn ? tl("Subscribe to express interest") : tl("Sign in to express interest")} <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  function onClick() {
    setError("");
    startTransition(async () => {
      const res = await expressInterest(slug);
      if (!res.ok) setError(res.error || "Something went wrong.");
      else router.refresh();
    });
  }

  return (
    <div className={cn("w-full", className)}>
      <button
        onClick={onClick}
        disabled={pending}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] py-3 text-sm font-semibold transition-colors disabled:opacity-60",
          interested
            ? "border border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-brand-600 text-white hover:bg-brand-700"
        )}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {tl("Saving…")}
          </>
        ) : interested ? (
          <>
            <Check className="h-4 w-4" /> {tl("Interest expressed")}
          </>
        ) : (
          <>
            {tl("Express interest")} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {error && <p className="mt-2 text-center text-xs font-medium text-brand-700">{error}</p>}
    </div>
  );
}
