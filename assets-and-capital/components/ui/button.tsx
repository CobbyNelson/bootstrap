import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // One shape for every button on the site — see --radius-button in
  // globals.css. Pills are reserved for things a rectangle cannot describe.
  "label-cta rounded-[var(--radius-button)] inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
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
        link: "rounded-none normal-case tracking-normal font-medium text-brand-600 underline-offset-4 hover:underline px-0",
      },
      size: {
        // Two heights only, matching the buttons the brand already reads well
        // at: 36px (nav "Get started") and 44px (section CTAs). The old 52px
        // `lg` made a third size that nothing else on the page shared.
        // One shape and two heights, taking the "Start with a mandate"
        // proportions as the reference: 44px tall, generous horizontal padding.
        sm: "h-9 px-5 text-[0.68rem]",
        md: "h-11 px-6 text-[0.72rem]",
        lg: "h-11 px-7 text-[0.72rem]",
        // Square footprint, same corner radius — an icon button is still a
        // button, so it should not be the one round thing in a row of them.
        icon: "h-11 w-11",
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
  if (props.href !== undefined) {
    return (
      <Link className={classes} {...(props as AnchorButtonProps)}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...(props as NativeButtonProps)}>
      {children}
    </button>
  );
}

export { buttonVariants };

/**
 * CTA with a chevron badge on the right.
 *
 * Same rectangle as Button — the name is historical. The badge itself stays
 * round: it is a circular glyph holder, not a button shape.
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
        "rounded-[var(--radius-button)] group inline-flex h-11 items-center gap-3 pl-6 pr-3 transition-colors",
        tones[tone],
        className
      )}
    >
      <span className="label-cta text-[0.72rem]">{children}</span>
      <span className={cn("grid h-7 w-7 flex-none place-items-center rounded-[var(--radius-button)] transition-transform group-hover:translate-x-0.5", badges[tone])}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
