import type { Metadata } from "next";
import { Billing } from "@/components/dashboard/billing";

export const metadata: Metadata = { title: "Billing & Subscription" };

export default function BillingPage() {
  return <Billing />;
}
