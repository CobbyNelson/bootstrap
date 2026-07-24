"use client";

import { convertAsk } from "@/lib/i18n";
import { useCurrency } from "@/components/providers/currency-provider";

/**
 * Renders a USD-denominated figure (e.g. "$25M") in the viewer's selected
 * currency. Non-currency strings pass through unchanged.
 */
export function Money({ usd }: { usd: string }) {
  const { currency } = useCurrency();
  return <>{convertAsk(usd, currency)}</>;
}
