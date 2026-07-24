import type { Metadata } from "next";
import { Messaging } from "@/components/dashboard/messaging";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <Messaging />
    </div>
  );
}
