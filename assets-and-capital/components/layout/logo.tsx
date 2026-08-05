import Link from "next/link";
import { cn } from "@/lib/utils";

/** The supplied brand asset. */
const LOGO_SRC = "/img/logo.png";

/**
 * Assets & Capital logo.
 *
 * Renders the supplied artwork — no redrawn mark, no substitute if the file is
 * absent.
 *
 * `invert` is the one presentation concession: a white knockout via CSS filter,
 * for placements over dark photography where the black wordmark simply cannot
 * read (the home hero slider). It loses the red in the mark, which is why it is
 * opt-in per placement and not a hover state or a theme. If the brand ever
 * supplies a real reversed logo file, swap it in here and delete the filter.
 */
export function Logo({ invert = false, className }: { invert?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
      aria-label="Assets & Capital — home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SRC}
        alt="Assets & Capital"
        className={cn("h-9 w-auto", invert && "brightness-0 invert")}
      />
    </Link>
  );
}
