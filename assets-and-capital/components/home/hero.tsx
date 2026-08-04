"use client";

import { motion } from "framer-motion";
import { Phone, ShieldCheck, TrendingUp, MapPin } from "lucide-react";
import { PillButton } from "@/components/ui/button";
import { ImageLayer } from "@/components/ui/image-layer";
import { IMAGERY } from "@/lib/imagery";
import { SITE } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Hero in the consulting-reference composition: a dark full-bleed field, an
 * oversized uppercase headline with one accented word, short supporting copy,
 * and a pill CTA paired with a call link. The right side carries the imagery.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-900 pt-32 pb-16 text-white md:pt-40 md:pb-24">
      {/* photographic layer — falls back to the field below if absent */}
      <ImageLayer
        src={IMAGERY.heroTower.src}
        opacity={0.3}
        position="right center"
        className="hidden lg:block lg:left-[46%] [mask-image:linear-gradient(to_right,transparent,black_22%)]"
      />
      <div
        className="pointer-events-none absolute -left-[10%] top-0 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(223,45,37,0.28), transparent 65%)" }}
        aria-hidden
      />
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[0.7rem] kicker text-white/80 backdrop-blur">
              <span className="text-brand-400" aria-hidden>&#10033;</span>
              Screened before listed · scored against your mandate
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.06 }}
            className="mt-6 max-w-[15ch] text-[2.6rem] uppercase leading-[0.98] text-white sm:text-5xl md:text-[3.9rem]"
          >
            Where quality assets meet <span className="text-brand-500">ready capital</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.12 }}
            className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-white/65"
          >
            We connect vetted businesses with investors whose mandate actually fits, then carry the deal
            through diligence to close with a team in-market.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.18 }}
            className="mt-9 flex flex-wrap items-center gap-5"
          >
            <PillButton href="/register/investor" tone="brand">
              I&apos;m an investor
            </PillButton>
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="group inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors group-hover:bg-brand-600">
                <Phone className="h-4 w-4" />
              </span>
              <span className="leading-tight">
                <span className="block kicker text-[0.62rem] text-white/50">Call us</span>
                <span className="block text-sm font-medium text-white">{SITE.phone}</span>
              </span>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/60"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-400" /> Verified listings
            </span>
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-400" /> 15 weighted criteria
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-400" /> Teams in-market
            </span>
          </motion.div>
        </div>

        {/* right — live deal card */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.15 }}
          className="relative mx-auto w-full max-w-md lg:mx-0"
        >
          <DealCard />
        </motion.div>
      </div>
    </section>
  );
}

function DealCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white">
            SS
          </div>
          <div>
            <p className="font-medium text-white">Sahara Solar Grid</p>
            <p className="text-xs text-white/55">Renewable Energy · Kenya</p>
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 kicker text-[0.6rem] text-white/70">Platinum</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[
          { k: "Ask", v: "$18M" },
          { k: "Instrument", v: "Equity" },
          { k: "Stage", v: "Growth" },
        ].map((s) => (
          <div key={s.k} className="rounded-xl bg-white/[0.06] p-3">
            <p className="kicker text-[0.55rem] text-white/45">{s.k}</p>
            <p className="mt-1 text-sm font-medium text-white tnum">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-600/15 px-4 py-3 ring-1 ring-brand-500/25">
        <span className="text-xs font-medium text-brand-200">Matches your mandate</span>
        <span className="kicker text-[0.6rem] text-white/80">View deal</span>
      </div>
    </div>
  );
}
