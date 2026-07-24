"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, ShieldCheck, MapPin, Asterisk } from "lucide-react";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* ambient background */}
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(185,28,28,0.18), transparent 65%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[460px] w-[460px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(194,160,74,0.20), transparent 65%)" }}
        aria-hidden
      />

      <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        {/* left */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-[0.7rem] kicker text-brand-700 backdrop-blur">
              <span className="flex items-center gap-0.5" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full bg-navy-500" />
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
              </span>
              Global marketplace · 46 countries
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.06 }}
            className="mt-6 font-display text-[2.7rem] font-medium leading-[1.02] tracking-[-0.02em] text-ink sm:text-6xl md:text-[4.2rem]"
          >
            Where quality assets
            <br className="hidden sm:block" /> meet{" "}
            <span className="italic text-gradient-brand">ready capital.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-ink/60"
          >
            We connect vetted businesses with a global network of ready investors — matching capital to
            opportunity on mandate fit, then carrying the deal to close with expert, on-the-ground support.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.18 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button href="/register/investor" variant="primary" size="lg">
              I&apos;m an investor <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/register/business" variant="dark" size="lg">
              I&apos;m raising capital
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink/55"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" /> Vetted opportunities
            </span>
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" /> Mandate-matched
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" /> On-the-ground team
            </span>
          </motion.div>
        </div>

        {/* right — floating product cards */}
        <div className="relative mx-auto w-full max-w-md lg:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.15 }}
          >
            <FloatingCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FloatingCard() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative"
    >
      {/* decorative sparkle accent */}
      <Asterisk className="absolute -left-6 -top-8 hidden h-10 w-10 text-navy-500 sm:block" strokeWidth={2.5} aria-hidden />
      {/* main opportunity card */}
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-[var(--shadow-lift)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white">
              SS
            </div>
            <div>
              <p className="font-semibold text-ink">Sahara Solar Grid</p>
              <p className="text-xs text-ink/50">Renewable Energy · Kenya</p>
            </div>
          </div>
          <MatchRing value={94} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { k: "Ask", v: "$18M" },
            { k: "Instrument", v: "Equity" },
            { k: "Target", v: "22% IRR" },
          ].map((s) => (
            <div key={s.k} className="rounded-xl bg-paper-2 p-3">
              <p className="text-[0.65rem] uppercase tracking-wide text-ink/45">{s.k}</p>
              <p className="mt-1 font-semibold text-ink tnum">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <span className="text-xs font-medium text-brand-700">Matches your mandate</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            View deal <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* floating stat chip */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -left-10 -bottom-12 hidden rounded-2xl border border-ink/[0.07] bg-white/95 p-4 shadow-[var(--shadow-card)] backdrop-blur sm:block"
      >
        <p className="text-[0.65rem] uppercase tracking-wide text-ink/45">Capital connected</p>
        <p className="font-display text-2xl font-semibold text-ink tnum">$2.4B</p>
        <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" /> +18% this quarter
        </div>
      </motion.div>

      {/* floating notification */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -right-4 -top-6 hidden items-center gap-2 rounded-full border border-ink/[0.07] bg-white/90 px-3.5 py-2 shadow-[var(--shadow-card)] backdrop-blur md:flex"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-navy-500" />
        <span className="text-xs font-medium text-ink">New mandate match</span>
      </motion.div>
    </motion.div>
  );
}

function MatchRing({ value }: { value: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-14 w-14 place-items-center">
      <svg viewBox="0 0 48 48" className="h-14 w-14 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(12,13,16,0.08)" strokeWidth="4" />
        <motion.circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--color-brand-600)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 1.4, ease, delay: 0.6 }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-ink tnum">{value}</span>
    </div>
  );
}
