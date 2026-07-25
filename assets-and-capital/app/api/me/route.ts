import { getCurrentUser } from "@/lib/session";

// Lightweight session probe for client components (e.g. the navbar) so pages
// stay statically rendered instead of opting into dynamic rendering globally.
export async function GET() {
  const user = await getCurrentUser();
  return Response.json({ user });
}
