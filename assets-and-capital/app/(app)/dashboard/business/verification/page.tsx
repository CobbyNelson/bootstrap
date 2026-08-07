import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerificationFlow } from "@/components/dashboard/verification";
import { getCurrentUser } from "@/lib/session";
import { getVerification } from "@/lib/portal-queries";

export const metadata: Metadata = { title: "Business Verification" };

export default async function BusinessVerificationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/business/verification");

  const state = await getVerification(user);

  return (
    <VerificationFlow
      eyebrow="Business workspace · Verification"
      subject="Business verification"
      state={state}
      isBusiness
    />
  );
}
