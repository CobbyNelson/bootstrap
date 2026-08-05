import Link from "next/link";
import { cn } from "@/lib/utils";

/** The supplied brand asset. */
const LOGO_SRC = "/img/logo.png";
/**
 * Reversed artwork for dark surfaces, generated from the same source file:
 * only the black wordmark and mark are flipped to white. The red parallelogram
 * and the grey plane are untouched, so the brand colour survives.
 *
 * This replaced a `brightness(0) invert(1)` filter, which flattened the whole
 * logo to a white silhouette — the red disappeared entirely.
 */
const LOGO_DARK_SRC = "/img/logo-dark.png";

/**
 * Assets & Capital logo.
 *
 * Renders the supplied artwork — no redrawn mark, no substitute if the file is
 * absent.
 *
 * `invert` forces the reversed artwork for placements over dark photography
 * (the home hero). Everywhere else both files are emitted and globals.css shows
 * whichever matches the theme, because no class-based `dark:` variant is
 * configured — a `dark:` utility here would follow the OS preference rather
 * than the site's own toggle.
 */
export function Logo({ invert = false, className }: { invert?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
      aria-label="Assets & Capital — home"
    >
      {invert ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={LOGO_DARK_SRC} alt="Assets & Capital" className="h-9 w-auto" />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="Assets & Capital" data-logo-light className="h-9 w-auto" />
          {/* alt="" so screen readers announce the logo once, not twice. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DARK_SRC} alt="" aria-hidden data-logo-dark className="h-9 w-auto" />
        </>
      )}
    </Link>
  );
}
