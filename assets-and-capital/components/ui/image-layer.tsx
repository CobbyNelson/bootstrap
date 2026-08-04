import { cn } from "@/lib/utils";

/**
 * Decorative photographic layer painted over whatever sits beneath it.
 *
 * Uses a CSS background rather than <img> on purpose: these are art-direction
 * layers, not content. If the file is missing the layer simply doesn't paint
 * and the gradient underneath still reads — no broken-image icons, no layout
 * shift. Always aria-hidden; meaningful imagery should use next/image instead.
 */
export function ImageLayer({
  src,
  className,
  opacity = 0.28,
  position = "center",
  blend,
  mask,
}: {
  src: string;
  className?: string;
  opacity?: number;
  position?: string;
  blend?: "overlay" | "soft-light" | "luminosity" | "screen";
  /** CSS mask-image value — use to fade the layer out towards adjacent content. */
  mask?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 bg-cover bg-no-repeat", className)}
      style={{
        backgroundImage: `url(${src})`,
        backgroundPosition: position,
        opacity,
        mixBlendMode: blend,
        // Multiple mask layers default to a union; intersect so every fade applies.
        ...(mask
          ? {
              maskImage: mask,
              WebkitMaskImage: mask,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }
          : null),
      }}
      aria-hidden
    />
  );
}
