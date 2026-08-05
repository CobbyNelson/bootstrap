import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageLayer } from "@/components/ui/image-layer";
import { IMAGERY } from "@/lib/imagery";

const PANELS = [
  {
    href: "/register/investor",
    bg: "bg-brand-600",
    title: "Become an investor",
    body: "Opportunities screened before they reach you, and scored against your mandate.",
    btn: "bg-navy-800 hover:bg-navy-900",
    img: IMAGERY.skylineFigure.src,
  },
  {
    href: "/register/business",
    bg: "bg-navy-800",
    title: "Register your business",
    body: "Put your raise in front of investors whose criteria it meets.",
    btn: "bg-brand-600 hover:bg-brand-700",
    img: IMAGERY.ctaTexture.src,
  },
];

export function FinalCTA() {
  return (
    <section className="grid md:grid-cols-2">
      {PANELS.map((p) => (
        <div key={p.href} className={`relative overflow-hidden px-6 py-16 md:px-12 md:py-24 lg:px-20 ${p.bg}`}>
          <ImageLayer src={p.img} opacity={0.2} blend="luminosity" position="center" />
          <div className="grid-noise pointer-events-none absolute inset-0 opacity-10" aria-hidden />
          <div className="relative mx-auto max-w-md">
            <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.98] text-white sm:text-5xl">
              {p.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white">{p.body}</p>
            <Link
              href={p.href}
              className={`group mt-8 flex items-center justify-between gap-4 rounded-xl px-6 py-4 text-sm font-semibold uppercase tracking-wide text-white transition-colors ${p.btn}`}
            >
              Register now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
}
