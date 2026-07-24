import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PANELS = [
  {
    href: "/register/investor",
    bg: "bg-brand-600",
    title: "Become an investor",
    body: "Gain exclusive access to vetted, mandate-matched opportunities.",
    btn: "bg-navy-800 hover:bg-navy-900",
  },
  {
    href: "/register/business",
    bg: "bg-navy-800",
    title: "Register your business",
    body: "Raise capital from a global network of ready investors.",
    btn: "bg-brand-600 hover:bg-brand-700",
  },
];

export function FinalCTA() {
  return (
    <section className="grid md:grid-cols-2">
      {PANELS.map((p) => (
        <div key={p.href} className={`relative overflow-hidden px-6 py-16 md:px-12 md:py-24 lg:px-20 ${p.bg}`}>
          <div className="grid-noise pointer-events-none absolute inset-0 opacity-10" aria-hidden />
          <div className="relative mx-auto max-w-md">
            <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.98] text-white sm:text-5xl">
              {p.title}
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/80">{p.body}</p>
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
