import type { Metadata } from "next";
import { EventsManager } from "@/components/admin/events-manager";

export const metadata: Metadata = { title: "Roadshows & Events · Admin" };

export default function AdminEventsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <EventsManager />
    </div>
  );
}
