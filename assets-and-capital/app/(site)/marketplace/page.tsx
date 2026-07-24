import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { MarketplaceView } from "@/components/marketplace/marketplace-view";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse vetted investment opportunities across sectors and geographies, ranked by fit to your mandate.",
};

export default function MarketplacePage() {
  return (
    <>
      <PageHeader
        eyebrow="Marketplace"
        title="Curated, vetted, mandate-matched deal flow"
        subtitle="Every opportunity is screened and verified before it reaches you. Filter by region, sector, stage, instrument, and listing tier — and see how each fits your mandate."
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="brand">Screened & verified</Badge>
          <Badge variant="gold">Mandate-matched scoring</Badge>
          <Badge variant="neutral">Global coverage</Badge>
        </div>
      </PageHeader>
      <MarketplaceView />
    </>
  );
}
