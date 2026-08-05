import { NextResponse } from "next/server";
import { get } from "@/lib/media-store";

/**
 * Serve a stored image.
 *
 * Public and unauthenticated by design — these are marketing images referenced
 * from public pages. Nothing sensitive belongs in this store; data-room
 * documents have their own gated route.
 *
 * Immutable caching is safe because a stored key never changes content: an
 * edited image is a new upload with a new key.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const data = await get(key.join("/"));

  if (!data) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
