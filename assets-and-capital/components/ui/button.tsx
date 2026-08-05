import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // `slant` is the shared brand geometry (see globals.css): a rounded
  // parallelogram matching the logo mark, replacing the generic pill. The label
  // is counter-skewed inside so only the box leans.
  "slant inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-600 text-white shadow-[0_6px_20px_-8px_rgba(229,50,43,0.6)] hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0",
        gold:
          "bg-navy-700 text-white shadow-[0_6px_20px_-8px_rgba(19,47,82,0.6)] hover:bg-navy-800 hover:-translate-y-0.5",
        dark: "bg-ink text-white hover:bg-ink-2 hover:-translate-y-0.5",
        outline:
          "border border-ink/15 bg-white/60 text-ink hover:border-ink/30 hover:bg-white",
        ghost: "text-ink/80 hover:bg-ink/[0.05] hover:text-ink",
        link: "slant-none text-brand-600 underline-offset-4 hover:underline px-0",
      },
      size: {
        // --slant-bleed = (height · tan 24.5°) / 2, so the reserved margin
        // matches the shape's real overhang at each size.
        sm: "h-9 px-4 text-sm [--slant-bleed:0.5rem]",
        md: "h-11 px-6 text-[0.95rem] [--slant-bleed:0.625rem]",
        lg: "h-13 px-8 text-base [--slant-bleed:0.75rem]",
        icon: "h-11 w-11 slant-none",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type StyleProps = VariantProps<typeof buttonVariants> & { className?: string };

type AnchorButtonProps = StyleProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "color"> &
  Pick<LinkProps, "href"> & { href: string };

type NativeButtonProps = StyleProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> & { href?: undefined };

export type ButtonProps = AnchorButtonProps | NativeButtonProps;

export function Button({ className, variant, size, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  // The counter-skew has to wrap the CONTENT, not sit on the button, or the
  // text leans with the box and becomes unreadable.
  const inner = <span className="slant-content inline-flex items-center gap-2">{children}</span>;
  if (props.href !== undefined) {
    return (
      <Link className={classes} {...(props as AnchorButtonProps)}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={classes} {...(props as NativeButtonProps)}>
      {inner}
    </button>
  );
}

export { buttonVariants };

/**
 * CTA with a circular chevron badge on the right.
 *
 * Carries the same brand slant as Button. The badge is counter-skewed along
 * with the label — a circle inside a skewed box renders as an ellipse
 * otherwise, which reads as a rendering fault rather than a design.
 */
export function PillButton({
  href,
  children,
  tone = "brand",
  className,
}: {
  href: string;
  children: React.ReactNode;
  tone?: "brand" | "dark" | "light";
  className?: string;
}) {
  const tones = {
    brand: "bg-brand-600 text-white hover:bg-brand-700",
    dark: "bg-navy-800 text-white hover:bg-navy-900",
    light: "border border-ink/12 bg-white text-ink hover:border-ink/25",
  } as const;
  const badges = {
    brand: "bg-white/20 text-white",
    dark: "bg-white/15 text-white",
    light: "bg-brand-600 text-white",
  } as const;
  return (
    <Link
      href={href}
      className={cn(
        "slant [--slant-bleed:0.6rem] group inline-flex items-center gap-3 py-1.5 pl-6 pr-1.5 transition-colors",
        tones[tone],
        className
      )}
    >
      <span className="slant-content label-cta text-[0.72rem]">{children}</span>
      <span className={cn("slant-content grid h-9 w-9 place-items-center rounded-full transition-transform group-hover:translate-x-0.5", badges[tone])}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
