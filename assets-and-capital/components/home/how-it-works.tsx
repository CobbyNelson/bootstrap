"use client";

import { useEffect, useRef, useState } from "react";
import { useCssVars } from "@/lib/use-motion";
import { HOW_INVESTOR, HOW_BUSINESS } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { useTl } from "@/components/i18n/locale-provider";

const TABS = [
  { key: "investor", label: "For Investors", steps: HOW_INVESTOR },
  { key: "business", label: "For Businesses", steps: HOW_BUSINESS },
] as const;

export function HowItWorks() {
  const tl = useTl();
  const [tab, setTab] = useState<"investor" | "business">("investor");
  const active = TABS.find((t) => t.key === tab)!;

  const listRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillRef, setPillVars] = useCssVars<HTMLSpanElement>();

  // Measured from the active button and written straight to the pill, so the
  // tabs keep their natural widths — a fixed grid-column pill would not.
  // Re-measured on resize: the labels reflow, and a pill pinned to stale
  // coordinates is worse than no pill at all.
  useEffect(() => {
    const measure = () => {
      const el = btnRefs.current[tab];
      const list = listRef.current;
      if (!el || !list) return;
      setPillVars({
        "--pill-x": `${el.offsetLeft - list.clientLeft}px`,
        "--pill-w": `${el.offsetWidth}px`,
        opacity: "1",
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [tab, setPillVars]);

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            title={tl("From first look to closed deal — in one place")}
            subtitle={tl("A guided, transparent path whether you're deploying capital or raising it.")}
          />
          {/* One pill, moved and resized to sit behind the active tab.
              framer-motion did this with layoutId; measuring the button is
              what keeps the tabs at their natural widths, which a fixed
              grid-column pill would not. */}
          <div
            ref={listRef}
            className="relative inline-flex rounded-[var(--radius-button)] border border-ink/10 bg-white p-1"
          >
            <span ref={pillRef} aria-hidden className="tab-pill bg-brand-600 opacity-0" />
            {TABS.map((t) => (
              <button
                key={t.key}
                ref={(el) => {
                  btnRefs.current[t.key] = el;
                }}
                onClick={() => setTab(t.key)}
                className={`relative z-10 rounded-[var(--radius-button)] px-5 py-2 text-sm font-medium transition-colors ${
                  tab === t.key ? "text-white" : "text-ink/60 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Keyed on the tab so React remounts it and the entrance replays.
            The old exit animation is gone: mode="wait" held the incoming panel
            back until the outgoing one finished, which read as lag on a
            control the visitor just clicked. */}
        <ol key={tab} className="tab-panel mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {active.steps.map((step, i) => (
              <li
                key={step.title}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex-1 p-6">
                  <span className="font-grotesk text-5xl font-semibold text-brand-600/15 transition-colors group-hover:text-brand-600/35">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{step.body}</p>
                </div>
                <div className="flex items-center justify-between bg-ink px-6 py-3">
                  <span className="kicker text-[0.7rem] text-white/60">{tl("Step")}</span>
                  <span className="font-grotesk text-sm font-semibold text-brand-400 tnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}
