import type { Metadata } from "next";
import { MapPin, ArrowRight } from "lucide-react";
import { EVENTS } from "@/lib/content";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Events & Roadshows",
  description: "Curated roadshows, forums, and networking events that connect capital with opportunity.",
};

const ALL_EVENTS = [
  ...EVENTS,
  { title: "MENA Private Capital Summit", type: "Summit", location: "Dubai, UAE", date: "12 Nov 2026", month: "NOV", day: "12" },
  { title: "Southern Africa Real Assets Day", type: "Roadshow", location: "Cape Town, SA", date: "26 Nov 2026", month: "NOV", day: "26" },
  { title: "Family Office Connect", type: "Networking", location: "Geneva, CH", date: "09 Dec 2026", month: "DEC", day: "09" },
];

export default function EventsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Events & roadshows"
        title="Where capital meets opportunity"
        subtitle="Specialised roadshows and forums that put pre-screened investors and vetted businesses in the same room."
      >
        <Button href="/services/roadshows" variant="primary" size="lg">
          Request a roadshow <ArrowRight className="h-4 w-4" />
        </Button>
      </PageHeader>

      <section className="py-16 md:py-20">
        <div className="container-x grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ALL_EVENTS.map((ev, i) => (
            <Reveal key={ev.title} delay={(i % 3) * 0.08}>
              <div className="group flex h-full flex-col rounded-3xl border border-ink/[0.07] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-brand-600 text-white">
                    <span className="font-display text-2xl font-semibold leading-none tnum">{ev.day}</span>
                    <span className="text-[0.6rem] font-semibold uppercase tracking-widest">{ev.month}</span>
                  </div>
                  <Badge variant="gold" size="sm">{ev.type}</Badge>
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-ink">{ev.title}</h3>
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-ink/50">
                  <MapPin className="h-3.5 w-3.5" /> {ev.location} · {ev.date}
                </p>
                <div className="mt-auto pt-6">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                    Register interest <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
