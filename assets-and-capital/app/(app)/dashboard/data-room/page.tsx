import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getDataRooms } from "@/lib/portal-queries";
import { formatDate } from "@/lib/dates";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Data rooms" };

/**
 * The data rooms this account has unlocked.
 *
 * The page listed six documents with sizes and download counts, a table of
 * "access grants" naming four other firms, and an audit trail of who had
 * viewed what — all constants, and the access-grant table in particular was a
 * list of other investors' activity shown to whoever opened the page.
 *
 * Access is real: it is the NDA signature, written by `signNda`. The contents
 * are not — nothing in the platform uploads a document yet — so each room
 * honestly reports what it holds instead of naming files that do not exist.
 */
export default async function DataRoomPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/data-room");

  const rooms = await getDataRooms(user);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">Workspace</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Data rooms</h1>
        <p className="mt-1 text-sm text-ink/65">Businesses whose data room you have unlocked.</p>
      </div>

      {rooms.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="No data rooms yet"
          description="Sign a business's NDA from its marketplace listing to unlock its data room. It will appear here."
          action={{ label: "Browse the marketplace", href: "/marketplace" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map((r) => (
            <Link
              key={r.slug}
              href={`/marketplace/${r.slug}`}
              className="rounded-3xl border border-ink/[0.07] bg-white p-5 transition-colors hover:border-ink/20"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Lock className="h-[18px] w-[18px]" />
              </span>
              <p className="mt-3 font-medium text-ink">{r.name}</p>
              <p className="mt-0.5 text-xs text-ink/65">Unlocked {formatDate(r.signedAt, "en")}</p>
              <p className="mt-3 flex items-center gap-1.5 border-t border-ink/[0.06] pt-3 text-sm text-ink/65">
                <FileText className="h-3.5 w-3.5" />
                {r.docs === 0 ? "No documents published yet" : `${r.docs} document${r.docs === 1 ? "" : "s"}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
