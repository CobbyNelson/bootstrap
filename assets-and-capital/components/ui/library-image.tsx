import type { ImageRef } from "@/lib/imagery";

/**
 * A photograph from the image library, served at a width the device can use.
 *
 * Uses <picture> with a media query rather than srcSet + sizes. srcSet picks a
 * candidate by CSS width MULTIPLIED BY devicePixelRatio, so a 375px phone at
 * 3x asks for 1125px and takes the 1376 file — the desktop frame, on the
 * slowest connection, which is the opposite of the intent. A media query is
 * evaluated on viewport width alone and ignores DPR, so a phone gets the
 * small file whatever its screen density.
 *
 * That is a deliberate trade: slightly softer on a high-density phone, around
 * a third of the bytes. These are decorative frames sitting under a scrim, and
 * most of this audience is on mobile data.
 *
 * display:contents on the <picture> keeps it out of layout entirely, so the
 * <img> still sizes against the real parent — without it, `h-full` on the
 * image would resolve against an inline wrapper with no height.
 */
export function LibraryImage({
  image,
  className,
  priority = false,
  breakpoint = 767,
}: {
  image: ImageRef;
  className?: string;
  /** The LCP element must not be lazy, and should be fetched early. */
  priority?: boolean;
  /** Max viewport width that gets the small file. */
  breakpoint?: number;
}) {
  const small = image.src.endsWith(".webp")
    ? `${image.src.slice(0, -5)}-768.webp`
    : undefined;

  return (
    <picture className="contents">
      {small && <source media={`(max-width: ${breakpoint}px)`} srcSet={small} type="image/webp" />}
      <img
        src={image.src}
        alt={image.alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        className={className}
      />
    </picture>
  );
}
