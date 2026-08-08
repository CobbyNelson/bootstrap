import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { INTAKE_SCHEMA } from "@/lib/intake-schema";
import { receiveSubmission, storeSubmission } from "@/lib/public-submit";
import { sendEmail } from "@/lib/email";

/**
 * The business listing intake's endpoint.
 *
 * Also did not exist — the component carried a comment reading "Integration
 * seam: POST the intake" and then cleared the draft, so nineteen questions
 * about a company's raise were collected, wiped, and confirmed as submitted.
 *
 * Three an hour per IP: this is a considered submission, not something anybody
 * legitimately files repeatedly, and each one becomes work for a human.
 */
/**
 * Escape before interpolating into the notification email.
 *
 * Belt and braces: the schema already refuses `<` and `>` in every field that
 * reaches here, so this should never have anything to do. It is here because
 * "should never" is doing the work of a control otherwise — if a field is ever
 * added with a looser rule, the email is not where that gets discovered.
 */
function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `<p style="margin:0 0 6px"><strong>${esc(label)}:</strong> ${esc(value || "—")}</p>`;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const result = await receiveSubmission(req, { kind: "business-intake", schema: INTAKE_SCHEMA, perHour: 3 });
  if ("response" in result) return result.response;

  const { values, ip, userAgent } = result;
  const id = await storeSubmission("business-intake", values, ip, userAgent);

  await sendEmail({
    to: "info@assetsandcapitalltd.com",
    subject: `Listing intake — ${values.companyName}`,
    html: [
      `<p>A business has submitted a listing intake (${esc(id)}).</p>`,
      ...Object.entries(values).map(([k, v]) => row(k, v)),
    ].join(""),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
