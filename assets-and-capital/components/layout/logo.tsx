import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ invert = false, className }: { invert?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Assets & Capital — home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] bg-brand-600 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
        <span className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-800" aria-hidden />
        <span className="relative font-display text-[15px] font-bold leading-none text-white">A</span>
        <span className="absolute bottom-1 right-1.5 h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn("font-display text-[17px] font-semibold tracking-tight", invert ? "text-white" : "text-ink")}>
          Assets <span className="text-gold-500">&amp;</span> Capital
        </span>
        <span className={cn("mt-0.5 text-[9.5px] font-medium uppercase tracking-[0.22em]", invert ? "text-white/50" : "text-ink/45")}>
          Capital · Assets · Deals
        </span>
      </span>
    </Link>
  );
}
