"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { CURRENCIES } from "@/lib/i18n";
import { useCurrency } from "@/components/providers/currency-provider";
import { cn } from "@/lib/utils";

export function CurrencySwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { currency, setCode } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isDark = variant === "dark";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border px-3 text-sm font-medium transition-colors",
          isDark
            ? "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
            : "border-ink/12 text-ink/65 hover:border-ink/25 hover:text-ink"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="tnum">{currency.code}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border bg-white p-1.5 shadow-[var(--shadow-lift)]",
            isDark ? "border-ink/10" : "border-ink/10"
          )}
          role="listbox"
        >
          <p className="px-3 pb-1.5 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink/60">
            Display currency
          </p>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              role="option"
              aria-selected={c.code === currency.code}
              onClick={() => {
                setCode(c.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                c.code === currency.code ? "bg-brand-50 text-brand-700" : "text-ink/70 hover:bg-paper-2"
              )}
            >
              <span className="text-base leading-none">{c.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{c.code} · {c.symbol}</span>
                <span className="block text-xs text-ink/60">{c.label}</span>
              </span>
              {c.code === currency.code && <Check className="h-4 w-4 flex-none text-brand-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
