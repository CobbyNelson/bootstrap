"use client";

import Link from "next/link";
import { Lock, Sparkles, Check, ArrowRight, Eye, RotateCcw } from "lucide-react";
import { useInterest, useSubscription } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

/**
 * Locked placeholder rendered IN PLACE OF gated content. The real content is not
 * rendered at all while locked (so it isn't just visually hidden).
 */
export function LockPanel({
  variant,
  title,
  desc,
  cta,
  href,
  onCta,
  action,
  className,
}: {
  variant: "subscribe" | "interest";
  title: string;
  desc: string;
  cta?: string;
  href?: string;
  onCta?: () => void;
  action?: React.ReactNode;
  className?: string;
}) {
  const Icon = variant === "subscribe" ? Sparkles : Lock;
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700";
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
          {action
            ? action
            : href
            ? (
              <Link href={href} className={btn}>
                {cta} <ArrowRight className="h-4 w-4" />
              </Link>
            )
            : (
              <button onClick={onCta} className={btn}>
                {cta} <ArrowRight className="h-4 w-4" />
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

/**
 * Express-interest control. Requires an active subscription; without one it
 * routes to the investor plans. With one, it toggles interest for `slug`,
 * unlocking that business's deal layer.
 */
export function ExpressInterestButton({ slug, className }: { slug: string; className?: string }) {
  const { active } = useSubscription();
  const { has, toggle } = useInterest();
  const interested = has(slug);

  if (!active) {
    return (
      <Link
        href="/pricing#investor"
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700",
          className
        )}
      >
        Subscribe to express interest <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      onClick={() => toggle(slug)}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors",
        interested
          ? "border border-emerald-600/30 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "bg-brand-600 text-white hover:bg-brand-700",
        className
      )}
    >
      {interested ? (
        <>
          <Check className="h-4 w-4" /> Interest expressed
        </>
      ) : (
        <>
          Express interest <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

/**
 * Preview-mode switcher. Billing isn't connected yet, so this lets anyone flip
 * between the free and subscribed investor views to see the gating in action.
 */
export function DemoAccessBar({ className }: { className?: string }) {
  const { active, plan, subscribe, cancel } = useSubscription();
  const { count, clear } = useInterest();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-ink/10 bg-white px-4 py-3",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-wide text-navy-700">
        <Eye className="h-3.5 w-3.5" /> Preview mode
      </span>
      <span className="text-sm text-ink/70">
        Browsing as{" "}
        <strong className="font-semibold text-ink">{active ? plan ?? "Investor Pro" : "a free investor"}</strong>
        {active && count > 0 && <span className="text-ink/50"> · interest in {count}</span>}
      </span>
      <span className="ml-auto flex items-center gap-2">
        {active ? (
          <button
            onClick={() => {
              cancel();
              clear();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-ink/12 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-ink/25 hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to free
          </button>
        ) : (
          <button
            onClick={() => subscribe("Investor Pro")}
            className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Sparkles className="h-3.5 w-3.5" /> Simulate subscription
          </button>
        )}
      </span>
      <p className="w-full text-[0.7rem] text-ink/50">
        Billing isn&apos;t connected yet — this switch previews what each investor tier sees.
      </p>
    </div>
  );
}
