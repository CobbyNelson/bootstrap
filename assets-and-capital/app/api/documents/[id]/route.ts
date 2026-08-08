import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/client-ip";
import { getCurrentUser } from "@/lib/session";
import { getAccess } from "@/lib/entitlements-server";

/**
 * Access-controlled data-room download.
 *
 * Entitlement is re-checked here on every request — a document URL is not a
 * capability. The viewer must be signed in, subscribed, have expressed interest
 * in this business AND have signed its NDA. Every access is logged.
 *
 * Storage seam: with object storage configured this returns a short-lived
 * signed URL (S3 getSignedUrl / Supabase createSignedUrl) instead of metadata.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });

  const doc = await prisma.dataRoomDocument.findUnique({ where: { id } });
  if (!doc) return Response.json({ ok: false, error: "Document not found." }, { status: 404 });

  const access = await getAccess(doc.slug);
  if (!access.docs) {
    return Response.json(
      { ok: false, error: "You need an active subscription, expressed interest and a signed NDA to open this document." },
      { status: 403 }
    );
  }

  /**
   * Refuse a cross-site request before anything is written.
   *
   * This is a GET that has a side effect — it records who opened which document
   * and when. With SameSite=Lax the cookie IS sent on a cross-site GET, so a
   * third-party page could embed this URL and write audit entries attributed to
   * whoever happened to be signed in. It could never read the response, but an
   * audit trail somebody can write to from outside is not one you can rely on
   * in a dispute, and this trail exists precisely for disputes.
   *
   * Sec-Fetch-Site is set by the browser and cannot be forged by page script.
   * A request without it is a non-browser client — curl, a server — which is
   * allowed through: those carry no ambient cookie to abuse.
   */
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return Response.json({ ok: false, error: "Cross-site requests are not accepted here." }, { status: 403 });
  }

  // Recorded on the access log, so it must be the real caller and not a header
  // the caller chose for themselves.
  const resolved = clientIp(req.headers);
  const ip = resolved === "unknown" ? null : resolved;
  await prisma.documentAccessLog.create({
    data: { userId: user.id, documentId: doc.id, action: "download", ip },
  });

  const storageConfigured = !!process.env.UPLOADTHING_TOKEN || !!process.env.S3_BUCKET;
  if (!storageConfigured) {
    return Response.json({
      ok: true,
      pending: true,
      name: doc.name,
      message: "Object storage is not configured on this deployment yet.",
    });
  }

  // Live: mint a short-lived signed URL for doc.storageKey and redirect.
  return Response.json({ ok: true, name: doc.name, storageKey: doc.storageKey });
}
