"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HOW_INVESTOR, HOW_BUSINESS } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";

const TABS = [
  { key: "investor", label: "For Investors", steps: HOW_INVESTOR },
  { key: "business", label: "For Businesses", steps: HOW_BUSINESS },
] as const;

export function HowItWorks() {
  const [tab, setTab] = useState<"investor" | "business">("investor");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="How it works"
            title="From first look to closed deal — in one place"
            subtitle="A guided, transparent path whether you're deploying capital or raising it."
          />
          <div className="inline-flex rounded-full border border-ink/10 bg-white p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  tab === t.key ? "text-white" : "text-ink/60 hover:text-ink"
                }`}
              >
                {tab === t.key && (
                  <motion.span
                    layoutId="how-tab"
                    className="absolute inset-0 rounded-full bg-brand-600"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.ol
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {active.steps.map((step, i) => (
              <li
                key={step.title}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex-1 p-6">
                  <span className="font-grotesk text-5xl font-semibold text-brand-600/15 transition-colors group-hover:text-brand-600/35">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/55">{step.body}</p>
                </div>
                <div className="flex items-center justify-between bg-ink px-6 py-3">
                  <span className="kicker text-[0.7rem] text-white/60">Step</span>
                  <span className="font-grotesk text-sm font-semibold text-gold-400 tnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </li>
            ))}
          </motion.ol>
        </AnimatePresence>
      </div>
    </section>
  );
}
