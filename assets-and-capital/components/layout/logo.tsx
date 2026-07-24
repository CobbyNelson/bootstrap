import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Assets & Capital brand mark — an angular "A" arrow built from a red
 * up-blade, a black (or light, when inverted) down-blade and a grey accent
 * blade, with a stacked uppercase wordmark.
 */
export function Logo({ invert = false, className }: { invert?: boolean; className?: string }) {
  const text = invert ? "text-white" : "text-ink";
  const black = invert ? "#e7e9ee" : "#12161d";
  const grey = invert ? "#8b95a4" : "#c4cbd4";
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Assets & Capital — home">
      <svg viewBox="0 0 44 44" className="h-9 w-9 flex-none" aria-hidden>
        {/* grey accent blade (lower-left) */}
        <polygon points="1,41 12,41 25,17 14,17" fill={grey} />
        {/* red up-blade */}
        <polygon points="9,41 20,41 35,5 24,5" fill="var(--color-brand-600)" />
        {/* black down-blade */}
        <polygon points="24,5 33,5 43,41 34,41" fill={black} />
      </svg>
      <span className="flex flex-col font-display text-[15px] font-extrabold uppercase leading-[0.9] tracking-tight">
        <span className={text}>Assets <span className="text-brand-600">&amp;</span></span>
        <span className={text}>Capital</span>
      </span>
    </Link>
  );
}
