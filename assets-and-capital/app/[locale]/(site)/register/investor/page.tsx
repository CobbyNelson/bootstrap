import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { InvestorWizard } from "@/components/register/investor-wizard";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = await getTranslator((await params).locale);
  return {
    title: t.tl("Investor Registration"),
    description: t.tl("Build your investment mandate and start receiving mandate-matched opportunities from Assets & Capital."),
  };
}

export default async function InvestorRegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslator(locale);
  return (
    <>
      <PageHeader
        title={t.tl("Build your investment mandate")}
        subtitle={t.tl("Tell us your objectives, strategy, geographies and ticket size. We'll match you with opportunities that fit — and only notify you when they do.")}
      />
      <InvestorWizard />
    </>
  );
}
