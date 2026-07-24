import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BusinessIntake } from "@/components/register/business-intake";

export const metadata: Metadata = {
  title: "List Your Business",
  description:
    "List your business on Assets & Capital and reach a global network of vetted investors ready to deploy capital.",
};

export default function BusinessRegisterPage() {
  return (
    <>
      <PageHeader
        eyebrow="For businesses"
        title="List your business, reach ready capital"
        subtitle="Create a verified profile with your ask and the services you need. We actively put your opportunity in front of the investors whose mandate fits."
      />
      <BusinessIntake />
    </>
  );
}
