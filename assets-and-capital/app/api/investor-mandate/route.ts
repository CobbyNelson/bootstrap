import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { INVESTOR_OPTIONS, investorSchemaFor } from "@/lib/intake-schema";
import { receiveSubmission, storeSubmission } from "@/lib/public-submit";
import { sendEmail } from "@/lib/email";

/**
 * The investment mandate's endpoint.
 *
 * The wizard held five steps of answers in React state and ended by setting
 * `submitted` to true. Nothing was ever posted, so every mandate built since
 * the page went up — thirty answers an investment committee had to agree —
 * showed "Mandate submitted" and was discarded.
 *
 * The schema depends on the branch, because the three mandates ask different
 * questions: requiring a real-estate field of a fund investor would refuse
 * every valid submission. The branch is read first, checked against its list,
 * and only then does it decide which schema the rest is held to. Keys belonging
 * to the other two branches are dropped rather than ignored, so a payload
 * cannot smuggle a real-estate mandate into a fund registration.
 *
 * Three an hour per IP. A mandate is considered work, not something anybody
 * legitimately files repeatedly.
 */
function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Peek at the branch before choosing a schema. It is read from an untrusted
  // body, so it is checked against its own list first and nothing else is
  // trusted until it resolves — an unrecognised branch means no schema at all,
  // and `receiveSubmission` would then drop every field.
  let branch = "";
  const clone = req.clone();
  try {
    const peek = await clone.json();
    if (peek && typeof peek === "object" && typeof peek.branch === "string") branch = peek.branch;
  } catch {
    /* receiveSubmission returns the proper 400 for a malformed body */
  }

  if (!INVESTOR_OPTIONS.branch.includes(branch)) {
    return NextResponse.json({ error: "Choose an investor type to begin." }, { status: 422 });
  }

  const schema = investorSchemaFor(branch);
  const result = await receiveSubmission(req, { kind: "investor-mandate", schema, perHour: 3 });
  if ("response" in result) return result.response;

  const { values, ip, userAgent } = result;
  const id = await storeSubmission("investor-mandate", values, ip, userAgent);

  await sendEmail({
    to: "info@assetsandcapitalltd.com",
    subject: `Investor mandate — ${values.entityName} (${branch})`,
    html: [
      `<p>An investor has submitted a ${esc(branch)} mandate (${esc(id)}).</p>`,
      ...Object.entries(values).map(
        ([k, v]) => `<p style="margin:0 0 6px"><strong>${esc(k)}:</strong> ${esc(v || "—")}</p>`,
      ),
    ].join(""),
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
