import { Eyebrow } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-ink/[0.06] pt-32 pb-14 md:pt-40 md:pb-20", className)}>
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute -top-32 right-[-8%] h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(185,28,28,0.16), transparent 65%)" }}
        aria-hidden
      />
      <div className="container-x relative">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-5xl md:text-[3.4rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/60">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
