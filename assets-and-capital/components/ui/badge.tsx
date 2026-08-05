import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide",
  {
    variants: {
      variant: {
        brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
        gold: "bg-navy-100 text-navy-700 ring-1 ring-navy-200",
        neutral: "bg-ink/[0.05] text-ink/70 ring-1 ring-ink/10",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
        outline: "text-ink/70 ring-1 ring-ink/15",
        dark: "bg-white/10 text-white ring-1 ring-white/15",
      },
      size: {
        sm: "px-2.5 py-0.5 text-[0.7rem]",
        md: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  }
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
