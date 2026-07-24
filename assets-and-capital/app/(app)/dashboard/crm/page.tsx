import type { Metadata } from "next";
import { CRM } from "@/components/dashboard/crm";

export const metadata: Metadata = { title: "CRM & Pipeline" };

export default function CRMPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <CRM />
    </div>
  );
}
