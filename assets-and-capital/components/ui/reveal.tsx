"use client";

import * as React from "react";
import { useInViewOnce } from "@/lib/use-motion";
import { cn } from "@/lib/utils";

/**
 * Fade-and-rise as the element scrolls into view.
 *
 * Was framer-motion's whileInView. The API is unchanged, so the seventeen
 * places that use it did not have to move — the animation is now a CSS
 * keyframe switched on by an IntersectionObserver, which is all the original
 * ever did and 43KB lighter.
 *
 * The delay is a custom property rather than a class because it is a
 * continuous value; a class would need an arbitrary Tailwind variant per call
 * site, and the delays here are computed from list indexes.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, shown] = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-shown={shown}
      className={cn("reveal", className)}
      style={delay ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
