import type { Metadata } from "next";
import { ESign } from "@/components/dashboard/esign";

export const metadata: Metadata = { title: "Agreements & E-signature" };

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <ESign />
    </div>
  );
}
