import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Pill kicker with a two-dot glyph — the badge style from the agency reference. */
export function Eyebrow({
  children,
  className,
  invert = false,
}: {
  children: React.ReactNode;
  className?: string;
  invert?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] kicker",
        invert ? "border-white/15 bg-white/5 text-navy-300" : "border-ink/10 bg-white/70 text-brand-700",
        className
      )}
    >
      <span className="flex items-center gap-0.5" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-navy-500" />
        <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
      </span>
      {children}
    </span>
  );
}

/** Filled circular ↗ button used on cards (agency reference). */
export function CircleArrow({
  className,
  tone = "brand",
  size = "md",
}: {
  className?: string;
  tone?: "brand" | "gold" | "ink" | "white";
  size?: "sm" | "md";
}) {
  const tones = {
    brand: "bg-brand-600 text-white",
    gold: "bg-navy-600 text-white",
    ink: "bg-ink text-white",
    white: "bg-white text-ink",
  } as const;
  const sizes = { sm: "h-9 w-9", md: "h-11 w-11" } as const;
  return (
    <span
      className={cn(
        "grid flex-none place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-45",
        tones[tone],
        sizes[size],
        className
      )}
      aria-hidden
    >
      <ArrowUpRight className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  invert = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  invert?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <Reveal>
        {eyebrow && (
          <div className={cn(align === "center" && "flex justify-center")}>
            <Eyebrow invert={invert}>{eyebrow}</Eyebrow>
          </div>
        )}
        <h2
          className={cn(
            "mt-4 text-balance text-[2rem] font-medium leading-[1.08] sm:text-4xl md:text-[2.85rem]",
            invert ? "text-white" : "text-navy-700"
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p className={cn("mt-4 text-lg leading-relaxed", invert ? "text-white/70" : "text-ink/60")}>
            {subtitle}
          </p>
        )}
      </Reveal>
    </div>
  );
}
