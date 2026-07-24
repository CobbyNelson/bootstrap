import type { Metadata } from "next";
import { Meetings } from "@/components/dashboard/meetings";

export const metadata: Metadata = { title: "Video Meetings" };

export default function MeetingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <Meetings />
    </div>
  );
}
