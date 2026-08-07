import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getThread } from "@/lib/portal-queries";
import { formatDate, relativeTime } from "@/lib/dates";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

/**
 * The account's real conversation with the deal team.
 *
 * This page rendered three invented threads — "Sahara Solar Grid", "A&C Deal
 * Team", "Lagos HealthTech" — with a composer that dropped whatever was typed
 * into it.
 *
 * The obvious model to wire it to, `Message`, has a threadId and a sender but
 * no recipient, so there is no way to ask which threads are yours; nothing has
 * ever written a row to it either. What does exist is the account's chat with
 * the A&C team, which staff answer from the admin desk — and that is the real
 * channel, since A&C brokers introductions rather than putting investors and
 * businesses into a DM.
 *
 * Replying happens in the chat launcher that is already on every portal page,
 * so there is no second composer here writing to a different table.
 */
export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/messages");

  const thread = await getThread(user);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-ink/65">Workspace</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Messages</h1>
        <p className="mt-1 text-sm text-ink/65">Your conversation with the Assets &amp; Capital deal team.</p>
      </div>

      {thread.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Start a conversation with the deal team using the chat button in the corner — introductions to businesses and investors are arranged through us."
        />
      ) : (
        <div className="space-y-4 rounded-3xl border border-ink/[0.07] bg-white p-5 sm:p-6">
          {thread.map((m) => (
            <div key={m.id} className={cn("flex", m.from === "you" ? "justify-end" : "justify-start")}>
              <div className="max-w-[80%]">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.from === "you" ? "bg-brand-600 text-white" : "bg-paper-2 text-ink",
                  )}
                >
                  {m.body}
                </div>
                <p
                  className={cn("mt-1 text-[0.7rem] text-ink/55", m.from === "you" ? "text-right" : "text-left")}
                  title={formatDate(m.at, "en")}
                >
                  {m.from === "you" ? "You" : "A&C team"} · {relativeTime(m.at)}
                </p>
              </div>
            </div>
          ))}
          <p className="border-t border-ink/[0.06] pt-4 text-xs text-ink/60">
            Reply using the chat button in the corner of the screen.
          </p>
        </div>
      )}
    </div>
  );
}
