import type { Metadata } from "next";
import { VerificationFlow, type VStep, type VDoc } from "@/components/dashboard/verification";

export const metadata: Metadata = { title: "Business Verification" };

const STEPS: VStep[] = [
  { label: "Identity of directors", status: "Approved", detail: "KYC on authorised signatories passed." },
  { label: "Business registration (KYB)", status: "Approved", detail: "Verified against company registry." },
  { label: "Business licence", status: "Approved", detail: "Operating licence on file." },
  { label: "Tax status", status: "Approved", detail: "Tax clearance certificate verified." },
  { label: "Financial review", status: "Under Review", detail: "FY25 audited financials in review." },
  { label: "Website & digital presence", status: "Approved", detail: "Domain and analytics validated." },
  { label: "Reference checks", status: "Pending", detail: "2 of 3 references returned." },
  { label: "Compliance officer approval", status: "Pending", detail: "Final sign-off after financial review." },
];

const DOCS: VDoc[] = [
  { name: "Certificate of Incorporation.pdf", status: "Approved" },
  { name: "Business Licence.pdf", status: "Approved" },
  { name: "Tax Clearance Certificate.pdf", status: "Approved" },
  { name: "Audited Financials FY25.pdf", status: "Under Review" },
  { name: "Shareholder Register.pdf", status: "Approved" },
  { name: "Reference Letters.pdf", status: "Pending" },
];

export default function BusinessVerificationPage() {
  return (
    <VerificationFlow
      eyebrow="Business workspace · Verification"
      subject="Business verification"
      overall="Under Review"
      progress={78}
      intro="Registration, licensing and tax are verified. Your listing earns the Verified badge once the financial review and final approval complete."
      steps={STEPS}
      docs={DOCS}
    />
  );
}
