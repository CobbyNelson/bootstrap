"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "VISITOR" | "KWAKU" | "STAFF"; body: string; createdAt: string };
type State = {
  status: "BOT" | "WAITING" | "LIVE" | "CLOSED";
  staffOnline: boolean;
  needsEmail: boolean;
  messages: Msg[];
};

/** Poll interval. Fast enough to feel live, slow enough not to hammer the box. */
const POLL_MS = 4000;

/** Turn bare URLs and "Label: /path" lines from Kwaku into real links. */
function renderBody(body: string) {
  return body.split("\n").map((line, i) => {
    const m = line.match(/^(.+?):\s(\/[^\s]*)$/);
    if (m) {
      return (
        <a key={i} href={m[2]} className="block underline underline-offset-2 hover:no-underline">
          {m[1]}
        </a>
      );
    }
    return (
      <span key={i} className="block">
        {line}
      </span>
    );
  });
}

export function ChatBox() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State | null>(null);
  const [draft, setDraft] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chat", { cache: "no-store" });
      if (res.ok) setState(await res.json());
    } catch {
      /* offline — the next poll will pick it up */
    }
  }, []);

  // Only poll while the panel is open. A closed widget quietly hitting the
  // server every few seconds on every page is a cost nobody sees until the bill.
  useEffect(() => {
    if (!open) return;
    const first = window.setTimeout(load, 0);
    const id = window.setInterval(load, POLL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [open, load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [state?.messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setBusy(true);
    setDraft("");
    // Show it immediately; the poll reconciles with the server's copy.
    setState((s) =>
      s
        ? { ...s, messages: [...s.messages, { id: `local-${Date.now()}`, role: "VISITOR", body: message, createdAt: new Date().toISOString() }] }
        : s,
    );
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (res.ok) setState(await res.json());
    } finally {
      setBusy(false);
    }
  }

  async function leaveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    if (res.ok) setState(await res.json());
  }

  async function askForPerson() {
    const res = await fetch("/api/chat", { method: "PATCH" });
    if (res.ok) setState(await res.json());
  }

  const live = state?.staffOnline ?? false;

  return (
    <>
      {/* launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Chat with Kwaku"}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-[120] inline-flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-4 text-white transition-colors hover:bg-brand-700"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="label-cta text-[0.68rem]">{open ? "Close" : "Ask Kwaku"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Chat with Kwaku"
          className="fixed bottom-20 right-5 z-[120] flex h-[min(32rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[var(--radius-button)] border border-ink/12 bg-paper"
        >
          <header className="flex flex-none items-center justify-between border-b border-ink/10 bg-navy-900 px-4 py-3 text-white">
            <div>
              <p className="label-cta text-[0.68rem]">Kwaku</p>
              <p className="mt-0.5 text-xs text-white/70">
                {state?.status === "LIVE" ? "Talking to the team" : "Assets & Capital assistant"}
              </p>
            </div>
            {/* Presence is the honest signal: derived from staff heartbeats, so
                it cannot say "live" when the desk is empty. */}
            <span className="inline-flex items-center gap-1.5 text-[0.65rem] text-white/80">
              <span className={cn("h-2 w-2 rounded-full", live ? "bg-emerald-400" : "bg-white/30")} />
              {live ? "Team online" : "Team away"}
            </span>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {(state?.messages.length ?? 0) === 0 && (
              <p className="text-sm leading-relaxed text-ink/65">
                Hello, I&apos;m Kwaku. Ask me about listing, fees, how matching works, or any business on the
                marketplace.
              </p>
            )}
            {state?.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-[var(--radius-button)] px-3 py-2 text-sm leading-relaxed",
                  m.role === "VISITOR"
                    ? "ml-auto bg-brand-600 text-white"
                    : m.role === "STAFF"
                      ? "bg-navy-900 text-white"
                      : "bg-white text-ink ring-1 ring-ink/[0.07]",
                )}
              >
                {m.role === "STAFF" && (
                  <span className="label-cta mb-1 block text-[0.6rem] text-white/70">Assets &amp; Capital team</span>
                )}
                {renderBody(m.body)}
              </div>
            ))}

            {state?.needsEmail && (
              <form onSubmit={leaveEmail} className="rounded-[var(--radius-button)] bg-white p-3 ring-1 ring-ink/[0.07]">
                <label htmlFor="chat-email" className="block text-xs font-medium text-ink">
                  Where should the team reply?
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="chat-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="min-w-0 flex-1 rounded-[var(--radius-button)] border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-[var(--radius-button)] bg-ink px-3 text-xs font-semibold text-white"
                  >
                    Send
                  </button>
                </div>
              </form>
            )}
          </div>

          <form onSubmit={send} className="flex flex-none items-center gap-2 border-t border-ink/10 bg-white px-3 py-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question…"
              aria-label="Your message"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink/50 focus:outline-none"
            />
            {state?.status === "BOT" && (
              <button
                type="button"
                onClick={askForPerson}
                className="whitespace-nowrap text-[0.65rem] font-medium text-brand-600 hover:text-brand-700"
              >
                Talk to a person
              </button>
            )}
            <button
              type="submit"
              disabled={!draft.trim() || busy}
              aria-label="Send message"
              className="grid h-9 w-9 flex-none place-items-center rounded-[var(--radius-button)] bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
