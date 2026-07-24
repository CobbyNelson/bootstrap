import type { Metadata } from "next";
import { Mail, Phone, Globe, MapPin } from "lucide-react";
import { SITE } from "@/lib/content";
import { PageHeader } from "@/components/layout/page-header";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the Assets & Capital team about investing or raising capital.",
};

export default function ContactPage() {
  const details = [
    { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: Phone, label: "Phone", value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
    { icon: Globe, label: "Website", value: SITE.domain, href: `https://${SITE.domain}` },
    { icon: MapPin, label: "Reach", value: "Global — 46 countries" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's make the connection"
        subtitle="Whether you're deploying capital or raising it, our team is ready to help. Send us a note and we'll respond within one business day."
      />

      <section className="py-16 md:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-7 md:p-9">
            <ContactForm />
          </div>
          <div className="space-y-4">
            {details.map((d) => {
              const inner = (
                <div className="flex items-center gap-4 rounded-2xl border border-ink/[0.07] bg-white p-5 transition-colors hover:border-ink/15">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <d.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ink/45">{d.label}</p>
                    <p className="font-medium text-ink">{d.value}</p>
                  </div>
                </div>
              );
              return d.href ? (
                <a key={d.label} href={d.href} className="block">
                  {inner}
                </a>
              ) : (
                <div key={d.label}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
