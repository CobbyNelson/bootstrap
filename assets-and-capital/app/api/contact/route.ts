import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CONTACT_SCHEMA } from "@/lib/intake-schema";
import { receiveSubmission, storeSubmission } from "@/lib/public-submit";
import { sendEmail } from "@/lib/email";

/**
 * The contact form's endpoint.
 *
 * It did not exist. The form awaited a 900ms timer and showed a thank-you, so
 * every enquiry since the page went up was shown as delivered and thrown away.
 *
 * Six an hour per IP. A contact form is the least authenticated surface on the
 * site and the one that ends in somebody's inbox.
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
  const result = await receiveSubmission(req, { kind: "contact", schema: CONTACT_SCHEMA, perHour: 6 });
  if ("response" in result) return result.response;

  const { values, ip, userAgent } = result;
  await storeSubmission("contact", values, ip, userAgent);

  // The row is the record of receipt; the email is a convenience. If the mailer
  // is unconfigured or down, the enquiry is still safely stored — which is the
  // opposite of what happened before, where the email WAS the delivery and
  // there wasn't one.
  await sendEmail({
    to: "info@assetsandcapitalltd.com",
    subject: `Enquiry from ${values.name}`,
    html: [
      row("Name", values.name),
      row("Email", values.email),
      row("Company", values.company),
      row("Role", values.role),
      `<p style="margin:16px 0 0;white-space:pre-wrap">${esc(values.message)}</p>`,
    ].join(""),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
