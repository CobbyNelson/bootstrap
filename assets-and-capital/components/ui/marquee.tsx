import { Asterisk } from "lucide-react";
import { cn } from "@/lib/utils";

const TONE = {
  ink: "bg-ink text-white",
  brand: "bg-brand-700 text-white",
  cream: "bg-paper-2 text-ink",
  gold: "bg-gold-500 text-ink",
} as const;

/**
 * Full-bleed scrolling ticker with sparkle separators — the signature
 * agency element from the reference set. Pure CSS animation (pauses on hover,
 * respects reduced-motion). Decorative, so aria-hidden.
 */
export function Marquee({
  items,
  tone = "ink",
  speed = "normal",
  className,
}: {
  items: string[];
  tone?: keyof typeof TONE;
  speed?: "normal" | "slow";
  className?: string;
}) {
  const sepColor = tone === "gold" || tone === "cream" ? "text-brand-600" : "text-gold-400";
  const anim = speed === "slow" ? "var(--animate-marquee-slow)" : "var(--animate-marquee)";
  const set = items.map((it, i) => (
    <span key={i} className="flex items-center gap-5 pr-5">
      <span className="kicker text-[0.8rem]">{it}</span>
      <Asterisk className={cn("h-4 w-4 shrink-0", sepColor)} strokeWidth={2.5} />
    </span>
  ));
  return (
    <div className={cn("pause-hover marquee-mask relative flex overflow-hidden py-3.5", TONE[tone], className)} aria-hidden>
      <div className="marquee-track flex w-max shrink-0 items-center" style={{ animation: anim }}>
        {set}
        {set}
      </div>
    </div>
  );
}
