/**
 * What the public forms will accept, declared once.
 *
 * The form imports this to check an answer as somebody commits it, and the API
 * route imports the SAME object to check the posted body. That is the whole
 * point of the file: before it existed, the rules lived inside a React
 * component, which meant they were a property of the browser rather than of the
 * platform, and a request that skipped the browser skipped them entirely.
 *
 * Adding a field to a form without adding it here is not an oversight the
 * server will forgive — `validateSubmission` drops keys the schema does not
 * declare, so an unlisted field silently never arrives.
 */
import type { Rule } from "./form-validation";

/** The business listing intake — components/register/business-intake.tsx. */
export const INTAKE_SCHEMA: Record<string, Rule> = {
  companyName: { kind: "company", required: true, min: 2, max: 140 },
  hqCountry: { kind: "name", required: true, min: 2, max: 60 },
  region: { kind: "text", required: true, max: 40 },
  website: { kind: "url", max: 300 },
  // Four digits, and a company founded before writing or after next year is a
  // typo rather than a company.
  founded: { kind: "digits", max: 4, minValue: 1800, maxValue: 2100 },
  legalStructure: { kind: "text", max: 40 },
  founders: { kind: "text", max: 2000 },
  contactName: { kind: "name", required: true, min: 2, max: 80 },
  contactEmail: { kind: "email", required: true },
  contactPhone: { kind: "phone" },
  purpose: { kind: "text", required: true, min: 20, max: 4000 },
  // A trillion-dollar raise is not a raise, and the cap keeps a figure from
  // being used to post a number no downstream column can hold.
  amount: { kind: "digits", required: true, minValue: 1000, maxValue: 1_000_000_000_000 },
  instrument: { kind: "text", required: true, max: 120 },
  equityStake: { kind: "decimal", maxValue: 100 },
  returnOffer: { kind: "decimal", maxValue: 1000 },
  listingTier: { kind: "text", required: true, max: 40 },
  services: { kind: "text", max: 400 },
  featuredImage: { kind: "url", max: 500 },
  consent: { kind: "text", required: true, max: 10 },
};

/** The contact form — components/contact/contact-form.tsx. */
export const CONTACT_SCHEMA: Record<string, Rule> = {
  name: { kind: "name", required: true, min: 2, max: 80 },
  email: { kind: "email", required: true },
  company: { kind: "company", max: 140 },
  role: { kind: "text", required: true, max: 60 },
  message: { kind: "text", required: true, min: 10, max: 4000 },
};

/**
 * Answers picked from a list, checked against the list.
 *
 * A choice question renders buttons, so the only way to submit something that
 * is not on them is to post directly — which is exactly the case the server is
 * here for. Free text would pass the `text` rule happily; this will not.
 *
 * Multi-select values arrive joined with ", ", so each part is checked.
 */
export const ALLOWED_CHOICES: Record<string, string[]> = {
  region: ["East Africa", "West Africa", "North Africa", "Southern Africa", "North America", "Europe", "Middle East", "Asia Pacific"],
  legalStructure: ["LLC", "C-Corp", "Ltd", "PLC", "Partnership", "Other"],
  instrument: ["Debt", "Equity", "Preferred Share"],
  listingTier: ["Standard", "Silver", "Gold", "Platinum"],
  services: [
    "Basic Teaser Preparation",
    "Business Plan Writing",
    "Financial Reporting Services",
    "Shadow Investor Search",
    "Investor Roadshow",
  ],
  role: ["Investor", "Business seeking capital", "Partner / advisor", "Other"],
};

/** Split a multi-select answer back into its parts. */
export function choiceParts(raw: string): string[] {
  return raw.split(",").map((p) => p.trim()).filter(Boolean);
}
