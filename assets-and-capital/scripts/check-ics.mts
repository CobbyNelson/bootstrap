/**
 * The .ics a calendar client actually receives.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/check-ics.mts
 *
 * ICS fails silently and specifically: an unescaped comma truncates a property,
 * a bare newline makes Outlook reject the file outright, and a line over 75
 * octets is a client's licence to discard it. None of that surfaces as an
 * error — the invitation simply does not appear, or appears wrong.
 */
import { meetingIcs } from "../lib/meetings";

const m = {
  id: "cmtest123",
  title: "Introductory call: Aurora, Accra FinPay",
  agenda: "Discuss the raise; semicolons, and commas, which both terminate a property if unescaped.",
  startsAt: new Date("2026-09-18T13:00:00Z"),
  endsAt: new Date("2026-09-18T13:30:00Z"),
  provider: "ZOOM" as const,
  joinUrl: "https://zoom.us/j/1234567890?pwd=averylongtokenthatpushesthislinewellpastseventyfiveoctets",
  location: null,
  status: "SCHEDULED",
  slug: "accra-finpay",
  revision: 2,
  investor: { id: "i1", name: "Demo Investor", email: "investor@example.com" },
  business: { id: "b1", name: "Demo Business", email: "business@example.com" },
};

const ics = meetingIcs(m);
const lines = ics.split("\r\n");
const fail: string[] = [];

if (/(?<!\r)\n/.test(ics)) fail.push("bare LF present — Outlook rejects the file");
if (lines[0] !== "BEGIN:VCALENDAR") fail.push("does not open with BEGIN:VCALENDAR");
if (!lines.includes("END:VCALENDAR")) fail.push("no END:VCALENDAR");
if (!lines.some((l) => l === "METHOD:REQUEST")) fail.push("no METHOD:REQUEST — treated as a file, not an invitation");
if (!lines.some((l) => l.startsWith("UID:"))) fail.push("no UID — every re-send becomes a new event");
if (!lines.some((l) => l === "SEQUENCE:2")) fail.push("SEQUENCE not carried — updates will not replace the original");
if (!lines.some((l) => l === "DTSTART:20260918T130000Z")) fail.push("DTSTART wrong or not UTC");
if (!lines.some((l) => l === "DTEND:20260918T133000Z")) fail.push("DTEND wrong or not UTC");
if (lines.filter((l) => l.startsWith("ATTENDEE")).length !== 2) fail.push("both parties must be ATTENDEEs");
if (!lines.includes("BEGIN:VALARM")) fail.push("no reminder");

// Commas and semicolons inside values must be escaped.
const summary = lines.find((l) => l.startsWith("SUMMARY:")) ?? "";
if (summary.includes(", ") && !summary.includes("\\,")) fail.push("comma in SUMMARY not escaped");
const desc = lines.find((l) => l.startsWith("DESCRIPTION:")) ?? "";
if (desc.includes("; ") && !desc.includes("\;")) fail.push("semicolon in DESCRIPTION not escaped");

// Folding: continuation lines start with a space, and nothing exceeds 75.
const tooLong = lines.filter((l) => l.length > 75);
if (tooLong.length) fail.push(`${tooLong.length} line(s) over 75 octets, longest ${Math.max(...tooLong.map((l) => l.length))}`);

if (fail.length) {
  console.error("ics check FAILED:");
  for (const f of fail) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`ics check passed: ${lines.length} lines, longest ${Math.max(...lines.map((l) => l.length))} octets`);
