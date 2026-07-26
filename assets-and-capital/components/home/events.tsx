import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { EVENTS } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";

export function Events() {
  return (
    <section className="bg-paper-2/60 py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Events & roadshows"
            title="Meet capital and opportunity in person"
            subtitle="Roadshows and forums where investors and business owners meet in person."
          />
          <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
            View all events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {EVENTS.map((ev, i) => (
            <Reveal key={ev.title} delay={i * 0.08}>
              <Link
                href="/events"
                className="group flex h-full items-center gap-5 rounded-3xl border border-ink/[0.07] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-brand-600 text-white">
                  <span className="font-display text-2xl font-semibold leading-none tnum">{ev.day}</span>
                  <span className="text-[0.6rem] font-semibold uppercase tracking-widest">{ev.month}</span>
                </div>
                <div className="min-w-0">
                  <Badge variant="gold" size="sm">{ev.type}</Badge>
                  <h3 className="mt-2 font-semibold leading-snug text-ink">{ev.title}</h3>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink/65">
                    <MapPin className="h-3 w-3" /> {ev.location}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
