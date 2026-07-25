"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowUpRight, MapPin, Tag } from "lucide-react";
import { SCORED_MARKETPLACE, slugify } from "@/lib/matching";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-navy-700 to-navy-900",
  "from-brand-600 to-brand-800",
  "from-ink to-navy-900",
  "from-navy-600 to-brand-800",
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}
function gradient(name: string) {
  const sum = name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

// Featured = businesses on a premium (paid) listing tier. Placeholder data until
// real featured placements are wired in.
const FEATURED = SCORED_MARKETPLACE.filter((o) => o.tier === "Platinum" || o.tier === "Gold").slice(0, 8);

export function FeaturedCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.9;
    let next = el.scrollLeft + dir * amount;
    if (dir === 1 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) next = 0; // loop to start
    if (dir === -1 && el.scrollLeft <= 8) next = el.scrollWidth; // loop to end
    el.scrollTo({ left: next, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => scrollByCard(1), 4500);
    return () => clearInterval(id);
  }, [paused, scrollByCard]);

  if (!FEATURED.length) return null;

  return (
    <section className="relative border-b border-ink/[0.06] py-14 md:py-16">
      <div className="container-x">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-[0.7rem] kicker text-brand-700 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Featured
            </span>
            <h2 className="mt-3 font-display text-2xl font-semibold text-navy-700 sm:text-3xl">Featured businesses</h2>
            <p className="mt-1 text-sm text-ink/60">Premium placements from businesses raising capital now.</p>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => scrollByCard(-1)}
              className="grid h-10 w-10 place-items-center rounded-full border border-ink/12 text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => scrollByCard(1)}
              className="grid h-10 w-10 place-items-center rounded-full border border-ink/12 text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FEATURED.map((o) => {
            const slug = slugify(o.name);
            return (
              <Link
                key={o.name}
                data-card
                href={`/marketplace/${slug}`}
                className="group relative flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-card)] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
              >
                <div className={cn("relative aspect-[16/9] overflow-hidden bg-gradient-to-br", gradient(o.name))}>
                  <div className="grid-noise absolute inset-0 opacity-20" aria-hidden />
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-white/90">
                      {initials(o.name)}
                    </span>
                  </div>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[0.6rem] font-semibold text-brand-700 shadow-sm">
                    <Sparkles className="h-3 w-3" /> Featured
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.6rem] font-semibold text-white backdrop-blur-sm">
                    {o.tier}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-bold leading-tight text-brand-600">{o.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink/60">
                    <MapPin className="h-3 w-3" /> {o.country} · {o.region}
                  </p>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink/65">{o.blurb}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-2.5 py-1.5 text-xs font-semibold text-brand-700">
                      <Tag className="h-3.5 w-3.5" /> {o.sector}
                    </span>
                    <span className="text-sm text-ink/65">
                      Seeking <span className="font-bold text-ink"><Money usd={o.ask} /></span>
                    </span>
                  </div>
                </div>
                <div className="h-1 bg-brand-500/25 transition-colors group-hover:bg-brand-600" aria-hidden />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
