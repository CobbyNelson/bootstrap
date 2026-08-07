import type { Metadata } from "next";
import { EventsManager } from "@/components/admin/events-manager";
import { listAdminEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Roadshows & Events · Admin" };

// The list changes as the admin edits it, so it must not be cached.
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const rows = await listAdminEvents();
  return (
    <div className="mx-auto max-w-7xl">
      <EventsManager
        events={rows.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          location: e.location,
          date: e.date.toISOString(),
        }))}
      />
    </div>
  );
}
