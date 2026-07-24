import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600",
        className
      )}
    >
      <span className="h-px w-6 bg-brand-600/50" aria-hidden />
      {children}
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
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <Reveal>
        {eyebrow && <Eyebrow className={cn(align === "center" && "justify-center")}>{eyebrow}</Eyebrow>}
        <h2
          className={cn(
            "mt-4 text-balance text-3xl font-semibold leading-[1.1] sm:text-4xl md:text-[2.75rem]",
            invert ? "text-white" : "text-ink"
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
