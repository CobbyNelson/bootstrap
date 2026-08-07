import { LOCALE_META, type Locale } from "@/lib/i18n/config";

/**
 * Dates, in the reader's language.
 *
 * The site stores dates in three different shapes, none of them a Date:
 *
 *   "5 August 2026"   legal documents, hand-written
 *   "02 Oct 2026"     events, hand-written
 *   "Jul 2026"        events again, month precision only
 *
 * and articles were formatted at QUERY time with
 * `toLocaleDateString("en-GB")` — English hardcoded into the data layer, where
 * no locale is available to do anything else. So every date on the site read in
 * English regardless of the page around it: "Dernière mise à jour : 5 August
 * 2026".
 *
 * Parsing them back into a Date is what lets the platform do the work. When a
 * value cannot be parsed it is returned UNCHANGED rather than dropped — a date
 * still in English is a small fault, and a missing or wrong date on a legal
 * document is not.
 */

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

type Parsed = { date: Date; hasDay: boolean };

const monthIndex = (name: string) => MONTHS.indexOf(name.slice(0, 3).toLowerCase());

export function parseLooseDate(input: string): Parsed | null {
  const s = input.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { date: new Date(+iso[1], +iso[2] - 1, +iso[3]), hasDay: true };

  // "5 August 2026" and "02 Oct 2026" — long or short month, padded or not.
  const dmy = s.match(/^(\d{1,2})\s+([A-Za-z]+)\.?\s+(\d{4})$/);
  if (dmy) {
    const m = monthIndex(dmy[2]);
    if (m >= 0) return { date: new Date(+dmy[3], m, +dmy[1]), hasDay: true };
  }

  // "Jul 2026" — month precision. Kept distinct so it is not rendered as the
  // first of the month, which would invent a day the source never stated.
  const my = s.match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
  if (my) {
    const m = monthIndex(my[1]);
    if (m >= 0) return { date: new Date(+my[2], m, 1), hasDay: false };
  }

  return null;
}

/**
 * Latin digits everywhere, including Arabic.
 *
 * A bare "ar" tag renders Arabic-Indic numerals (٥ أغسطس ٢٠٢٦). The rest of
 * this site shows figures in Latin digits — $18M, 22% IRR, the match scores —
 * and a date in a different numbering system beside them reads as a rendering
 * fault rather than a choice. `-u-nu-latn` keeps the language and the digits
 * consistent with everything around them.
 */
function intlTag(locale: Locale): string {
  const tag = LOCALE_META[locale].hreflang;
  return locale === "ar" ? `${tag}-u-nu-latn` : tag;
}

function render(
  input: string | Date | null | undefined,
  locale: Locale,
  month: "long" | "short",
): string {
  if (!input) return "";
  const parsed: Parsed | null = input instanceof Date ? { date: input, hasDay: true } : parseLooseDate(input);
  if (!parsed) return typeof input === "string" ? input : "";

  const options: Intl.DateTimeFormatOptions = parsed.hasDay
    ? { day: "numeric", month, year: "numeric" }
    : { month: "short", year: "numeric" };

  return parsed.date.toLocaleDateString(intlTag(locale), options);
}

/** Long form for prose and document headers: "5 août 2026". */
export function formatDate(input: string | Date | null | undefined, locale: Locale): string {
  return render(input, locale, "long");
}

/** Short form for cards and lists: "2 oct. 2026". */
export function formatDateShort(input: string | Date | null | undefined, locale: Locale): string {
  return render(input, locale, "short");
}

/**
 * The day and month shown on an event's date badge.
 *
 * Derived from the same date string the card already carries, rather than from
 * the separate `day` and `month` fields beside it — those held "12" and "NOV",
 * an English abbreviation baked into the data, and a second copy of a value
 * that can drift from the date it is supposed to summarise.
 */
export function dateBadge(input: string | Date | null | undefined, locale: Locale): { day: string; month: string } {
  const parsed = input ? toParsedPublic(input) : null;
  if (!parsed) return { day: "", month: "" };
  const tag = intlTag(locale);
  return {
    day: parsed.hasDay ? parsed.date.toLocaleDateString(tag, { day: "numeric" }) : "",
    month: parsed.date.toLocaleDateString(tag, { month: "short" }),
  };
}

function toParsedPublic(input: string | Date): Parsed | null {
  return input instanceof Date ? { date: input, hasDay: true } : parseLooseDate(input);
}
