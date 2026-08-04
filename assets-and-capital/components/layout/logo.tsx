import Link from "next/link";
import { cn } from "@/lib/utils";

/** The supplied brand asset. */
const LOGO_SRC = "/img/logo.png";

/**
 * Assets & Capital logo.
 *
 * Renders the supplied artwork and nothing else — no recolouring, no filters,
 * no redrawn mark, no substitute if the file is absent. The only thing this
 * component decides is the display height.
 */
export function Logo({ className }: { invert?: boolean; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
      aria-label="Assets & Capital — home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_SRC} alt="Assets & Capital" className="h-9 w-auto" />
    </Link>
  );
}
