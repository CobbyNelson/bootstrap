import type { Metadata } from "next";
import { MeetingDesk } from "@/components/admin/meeting-desk";

export const metadata: Metadata = { title: "Meetings" };

export default function AdminMeetingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">Administration</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Meetings</h1>
        <p className="mt-1 text-sm text-ink/65">
          Introductions are brokered here rather than self-served, so a meeting only exists once someone on the
          desk has arranged it.
        </p>
      </div>
      <MeetingDesk />
    </div>
  );
}
