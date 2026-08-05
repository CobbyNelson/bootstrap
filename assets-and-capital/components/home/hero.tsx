"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowLeft, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/hero-search";
import { SECTOR_IMAGERY, srcSetFor } from "@/lib/imagery";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Hero slider.
 *
 * Full-bleed sector imagery with the copy and the search panel sitting over the
 * lower third, rather than a split copy/product-card layout.
 *
 * The headline does NOT rotate with the slides. It is the brand line, and
 * swapping it every few seconds would mean either repeating it (pointless) or
 * inventing four different claims to fill the slots. The images carry the
 * variety; the message stays put.
 *
 * Slides reuse the sector imagery already in the library, so this adds no new
 * assets. Every frame is a WebP built at two widths; the phone variant is
 * around 13KB against 37KB for the desktop one.
 */
const SLIDES = [
  { key: "Infrastructure", label: "Infrastructure" },
  { key: "Renewable Energy", label: "Renewable energy" },
  { key: "Transport & Logistics", label: "Logistics" },
  { key: "Real Estate", label: "Real estate" },
].map((s) => ({ ...s, image: SECTOR_IMAGERY[s.key] }));

/** Dwell time per slide. Long enough to read the sector label and take in the
 *  photograph; the 1s crossfade sits inside it, so a frame is fully still for
 *  about five seconds. */
const AUTOPLAY_MS = 6000;

export function Hero() {
  const [index, setIndex] = useState(0);
  /**
   * Which frames may fetch their image.
   *
   * Every slide is absolutely positioned and merely transparent, so the browser
   * counts all four as in-viewport and loading="lazy" does nothing — the page
   * fetched the whole carousel before showing one frame of it. Only the frame
   * on screen and the one queued behind it are worth bytes; the rest arrive as
   * the visitor reaches them, which on a slow connection is the difference
   * between one image and four.
   */
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0, 1]));
  const reduceMotion = useReducedMotion();

  /** The visitor's explicit choice, via the pause button. */
  const [playing, setPlaying] = useState(true);
  /** Pointer or keyboard focus is inside the hero — someone is reading it. */
  const [engaged, setEngaged] = useState(false);
  /** The tab is in the background. */
  const [tabHidden, setTabHidden] = useState(false);

  const go = useCallback((next: number) => {
    const i = ((next % SLIDES.length) + SLIDES.length) % SLIDES.length;
    setIndex(i);
    setMounted((prev) => {
      const after = (i + 1) % SLIDES.length;
      if (prev.has(i) && prev.has(after)) return prev;
      const grown = new Set(prev);
      grown.add(i);
      grown.add(after);
      return grown;
    });
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // No autoplay at all when the visitor has asked for reduced motion: a
  // carousel that moves on its own is exactly the kind of thing that setting
  // exists to stop. They keep the tabs and arrows.
  const advancing = playing && !engaged && !tabHidden && !reduceMotion;

  // setTimeout keyed on `index` rather than a fixed interval: any change —
  // autoplay, a tab click, an arrow — restarts the clock, so a slide the
  // visitor just chose gets its full dwell instead of a fraction of it.
  useEffect(() => {
    if (!advancing) return;
    const id = window.setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [advancing, index, go]);

  // Arrow keys move the slider when a control inside it has focus, so the
  // carousel is operable without a mouse.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
  };

  // Preload the next frame so clicking a tab does not show a blank panel while
  // the browser fetches it.
  useEffect(() => {
    const next = SLIDES[(index + 1) % SLIDES.length];
    if (next.image) {
      const img = new Image();
      // Mirror the rendered element's srcSet/sizes, or the preload fetches the
      // desktop frame on a phone and warms the wrong file.
      const set = srcSetFor(next.image.src);
      if (set) {
        img.sizes = "100vw";
        img.srcset = set;
      }
      img.src = next.image.src;
    }
  }, [index]);

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Sectors on the marketplace"
      onKeyDown={onKeyDown}
      // Autoplay stops while a pointer is over the hero or focus is inside it.
      // Moving the slide out from under someone mid-read is the thing that
      // makes auto-advancing carousels feel hostile.
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
      onFocusCapture={() => setEngaged(true)}
      onBlurCapture={() => setEngaged(false)}
    >
      {/* ── slides ───────────────────────────────────────────────────────── */}
      {/* Taller on the base size than sm: the copy STACKS on a phone, so it
          needs more vertical room there than at tablet widths where it sits in
          one column beside empty space. */}
      <div className="relative h-[42rem] w-full sm:h-[40rem] lg:h-[44rem]">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.key}
            aria-hidden={i !== index}
            className={cn(
              // 1s crossfade — soft enough that the change registers as a
              // dissolve rather than a cut. Inactive frames are taken out of
              // the hit-testing path so a transparent layer can never swallow
              // a click meant for the frame beneath it.
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {slide.image && mounted.has(i) && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image.src}
                  srcSet={srcSetFor(slide.image.src)}
                  // Full-bleed at every breakpoint, so the viewport width IS
                  // the layout width — no guesswork in this one.
                  sizes="100vw"
                  alt={slide.image.alt}
                  // The first frame is the LCP element — it must not be lazy.
                  // Later frames are gated by `mounted` above rather than by
                  // loading="lazy", which cannot help an in-viewport element.
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : "low"}
                  className={cn(
                    "h-full w-full object-cover",
                    // A slow drift gives the still image some life without the
                    // jitter of a full Ken Burns pan.
                    !reduceMotion && i === index && "animate-[heroDrift_18s_ease-out_forwards]"
                  )}
                />
              </>
            )}
          </div>
        ))}

        {/* Scrim. A flat wash across the WHOLE frame so every photograph sits
            at the same weight and the navbar has a consistent bed at the top,
            plus a bottom-up gradient that deepens behind the copy. The old
            version faded to 25% at the top, so each slide lightened the header
            by a different amount. */}
        <div className="absolute inset-0 bg-ink/55" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent"
          aria-hidden
        />

        {/* ── lower third ─────────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="container-x pb-8 md:pb-10">
            <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_auto]">
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.7rem] kicker text-white backdrop-blur">
                  A marketplace for private capital
                </span>

                <h1 className="mt-5 max-w-2xl font-display text-[2.4rem] font-bold leading-[1.03] tracking-[-0.02em] text-white sm:text-5xl md:text-[3.6rem]">
                  Where quality assets
                  <br className="hidden sm:block" /> meet{" "}
                  <span className="italic text-brand-500">ready capital.</span>
                </h1>

                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                  Vetted businesses, matched to investor mandates, carried to close with
                  an on-the-ground team.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button href="/register/investor" variant="primary" size="lg">
                    I&apos;m an investor <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button href="/register/business" variant="inverseOutline" size="lg">
                    I&apos;m raising capital
                  </Button>
                </div>
              </motion.div>

              {/* Controls sit with the copy, not floating over the middle of the
                  photograph where they would fight the subject. */}
              <div className="hidden items-center gap-2 sm:flex lg:pb-2">
                {/* WCAG 2.2.2 (Pause, Stop, Hide): content that starts moving on
                    its own and runs longer than five seconds needs a way to
                    stop it. Hover-to-pause helps but does not satisfy this on
                    its own — and it does nothing for a touch visitor, who has
                    no hover at all. Hidden when the visitor has reduced motion
                    set, because nothing is moving for them to stop. */}
                {!reduceMotion && (
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? "Pause sector slideshow" : "Play sector slideshow"}
                    className="grid h-11 w-11 place-items-center rounded-[var(--radius-button)] border border-white/30 text-white/80 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label="Previous sector"
                  className="grid h-11 w-11 place-items-center rounded-[var(--radius-button)] border border-white/30 text-white/80 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label="Next sector"
                  className="grid h-11 w-11 place-items-center rounded-[var(--radius-button)] bg-white text-ink transition-colors hover:bg-white/90"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── tabs ──────────────────────────────────────────────────────── */}
          <div className="border-t border-white/15">
            <div className="container-x">
              <div
                role="tablist"
                aria-label="Choose a sector"
                className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {SLIDES.map((slide, i) => (
                  <button
                    key={slide.key}
                    role="tab"
                    aria-selected={i === index}
                    onClick={() => go(i)}
                    className={cn(
                      "relative shrink-0 px-4 py-4 text-sm font-medium transition-colors md:px-6",
                      i === index ? "text-white" : "text-white/55 hover:text-white/80"
                    )}
                  >
                    {slide.label}
                    {/* The active marker is a layout element, not a border on
                        the button — a border would shift the label by a pixel
                        each time the selection moved. */}
                    <span
                      className={cn(
                        "absolute inset-x-3 bottom-0 h-[3px] rounded-[var(--radius-button)] transition-colors md:inset-x-5",
                        i === index ? "bg-brand-500" : "bg-transparent"
                      )}
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── search, in its own band below the hero ───────────────────────── */}
      {/* It used to hang off the bottom edge of the slider on a negative
          margin, which meant it sat half on the photograph and half on the
          page. Given its own space it reads as a distinct step. */}
      {/* The pattern sits on a full-width wrapper, not on container-x, so the
          grid runs edge to edge behind the band rather than stopping at the
          text column. */}
      <div className="relative">
        <div className="grid-noise pointer-events-none absolute inset-0" aria-hidden />
        <div className="container-x relative z-10 flex justify-center py-10 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="w-full max-w-3xl"
        >
          <HeroSearch />
        </motion.div>
        </div>
      </div>
    </section>
  );
}
