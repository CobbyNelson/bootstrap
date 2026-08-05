"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "VISITOR" | "KWAKU" | "STAFF"; body: string; createdAt: string };
type Convo = {
  id: string;
  status: "WAITING" | "LIVE";
  name: string | null;
  email: string | null;
  visitorPresent: boolean;
  updatedAt: string;
  messages: Msg[];
};

const POLL_MS = 5000;

export function ChatDesk() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/chat/staff", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setConvos(data.conversations);
    setActiveId((cur) => cur ?? data.conversations[0]?.id ?? null);
  }, []);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const id = window.setInterval(load, POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [load]);

  const active = convos.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.messages.length, activeId]);

  async function reply(e: React.FormEvent) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || !activeId) return;
    setDraft("");
    const res = await fetch("/api/chat/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, message }),
    });
    if (res.ok) {
      const data = await res.json();
      // Say plainly where the reply went. Staff typing into a panel the visitor
      // has already closed need to know it was emailed instead.
      setNotice(data.emailed ? "Visitor had left — reply emailed with a link back." : "");
      load();
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-3xl border border-ink/[0.07] bg-white p-3">
        <p className="label-cta px-2 py-1 text-[0.68rem] text-ink/60">
          Conversations ({convos.length})
        </p>
        {convos.length === 0 && <p className="px-2 py-4 text-sm text-ink/60">Nothing waiting.</p>}
        <ul className="mt-1 space-y-1">
          {convos.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActiveId(c.id)}
                className={cn(
                  "w-full rounded-[var(--radius-button)] px-3 py-2.5 text-left transition-colors",
                  c.id === activeId ? "bg-navy-900 text-white" : "hover:bg-paper-2",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {c.name || c.email || "Anonymous visitor"}
                  </span>
                  <span
                    className={cn(
                      "h-2 w-2 flex-none rounded-full",
                      c.visitorPresent ? "bg-emerald-500" : "bg-ink/25",
                    )}
                    title={c.visitorPresent ? "On the site now" : "Away — replies are emailed"}
                  />
                </span>
                <span className={cn("mt-0.5 block truncate text-xs", c.id === activeId ? "text-white/70" : "text-ink/60")}>
                  {c.status === "WAITING" ? "Waiting for a reply" : "Live"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-h-[28rem] flex-col rounded-3xl border border-ink/[0.07] bg-white">
        {!active ? (
          <p className="m-auto text-sm text-ink/60">Select a conversation.</p>
        ) : (
          <>
            <header className="flex flex-none items-center justify-between border-b border-ink/[0.07] px-5 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{active.name || active.email || "Anonymous visitor"}</p>
                <p className="text-xs text-ink/60">
                  {active.visitorPresent ? "On the site now" : active.email ? "Away — replies go to email" : "Away, no email left"}
                </p>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {active.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[80%] rounded-[var(--radius-button)] px-3 py-2 text-sm leading-relaxed",
                    m.role === "STAFF"
                      ? "ml-auto bg-navy-900 text-white"
                      : m.role === "KWAKU"
                        ? "bg-paper-2 text-ink"
                        : "bg-brand-600 text-white",
                  )}
                >
                  <span className="label-cta mb-1 block text-[0.58rem] opacity-70">
                    {m.role === "STAFF" ? "You" : m.role === "KWAKU" ? "Kwaku" : "Visitor"}
                  </span>
                  {m.body}
                </div>
              ))}
            </div>

            {notice && <p className="px-5 pb-2 text-xs text-brand-700">{notice}</p>}

            <form onSubmit={reply} className="flex flex-none items-center gap-2 border-t border-ink/[0.07] px-4 py-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={active.visitorPresent ? "Reply live…" : "Reply — this will be emailed"}
                aria-label="Your reply"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="label-cta rounded-[var(--radius-button)] bg-brand-600 px-4 py-2 text-[0.68rem] text-white disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
