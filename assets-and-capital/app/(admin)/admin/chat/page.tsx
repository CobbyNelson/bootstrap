import type { Metadata } from "next";
import { ChatDesk } from "@/components/admin/chat-desk";

export const metadata: Metadata = { title: "Live chat" };

export default function AdminChatPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-700">Live chat</h1>
        <p className="mt-1 text-sm text-ink/65">
          Conversations Kwaku handed over. A green dot means the visitor is still on the site; otherwise your
          reply is emailed to them with a link back into the same thread.
        </p>
      </div>
      <ChatDesk />
    </div>
  );
}
