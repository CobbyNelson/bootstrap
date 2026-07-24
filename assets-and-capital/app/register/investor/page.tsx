import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { InvestorWizard } from "@/components/register/investor-wizard";

export const metadata: Metadata = {
  title: "Investor Registration",
  description:
    "Build your investment mandate and start receiving mandate-matched opportunities from Assets & Capital.",
};

export default function InvestorRegisterPage() {
  return (
    <>
      <PageHeader
        eyebrow="Investor registration"
        title="Build your investment mandate"
        subtitle="Tell us your objectives, strategy, geographies and ticket size. We'll match you with opportunities that fit — and only notify you when they do."
      />
      <InvestorWizard />
    </>
  );
}
