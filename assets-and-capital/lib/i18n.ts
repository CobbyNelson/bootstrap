/**
 * Lightweight globalization layer: currency conversion + locale metadata.
 *
 * Reference (indicative mid-market) rates are relative to 1 USD. In production
 * these are refreshed from an FX provider; the conversion helpers are unchanged.
 */

export type CurrencyCode = "USD" | "EUR" | "GBP" | "NGN" | "KES" | "GHS" | "ZAR";

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  label: string;
  /** Units of this currency per 1 USD. */
  rate: number;
  flag: string;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", label: "US Dollar", rate: 1, flag: "🇺🇸" },
  { code: "EUR", symbol: "€", label: "Euro", rate: 0.92, flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "British Pound", rate: 0.79, flag: "🇬🇧" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", rate: 1580, flag: "🇳🇬" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling", rate: 129, flag: "🇰🇪" },
  { code: "GHS", symbol: "GH₵", label: "Ghanaian Cedi", rate: 15.3, flag: "🇬🇭" },
  { code: "ZAR", symbol: "R", label: "South African Rand", rate: 18.2, flag: "🇿🇦" },
];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

const SUFFIX: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };

/**
 * Parse a USD-denominated ask string such as "$25M", "$9.5M", "$600K", "$1.2B"
 * into an absolute number of USD. Returns null if the string is not a plain
 * currency figure (e.g. "17% IRR", "3.6× MOIC").
 */
export function parseUsd(ask: string): number | null {
  const m = ask.trim().match(/^\$?\s*([\d,.]+)\s*([KMB])?$/i);
  if (!m) return null;
  const value = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  const mult = m[2] ? SUFFIX[m[2].toUpperCase()] : 1;
  return value * mult;
}

/** Format an absolute amount (already in the target currency) with a K/M/B suffix. */
function compact(amount: number): { value: string; suffix: string } {
  const abs = Math.abs(amount);
  if (abs >= 1e9) return { value: trim(amount / 1e9), suffix: "B" };
  if (abs >= 1e6) return { value: trim(amount / 1e6), suffix: "M" };
  if (abs >= 1e3) return { value: trim(amount / 1e3), suffix: "K" };
  return { value: Math.round(amount).toLocaleString("en-US"), suffix: "" };
}

function trim(n: number): string {
  // one decimal place, but drop a trailing ".0"
  const s = n.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/**
 * Convert a USD ask string into the target currency, preserving the compact
 * "$25M" presentation. Non-currency strings are returned unchanged so callers
 * can pass any field safely.
 */
export function convertAsk(ask: string, currency: Currency): string {
  const usd = parseUsd(ask);
  if (usd === null) return ask;
  const converted = usd * currency.rate;
  const { value, suffix } = compact(converted);
  const sep = currency.symbol.length > 1 ? " " : "";
  return `${currency.symbol}${sep}${value}${suffix}`;
}

export const LOCALES = [
  { code: "en-GB", label: "English (UK)" },
  { code: "en-US", label: "English (US)" },
  { code: "fr-FR", label: "Français" },
  { code: "pt-PT", label: "Português" },
  { code: "ar", label: "العربية" },
  { code: "sw", label: "Kiswahili" },
] as const;
