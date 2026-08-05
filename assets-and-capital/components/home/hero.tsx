"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/home/hero-search";
import { SECTOR_IMAGERY } from "@/lib/imagery";
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
 * assets and every frame is a WebP already under 100KB.
 */
const SLIDES = [
  { key: "Infrastructure", label: "Infrastructure" },
  { key: "Renewable Energy", label: "Renewable energy" },
  { key: "Transport & Logistics", label: "Logistics" },
  { key: "Real Estate", label: "Real estate" },
].map((s) => ({ ...s, image: SECTOR_IMAGERY[s.key] }));

export function Hero() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

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
      img.src = next.image.src;
    }
  }, [index]);

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Sectors on the marketplace"
      onKeyDown={onKeyDown}
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
              "absolute inset-0 transition-opacity duration-700 ease-out",
              i === index ? "opacity-100" : "opacity-0"
            )}
          >
            {slide.image && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.image.src}
                  alt={slide.image.alt}
                  // The first frame is the LCP element — it must not be lazy.
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

        {/* Scrim. Two gradients: one bottom-up so the lower third can carry
            white text over any photograph, one from the left so the headline
            has a darker bed than the right-hand search panel needs. */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/45 to-ink/25"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent"
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
                  <span className="italic text-brand-400">ready capital.</span>
                </h1>

                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
                  Vetted businesses, matched to investor mandates, carried to close with
                  an on-the-ground team.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button href="/register/investor" variant="primary" size="lg">
                    I&apos;m an investor <ArrowRight className="h-4 w-4" />
                  </Button>
                  {/* ghost, not the default primary: primary carries a brand-red
                      background and a coloured shadow that would both have to be
                      fought off to get a glass button. */}
                  <Button
                    href="/register/business"
                    variant="ghost"
                    size="lg"
                    className="border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                  >
                    I&apos;m raising capital
                  </Button>
                </div>
              </motion.div>

              {/* Controls sit with the copy, not floating over the middle of the
                  photograph where they would fight the subject. */}
              <div className="hidden items-center gap-2 sm:flex lg:pb-2">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label="Previous sector"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/30 text-white/80 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label="Next sector"
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink transition-colors hover:bg-white/90"
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
                        "absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-colors md:inset-x-5",
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

      {/* ── search, overlapping the slider ───────────────────────────────── */}
      <div className="container-x relative z-10 -mt-8 flex justify-center pb-14 md:-mt-9">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.2 }}
          className="w-full max-w-3xl"
        >
          <HeroSearch />
        </motion.div>
      </div>
    </section>
  );
}
