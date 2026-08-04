"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** The supplied brand asset. Swap to "/img/logo.svg" if a vector is available. */
const LOGO_SRC = "/img/logo.png";
/** Optional light version for dark surfaces. If absent, the plate below is used. */
const LOGO_SRC_LIGHT = "/img/logo-light.png";

/**
 * Assets & Capital logo — renders the supplied artwork as-is (no recolouring,
 * no redrawing).
 *
 * `invert` is for dark surfaces (footer, admin sidebar). The supplied logo has
 * black text, which would disappear on those backgrounds, so it sits on a white
 * plate rather than being altered. Drop a light variant at LOGO_SRC_LIGHT and it
 * is used instead, with no plate.
 *
 * If the asset is missing the original vector mark renders instead, so the
 * header never shows a broken image.
 */
export function Logo({ invert = false, className }: { invert?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [lightFailed, setLightFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const useLight = invert && !lightFailed;
  const src = useLight ? LOGO_SRC_LIGHT : LOGO_SRC;
  const needsPlate = invert && lightFailed;

  function markFailed() {
    if (useLight) setLightFailed(true);
    else setFailed(true);
  }

  // The image can 404 before React hydrates, so onError alone would miss it.
  // Re-check the element once mounted and whenever the source changes.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) markFailed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center", className)}
      aria-label="Assets & Capital — home"
    >
      {failed ? (
        <FallbackMark invert={invert} />
      ) : (
        <span className={cn("inline-flex items-center", needsPlate && "rounded-lg bg-white px-2.5 py-1.5")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={src} alt="Assets & Capital" className="h-9 w-auto" onError={markFailed} />
        </span>
      )}
    </Link>
  );
}

/** Original vector mark — only shown if the supplied artwork can't be loaded. */
function FallbackMark({ invert }: { invert: boolean }) {
  const text = invert ? "text-white" : "text-ink";
  const black = invert ? "#e7e9ee" : "#12161d";
  const grey = invert ? "#8b95a4" : "#c4cbd4";
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 44 44" className="h-9 w-9 flex-none" aria-hidden>
        <polygon points="1,41 12,41 25,17 14,17" fill={grey} />
        <polygon points="9,41 20,41 35,5 24,5" fill="var(--color-brand-600)" />
        <polygon points="24,5 33,5 43,41 34,41" fill={black} />
      </svg>
      <span className="flex flex-col font-display text-[15px] font-extrabold uppercase leading-[0.9] tracking-tight">
        <span className={text}>
          Assets <span className="text-brand-600">&amp;</span>
        </span>
        <span className={text}>Capital</span>
      </span>
    </span>
  );
}
