import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { askKwaku, KWAKU_GREETING } from "@/lib/kwaku";
import { attachVisitorCookie, getOrCreateConversation, staffOnline } from "@/lib/chat-server";

/** Shape sent to the widget. */
async function payload(conversationId: string) {
  const [conversation, messages, online] = await Promise.all([
    prisma.chatConversation.findUnique({ where: { id: conversationId } }),
    prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, body: true, createdAt: true },
    }),
    staffOnline(),
  ]);
  return {
    status: conversation?.status ?? "BOT",
    staffOnline: online,
    needsEmail: conversation?.status === "WAITING" && !conversation?.email,
    messages: messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  };
}

/** Poll: the widget asks for the thread every few seconds. */
export async function GET() {
  const convo = await getOrCreateConversation();
  const res = NextResponse.json(await payload(convo.id));
  return attachVisitorCookie(res, convo.visitorKey);
}

export async function POST(req: NextRequest) {
  const convo = await getOrCreateConversation();

  const limit = rateLimit(`chat:${convo.visitorKey}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "You are sending messages very quickly. Give it a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";

  // Leaving an address so an admin can reply later.
  if (email) {
    await prisma.chatConversation.update({ where: { id: convo.id }, data: { email } });
  }
  if (!text) {
    const res = NextResponse.json(await payload(convo.id));
    return attachVisitorCookie(res, convo.visitorKey);
  }

  const first = (await prisma.chatMessage.count({ where: { conversationId: convo.id } })) === 0;
  if (first) {
    await prisma.chatMessage.create({
      data: { conversationId: convo.id, role: "KWAKU", body: KWAKU_GREETING },
    });
  }

  await prisma.chatMessage.create({
    data: { conversationId: convo.id, role: "VISITOR", body: text },
  });

  // Once a person is involved Kwaku stays quiet — two voices answering the
  // same question is worse than a slower reply.
  const current = await prisma.chatConversation.findUnique({ where: { id: convo.id } });
  if (current?.status === "BOT") {
    const reply = askKwaku(text);
    const suffix = reply.links?.length
      ? "\n\n" + reply.links.map((l) => `${l.label}: ${l.href}`).join("\n")
      : "";

    if (reply.confident) {
      await prisma.chatMessage.create({
        data: { conversationId: convo.id, role: "KWAKU", body: reply.answer + suffix },
      });
    } else {
      const online = await staffOnline();
      const handover = online
        ? "Someone from the team is online — connecting you now."
        : "Nobody is at the desk right now, so leave your email and the team will reply there, with a link back to this conversation.";
      // Kwaku's own words when it has them. A guarded question — somebody else's
      // phone number, "should I invest in this" — knows exactly why it is being
      // handed over, and saying so is worth more than a flat "that is outside
      // what I can answer", which reads as the assistant being thick rather than
      // the answer being one we decline to give.
      await prisma.chatMessage.create({
        data: {
          conversationId: convo.id,
          role: "KWAKU",
          body: reply.answer
            ? `${reply.answer}\n\n${handover}`
            : `That is outside what I can answer from the site. ${handover}`,
        },
      });
      await prisma.chatConversation.update({
        where: { id: convo.id },
        data: { status: online ? "LIVE" : "WAITING" },
      });
    }
  }

  const res = NextResponse.json(await payload(convo.id));
  return attachVisitorCookie(res, convo.visitorKey);
}

/** Explicit "talk to a person" from the widget. */
export async function PATCH() {
  const convo = await getOrCreateConversation();
  const online = await staffOnline();
  await prisma.chatConversation.update({
    where: { id: convo.id },
    data: { status: online ? "LIVE" : "WAITING" },
  });
  await prisma.chatMessage.create({
    data: {
      conversationId: convo.id,
      role: "KWAKU",
      body: online
        ? "Connecting you to the team now."
        : "Nobody is at the desk right now. Leave your email and they will reply there.",
    },
  });
  const res = NextResponse.json(await payload(convo.id));
  return attachVisitorCookie(res, convo.visitorKey);
}
