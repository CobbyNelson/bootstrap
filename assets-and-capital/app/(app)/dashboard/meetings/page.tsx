import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getMyMeetings } from "@/lib/meetings";
import { MeetingList } from "@/components/dashboard/meeting-list";

export const metadata: Metadata = { title: "Meetings" };

/**
 * The account's real meetings.
 *
 * A page at this path existed before and was deleted, because it was built
 * entirely from a MEETINGS constant — invented calls, a provider dropdown that
 * changed nothing, and time slots nobody could book. Deleting it was right at
 * the time: there was no model behind it. This is the same route with something
 * behind it.
 */
export default async function MeetingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/meetings");

  const [upcoming, past] = await Promise.all([
    getMyMeetings(user),
    getMyMeetings(user, { past: true }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">Workspace</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Meetings</h1>
        <p className="mt-1 text-sm text-ink/65">
          Calls our team has arranged for you. Introductions are brokered rather than self-served, so these are
          scheduled by us once both sides have agreed.
        </p>
      </div>

      <div className="rounded-3xl border border-ink/[0.07] bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-navy-700">Upcoming</h2>
        <MeetingList meetings={upcoming} viewerId={user.id} />
      </div>

      {past.length > 0 && (
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy-700">Past</h2>
          <MeetingList meetings={past} viewerId={user.id} />
        </div>
      )}
    </div>
  );
}
