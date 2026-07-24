import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-800 to-ink px-8 py-16 text-center md:px-16 md:py-24">
            <div className="grid-noise pointer-events-none absolute inset-0 opacity-20" aria-hidden />
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(194,160,74,0.35), transparent 60%)" }}
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">
                Ready to make the connection?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
                Whether you&apos;re deploying capital or raising it, Assets &amp; Capital makes the connection
                simple, credible, and impactful.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <Button href="/register/investor" variant="gold" size="lg">
                  Register as an investor <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  href="/register/business"
                  variant="outline"
                  size="lg"
                  className="border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                >
                  List your business
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
