import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerificationFlow } from "@/components/dashboard/verification";
import { getCurrentUser } from "@/lib/session";
import { getVerification } from "@/lib/portal-queries";

export const metadata: Metadata = { title: "KYC / AML Verification" };

export default async function InvestorVerificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/verification");

  const state = await getVerification(user);

  return (
    <VerificationFlow
      eyebrow="Investor workspace · Compliance"
      subject="KYC / AML verification"
      state={state}
    />
  );
}
