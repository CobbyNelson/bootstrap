import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SITE } from "@/lib/content";

type Doc = { title: string; sections: { h: string; p: string }[] };

const LEGAL: Record<string, Doc> = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      { h: "Overview", p: `${SITE.legalName} ("we") is committed to protecting the personal information of investors, businesses, and visitors. This policy explains what we collect, how we use it, and your rights.` },
      { h: "Information we collect", p: "We collect information you provide when registering an investment mandate or business listing, using our services, or contacting us — including identity, contact, and mandate details — as well as usage data collected automatically." },
      { h: "How we use information", p: "We use your information to match investors with opportunities, deliver our services, verify identity where required, communicate with you, and improve the platform." },
      { h: "Your rights", p: "Subject to applicable law, you may access, correct, or request deletion of your personal information, and object to certain processing. Contact us to exercise these rights." },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      { h: "Agreement", p: `By using ${SITE.name}, you agree to these terms. If you do not agree, please do not use the platform.` },
      { h: "The platform", p: "We provide a marketplace connecting investors with businesses seeking capital, and related services. We are a facilitator and do not provide investment, legal, or tax advice." },
      { h: "Fees", p: "Businesses pay listing fees and a success fee on capital raised through the platform. Investors register free and pay only for requested roadshows and partnerships created at their request." },
      { h: "Limitation of liability", p: "The platform is provided on an 'as is' basis. To the fullest extent permitted by law, we are not liable for investment outcomes or decisions made using the platform." },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    sections: [
      { h: "What are cookies", p: "Cookies are small files stored on your device that help us operate the site, remember preferences, and understand usage." },
      { h: "How we use cookies", p: "We use essential cookies for core functionality and, with your consent, analytics cookies to improve the platform. You can manage cookies in your browser settings." },
    ],
  },
  disclosures: {
    title: "Disclosures",
    sections: [
      { h: "Not investment advice", p: `${SITE.name} provides a marketplace and related services. Nothing on the platform constitutes investment, legal, or tax advice, or an offer or solicitation to buy or sell any security.` },
      { h: "Vetting", p: "While we screen and verify businesses before listing, investors are responsible for their own due diligence. Match scores are informational signals, not recommendations." },
      { h: "Risk", p: "Private-market investments carry risk, including the risk of losing capital, and are typically illiquid. Past performance is not indicative of future results." },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(LEGAL).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = LEGAL[slug];
  return { title: d ? d.title : "Legal" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = LEGAL[slug];
  if (!doc) notFound();

  return (
    <>
      <PageHeader eyebrow="Legal" title={doc.title} subtitle="Last updated July 2026. This is a template document and not legal advice." />
      <section className="py-16 md:py-20">
        <div className="container-x max-w-3xl">
          <div className="space-y-10">
            {doc.sections.map((s) => (
              <div key={s.h}>
                <h2 className="font-display text-xl font-semibold text-navy-700">{s.h}</h2>
                <p className="mt-3 leading-relaxed text-ink/60">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
