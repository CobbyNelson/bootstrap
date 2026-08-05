"use client";

import { useState } from "react";
import { Search, Send, Paperclip, Video, Phone, Pin, Star, CheckCheck, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { from: "me" | "them"; text: string; time: string; read?: boolean };
type Convo = { id: number; name: string; role: string; last: string; time: string; unread: number; pinned?: boolean; online?: boolean; typing?: boolean; msgs: Msg[] };

const CONVOS: Convo[] = [
  {
    id: 1, name: "Cedar Ridge IR", role: "GP · Fund IV", last: "Sharing the data room access now.", time: "9:42", unread: 2, pinned: true, online: true, typing: true,
    msgs: [
      { from: "them", text: "Thanks for expressing interest in Fund IV.", time: "9:31" },
      { from: "me", text: "Appreciate it — we like the mid-market buy-and-build thesis.", time: "9:34", read: true },
      { from: "them", text: "Great. I'll open the data room so your team can start diligence.", time: "9:40" },
      { from: "them", text: "Sharing the data room access now.", time: "9:42" },
    ],
  },
  {
    id: 2, name: "David Mensah", role: "Accra FinPay · CEO", last: "Can we schedule a call this week?", time: "8:55", unread: 0, online: true,
    msgs: [
      { from: "them", text: "Reviewed your mandate — strong fit on payments.", time: "8:50" },
      { from: "me", text: "Agreed. Let's set up a call.", time: "8:53", read: true },
      { from: "them", text: "Can we schedule a call this week?", time: "8:55" },
    ],
  },
  {
    id: 3, name: "A&C Deal Team", role: "Relationship manager", last: "Two new mandate-matched deals added.", time: "Yest", unread: 0,
    msgs: [
      { from: "them", text: "Two new mandate-matched deals added to your feed.", time: "Yest" },
    ],
  },
  {
    id: 4, name: "Marcus Lindqvist", role: "Advisory Partner", last: "The IC memo is ready for review.", time: "Mon", unread: 0,
    msgs: [{ from: "them", text: "The IC memo is ready for your review.", time: "Mon" }],
  },
];

function Avatar({ name, online }: { name: string; online?: boolean }) {
  return (
    <span className="relative grid h-10 w-10 flex-none place-items-center rounded-[var(--radius-button)] bg-gradient-to-br from-ink to-ink-2 text-xs font-semibold text-white">
      {name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
      {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />}
    </span>
  );
}

export function Messaging() {
  const [activeId, setActiveId] = useState(1);
  const [draft, setDraft] = useState("");
  const active = CONVOS.find((c) => c.id === activeId)!;

  return (
    <div className="grid h-[calc(100dvh-8rem)] grid-cols-1 overflow-hidden rounded-3xl border border-ink/[0.07] bg-white md:grid-cols-[320px_1fr]">
      {/* conversation list */}
      <div className="flex flex-col border-r border-ink/[0.07]">
        <div className="border-b border-ink/[0.06] p-4">
          <h1 className="font-display text-xl font-semibold text-navy-700">Messages</h1>
          <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-button)] bg-paper-2 px-3.5">
            <Search className="h-4 w-4 text-ink/60" />
            <input placeholder="Search conversations…" className="h-9 w-full bg-transparent text-sm text-ink placeholder:text-ink/60 focus:outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {CONVOS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn("flex w-full items-start gap-3 border-b border-ink/[0.04] px-4 py-3.5 text-left transition-colors", activeId === c.id ? "bg-brand-50/50" : "hover:bg-paper-2/50")}
            >
              <Avatar name={c.name} online={c.online} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {c.pinned && <Pin className="h-3 w-3 text-ink/30" />}
                  <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                  <span className="ml-auto text-[0.7rem] text-ink/60">{c.time}</span>
                </div>
                <p className="truncate text-xs text-ink/60">{c.role}</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className={cn("truncate text-xs", c.unread ? "font-medium text-ink/70" : "text-ink/60")}>{c.last}</p>
                  {c.unread > 0 && <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-[var(--radius-button)] bg-brand-600 px-1 text-[0.6rem] font-semibold text-white tnum">{c.unread}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* thread */}
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-ink/[0.06] p-4">
          <Avatar name={active.name} online={active.online} />
          <div>
            <p className="text-sm font-semibold text-ink">{active.name}</p>
            <p className="text-xs text-ink/60">{active.online ? "Online" : active.role}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {[Phone, Video, Star, MoreHorizontal].map((I, i) => (
              <button key={i} className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] text-ink/65 hover:bg-paper-2 hover:text-ink">
                <I className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-paper-2/30 p-5">
          {active.msgs.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm", m.from === "me" ? "bg-brand-600 text-white" : "bg-white text-ink ring-1 ring-ink/[0.06]")}>
                <p>{m.text}</p>
                <span className={cn("mt-1 flex items-center justify-end gap-1 text-[0.65rem]", m.from === "me" ? "text-white/70" : "text-ink/60")}>
                  {m.time}
                  {m.from === "me" && <CheckCheck className={cn("h-3 w-3", m.read ? "text-white" : "text-white/65")} />}
                </span>
              </div>
            </div>
          ))}
          {active.typing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/[0.06]">
                {/* Opacity pulse, not a hopping dot. Springy easing reads as
                    dated, and translating three dots to imply "typing" is the
                    tell. Fading says the same thing more quietly. */}
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-[typingPulse_1.2s_ease-in-out_infinite] rounded-full bg-ink/40 motion-reduce:animate-none"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-ink/[0.06] p-3">
          <div className="flex items-center gap-2 rounded-[var(--radius-button)] border border-ink/10 bg-paper-2/50 py-1.5 pl-2 pr-1.5">
            <button className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] text-ink/65 hover:text-ink"><Paperclip className="h-4 w-4" /></button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              className="h-9 flex-1 bg-transparent text-sm text-ink placeholder:text-ink/60 focus:outline-none"
            />
            <button className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] bg-brand-600 text-white hover:bg-brand-700"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
