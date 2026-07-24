import type { Metadata } from "next";
import { EmailAutomation } from "@/components/admin/email-automation";

export const metadata: Metadata = { title: "Email Automation · Admin" };

export default function AdminEmailPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <EmailAutomation />
    </div>
  );
}
