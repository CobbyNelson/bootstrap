import { Asterisk } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE = {
  navy: { bg: "bg-navy-800 text-white", sep: "text-brand-400" },
  brand: { bg: "bg-brand-600 text-white", sep: "text-white" },
  ink: { bg: "bg-ink text-white", sep: "text-brand-400" },
  cream: { bg: "bg-paper-2 text-ink", sep: "text-brand-600" },
} as const;

/**
 * Full-bleed scrolling ticker with sparkle separators. Pure CSS animation
 * (pauses on hover, respects reduced-motion). Decorative → aria-hidden.
 */
export function Marquee({
  items,
  tone = "navy",
  speed = "normal",
  className,
}: {
  items: string[];
  tone?: keyof typeof TONE;
  speed?: "normal" | "slow";
  className?: string;
}) {
  const t = TONE[tone];
  const anim = speed === "slow" ? "var(--animate-marquee-slow)" : "var(--animate-marquee)";
  const set = items.map((it, i) => (
    <span key={i} className="flex items-center gap-5 pr-5">
      <span className="kicker text-[0.8rem]">{it}</span>
      <Asterisk className={cn("h-4 w-4 shrink-0", t.sep)} strokeWidth={2.5} />
    </span>
  ));
  return (
    <div className={cn("pause-hover marquee-mask relative flex overflow-hidden py-3.5", t.bg, className)} aria-hidden>
      <div className="marquee-track flex w-max shrink-0 items-center" style={{ animation: anim }}>
        {set}
        {set}
      </div>
    </div>
  );
}
