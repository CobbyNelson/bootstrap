import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SERVICES } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getTranslator } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/config";
import { translateContent } from "@/lib/i18n/translate-content";

export async function Services({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const services = translateContent(SERVICES, t);
 const investor = SERVICES.filter((s) => s.audience === "investor");
 const business = SERVICES.filter((s) => s.audience === "business");

 return (
 <section className="py-20 md:py-28">
 <div className="container-x">
 <SectionHeading
 align="center"
 title={t.tl("Expert support on both sides of the deal")}
 subtitle={t.tl("Beyond the marketplace, our team delivers the services that move a deal forward — for investors and businesses alike.")}
 className="mx-auto"
 />

 <div className="mt-14 grid gap-6 lg:grid-cols-2">
 <ServiceColumn title={t.tl("For Investors")} tag="Deploy with an edge" services={investor} accent="brand" />
 <ServiceColumn title={t.tl("For Businesses")} tag="Raise with confidence" services={business} accent="gold" />
 </div>
 </div>
 </section>
 );
}

function ServiceColumn({
 title,
 tag,
 services,
 accent,
}: {
 title: string;
 tag: string;
 services: typeof SERVICES;
 accent: "brand" | "gold";
}) {
 return (
 <Reveal>
 <div className="h-full rounded-3xl border border-ink/[0.07] bg-white p-7">
 <div className="flex items-center justify-between">
 <h3 className="font-display text-2xl font-semibold text-navy-700">{title}</h3>
 <span
 className={`rounded-full px-3 py-1 text-xs font-medium ${
 accent === "brand" ? "bg-brand-50 text-brand-700" : "bg-navy-100 text-navy-700"
 }`}
 >
 {tag}
 </span>
 </div>
 <div className="mt-6 divide-y divide-ink/[0.06]">
 {services.map((s) => (
 <Link
 key={s.title}
 href="/pricing"
 className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0"
 >
 <span
 className={`grid h-11 w-11 flex-none place-items-center rounded-xl ring-1 transition-colors ${
 accent === "brand"
 ? "bg-brand-50 text-brand-600 ring-brand-100 group-hover:bg-brand-600 group-hover:text-white"
 : "bg-navy-100 text-navy-700 ring-navy-200 group-hover:bg-navy-500 group-hover:text-white"
 }`}
 >
 <s.icon className="h-5 w-5" />
 </span>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5">
 <p className="font-medium text-ink">{s.title}</p>
 <ArrowUpRight className="h-3.5 w-3.5 text-ink/30 transition-all group-hover:translate-x-0.5 group-hover:text-ink/60" />
 </div>
 <p className="mt-1 text-sm leading-relaxed text-ink/65">{s.body}</p>
 </div>
 </Link>
 ))}
 </div>
 </div>
 </Reveal>
 );
}
