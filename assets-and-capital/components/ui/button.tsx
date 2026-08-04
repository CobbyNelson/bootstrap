import * as React from "react";
import Link, { type LinkProps } from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
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
        link: "text-brand-600 underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[0.95rem]",
        lg: "h-13 px-8 text-base",
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

export function Button({ className, variant, size, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (props.href !== undefined) {
    return <Link className={classes} {...(props as AnchorButtonProps)} />;
  }
  return <button className={classes} {...(props as NativeButtonProps)} />;
}

export { buttonVariants };

/**
 * Pill CTA with a circular chevron badge on the right — the button style used
 * throughout the consulting reference.
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
        "group inline-flex items-center gap-3 rounded-full py-1.5 pl-6 pr-1.5 transition-colors",
        tones[tone],
        className
      )}
    >
      <span className="label-cta text-[0.72rem]">{children}</span>
      <span className={cn("grid h-9 w-9 place-items-center rounded-full transition-transform group-hover:translate-x-0.5", badges[tone])}>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
