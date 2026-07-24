import type { Metadata } from "next";
import { VerificationFlow, type VStep, type VDoc } from "@/components/dashboard/verification";

export const metadata: Metadata = { title: "KYC / AML Verification" };

const STEPS: VStep[] = [
  { label: "Identity verification", status: "Approved", detail: "Biometric + document check passed." },
  { label: "Proof of address", status: "Approved", detail: "Utility statement verified." },
  { label: "Tax identification (TIN)", status: "Approved", detail: "Matched to registry." },
  { label: "Accredited / qualified-investor status", status: "Under Review", detail: "Third-party verification in progress." },
  { label: "AML / sanctions & PEP screening", status: "Approved", detail: "OFAC / UN / EU lists — clean." },
  { label: "Source-of-funds attestation", status: "Pending", detail: "Awaiting signed declaration." },
];

const DOCS: VDoc[] = [
  { name: "Passport / National ID.pdf", status: "Approved" },
  { name: "Proof of Address.pdf", status: "Approved" },
  { name: "Tax Identification.pdf", status: "Approved" },
  { name: "Accreditation Evidence.pdf", status: "Under Review" },
  { name: "Source of Funds Declaration.pdf", status: "Pending" },
];

export default function InvestorVerificationPage() {
  return (
    <VerificationFlow
      eyebrow="Investor workspace · Compliance"
      subject="KYC / AML verification"
      overall="Under Review"
      progress={72}
      intro="Your identity and AML screening are cleared. Accreditation is in final review — you'll be fully cleared once it completes."
      steps={STEPS}
      docs={DOCS}
    />
  );
}
