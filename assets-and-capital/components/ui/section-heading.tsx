import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Pill label with an asterisk glyph, per the reference layouts. */
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
      <span className="text-[0.85em] leading-none text-brand-600" aria-hidden>
        &#10033;
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

/**
 * Section header with the heading on the left and the supporting copy set to
 * the right, as in the "Designed to Work at Scale" reference.
 */
export function SplitHeading({
  eyebrow,
  title,
  description,
  className,
  invert = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  invert?: boolean;
}) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-16", className)}>
      <div>
        {eyebrow && <Eyebrow invert={invert}>{eyebrow}</Eyebrow>}
        <h2
          className={cn(
            "mt-5 text-balance text-[2rem] leading-[1.08] sm:text-4xl md:text-[2.85rem]",
            invert ? "text-white" : "text-navy-700"
          )}
        >
          {title}
        </h2>
      </div>
      {description && (
        <p className={cn("max-w-md text-[0.95rem] leading-relaxed lg:pb-2", invert ? "text-white/65" : "text-ink/65")}>
          {description}
        </p>
      )}
    </div>
  );
}
