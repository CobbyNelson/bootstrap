"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Mini slider for a business's uploaded imagery on its public listing page.
 *
 * The featured image arrives first in the array (the server orders it) and so
 * sits as slide one. With a single image the controls and thumb strip vanish
 * and this collapses to a plain figure — a one-slide carousel is just a photo
 * wearing chrome it doesn't need.
 *
 * Slides are stacked and cross-faded rather than translated, matching the home
 * hero's behaviour, and every frame is already a ≤100KB WebP so preloading all
 * of them costs less than one original upload.
 */
export function ListingGallery({ images }: { images: { src: string; alt: string }[] }) {
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (next: number) => setIndex(((next % images.length) + images.length) % images.length),
    [images.length]
  );

  if (images.length === 0) return null;

  return (
    <div
      aria-roledescription="carousel"
      aria-label="Business imagery"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-ink/[0.07]">
        <div className="relative aspect-[16/9]">
          {images.map((img, i) => (
            <div
              key={img.src}
              aria-hidden={i !== index}
              className={cn(
                "absolute inset-0 transition-opacity duration-500 ease-out",
                i === index ? "opacity-100" : "opacity-0"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt}
                loading={i === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(index - 1)}
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[var(--radius-button)] bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(index + 1)}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[var(--radius-button)] bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="tnum absolute bottom-3 right-3 rounded-[var(--radius-button)] bg-ink/60 px-2.5 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={cn(
                "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                i === index ? "border-brand-600" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
