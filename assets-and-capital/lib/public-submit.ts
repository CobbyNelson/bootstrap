import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { validateSubmission, HONEYPOT_KEY, type Rule } from "@/lib/form-validation";
import { ALLOWED_CHOICES, choiceParts } from "@/lib/intake-schema";

/**
 * The one place a public form submission is allowed in.
 *
 * Everything the browser did — filtering keystrokes, checking an answer before
 * moving on, hiding a honeypot — is UX. It runs in a context the sender
 * controls, so it can be turned off with a devtools toggle or skipped entirely
 * with one `curl`. This function is the boundary: it assumes the request never
 * saw the form at all.
 *
 * In order, because the order is the point — each check is cheaper than the one
 * after it, so an attacker pays before we do:
 *
 *   1. RATE LIMIT, per IP, before the body is even read. A form that posts is a
 *      free write into the database and a free line in somebody's inbox.
 *   2. SIZE, before parsing. A 50MB JSON body costs nothing to send and a lot
 *      to deserialize.
 *   3. SHAPE. A JSON body is not necessarily an object, and an array or a
 *      string reaching property access is how odd crashes start.
 *   4. HONEYPOT. Same 200 as a success — a bot told it failed learns what to
 *      change next time.
 *   5. THE SCHEMA, which is the same object the form used. Unknown keys are
 *      dropped rather than stored, so a payload cannot introduce a field.
 *   6. THE CHOICE LISTS, which the buttons enforced in the browser and nothing
 *      enforced anywhere else.
 */
const MAX_BODY_BYTES = 64 * 1024;

export type SubmitResult =
  | { response: NextResponse }
  | { values: Record<string, string>; ip: string; userAgent: string };

export async function receiveSubmission(
  req: NextRequest,
  opts: { kind: string; schema: Record<string, Rule>; perHour: number },
): Promise<SubmitResult> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const limit = rateLimit(`submit:${opts.kind}:${ip}`, opts.perHour, 60 * 60 * 1000);
  if (!limit.ok) {
    return {
      response: NextResponse.json(
        { error: "Too many submissions. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
      ),
    };
  }

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return { response: NextResponse.json({ error: "That submission is too large." }, { status: 413 }) };
  }

  let body: unknown;
  try {
    const text = await req.text();
    // Content-Length is the sender's claim about the sender's own request.
    // Measuring what actually arrived is the check that means something.
    if (text.length > MAX_BODY_BYTES) {
      return { response: NextResponse.json({ error: "That submission is too large." }, { status: 413 }) };
    }
    body = JSON.parse(text);
  } catch {
    return { response: NextResponse.json({ error: "Malformed request." }, { status: 400 }) };
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { response: NextResponse.json({ error: "Malformed request." }, { status: 400 }) };
  }
  const raw = body as Record<string, unknown>;

  // A bot filled the field a person cannot see. It gets the success it was
  // looking for, and nothing is written.
  if (raw[HONEYPOT_KEY]) {
    return { response: NextResponse.json({ ok: true }) };
  }

  const checked = validateSubmission(raw, opts.schema);
  if (!checked.ok) {
    return { response: NextResponse.json({ error: "Some answers were not accepted.", fields: checked.errors }, { status: 422 }) };
  }

  const resolved = await resolveChoices(checked.values);
  if ("errors" in resolved) {
    return { response: NextResponse.json({ error: "Some answers were not accepted.", fields: resolved.errors }, { status: 422 }) };
  }

  return {
    values: resolved.values,
    ip,
    // Bounded, because it is a header and headers are attacker-controlled.
    userAgent: (req.headers.get("user-agent") ?? "").slice(0, 300),
  };
}

/** Store what passed. Nothing that failed ever reaches this. */
export async function storeSubmission(
  kind: string,
  values: Record<string, string>,
  ip: string,
  userAgent: string,
): Promise<string> {
  const row = await prisma.formSubmission.create({
    data: { kind, payload: values, ip, userAgent },
    select: { id: true },
  });
  return row.id;
}

/**
 * Answers picked from a list, checked against the list — strictly.
 *
 * A choice question renders buttons, so in a browser the only possible answers
 * are the ones on them. Posting directly, they are just strings, and
 * `listingTier` is not decoration: it decides how prominently a business
 * appears. A first pass here allowed anything short and markup-free so
 * translated labels would not be refused, and "Diamond Unlimited Free Tier
 * Please" duly went through with a 200. Shape is not membership.
 *
 * Translations are resolved rather than tolerated. A French visitor submits
 * "Or"; the translation table already knows "Or" is what "Gold" becomes in
 * French, so the answer is mapped BACK to "Gold" and stored that way. An
 * operator reading the submission sees the same word whoever filled it in, and
 * anything that resolves to nothing is refused.
 *
 * One query, only for the fields actually answered.
 */
async function resolveChoices(
  values: Record<string, string>,
): Promise<{ values: Record<string, string> } | { errors: Record<string, string> }> {
  const submitted: string[] = [];
  for (const key of Object.keys(ALLOWED_CHOICES)) {
    if (values[key]) submitted.push(...choiceParts(values[key]));
  }
  if (!submitted.length) return { values };

  const allowedSources = new Set(Object.values(ALLOWED_CHOICES).flat());

  // value -> English source, for every translation of a label we allow.
  const backwards = new Map<string, string>();
  try {
    const rows = await prisma.translation.findMany({
      where: { value: { in: submitted }, source: { in: [...allowedSources] } },
      select: { source: true, value: true },
    });
    for (const r of rows) backwards.set(r.value, r.source);
  } catch {
    // The table is unreachable. English still resolves; a translated answer
    // will be refused rather than waved through, which is the safe direction.
  }

  const out = { ...values };
  const errors: Record<string, string> = {};

  for (const [key, allowed] of Object.entries(ALLOWED_CHOICES)) {
    const raw = out[key];
    if (!raw) continue;

    const canonical: string[] = [];
    for (const part of choiceParts(raw)) {
      if (allowed.includes(part)) {
        canonical.push(part);
        continue;
      }
      const source = backwards.get(part);
      if (source && allowed.includes(source)) {
        canonical.push(source);
        continue;
      }
      errors[key] = "That is not one of the options.";
      break;
    }
    if (!errors[key]) out[key] = canonical.join(", ");
  }

  return Object.keys(errors).length ? { errors } : { values: out };
}
