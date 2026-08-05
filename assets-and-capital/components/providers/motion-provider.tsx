"use client";

import { MotionConfig } from "framer-motion";

/**
 * Makes every framer-motion animation in the app honour the operating system's
 * "reduce motion" setting.
 *
 * Without this, `reducedMotion` defaults to "never" and the reveal animations
 * run regardless of the preference — the CSS `@media (prefers-reduced-motion)`
 * rules elsewhere in globals.css never see them, because these transforms are
 * driven in JavaScript, not CSS. "user" makes framer-motion drop transform and
 * layout animation while keeping opacity, so content still appears; it simply
 * stops moving.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
