import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ChatBox } from "@/components/chat/chat-box";

/**
 * Kwaku is here as well as on the public site. A signed-in investor or business
 * asking how the data room opens, or what the success fee applies to, is asking
 * the same questions a visitor does — and their conversation carries the
 * account, so staff can see who they are talking to.
 *
 * Not in the (admin) layout: staff answer chats there, and giving them the
 * visitor widget alongside the desk would let them open a conversation with
 * themselves.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      {/* Outside the shell, not inside its content column. The launcher is
          position:fixed, and a transform, filter or overflow added to that
          column later would silently trap or clip it — a failure that shows up
          as "the chat button vanished" long after the change that caused it. */}
      <ChatBox />
    </>
  );
}
