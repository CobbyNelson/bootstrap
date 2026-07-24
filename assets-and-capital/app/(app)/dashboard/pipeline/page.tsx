import type { Metadata } from "next";
import { DealPipeline } from "@/components/dashboard/deal-pipeline";

export const metadata: Metadata = { title: "Deal Pipeline" };

export default function PipelinePage() {
  return (
    <div className="mx-auto max-w-7xl">
      <DealPipeline />
    </div>
  );
}
