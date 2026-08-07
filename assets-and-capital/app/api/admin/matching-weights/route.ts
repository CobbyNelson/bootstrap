import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getWeights, saveWeights } from "@/lib/matching-weights";
import { revalidatePath } from "next/cache";
import { LOCALES } from "@/lib/i18n/config";

/**
 * Read and write the matching weights.
 *
 * ADMIN only, not staff. These decide which opportunities every investor is
 * shown and in what order — it is the closest thing on this platform to a
 * pricing control, and it should not be adjustable by anyone who can answer a
 * chat message.
 */
const ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }
  return NextResponse.json({ weights: await getWeights() });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  let body: { weights?: Record<string, number> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.weights || typeof body.weights !== "object") {
    return NextResponse.json({ error: "No weights supplied." }, { status: 400 });
  }

  const saved = await saveWeights(body.weights as never);

  // Marketplace pages are prerendered and carry match scores, so a weight
  // change has to drop them or the new model applies to nobody until the
  // revalidation window passes.
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/marketplace`, "page");
    revalidatePath(`/${locale}/marketplace/[slug]`, "page");
  }

  return NextResponse.json({ ok: true, weights: saved });
}
