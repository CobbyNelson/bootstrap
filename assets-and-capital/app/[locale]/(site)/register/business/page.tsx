import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BusinessIntake } from "@/components/register/business-intake";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = await getTranslator((await params).locale);
  return {
    title: t.tl("List Your Business"),
    description: t.tl("List your business on Assets & Capital and reach a global network of vetted investors ready to deploy capital."),
  };
}

export default async function BusinessRegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslator(locale);
  return (
    <>
      <PageHeader
        title={t.tl("List your business, reach ready capital")}
        subtitle={t.tl("Create a verified profile with your ask and the services you need. We actively put your opportunity in front of the investors whose mandate fits.")}
      />
      <BusinessIntake />
    </>
  );
}
