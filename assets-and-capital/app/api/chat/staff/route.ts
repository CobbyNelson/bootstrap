import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/lib/content";
import { requireStaff, visitorIsPresent } from "@/lib/chat-server";

/** The desk: every conversation that has reached a person, newest first. */
export async function GET() {
  const { ok } = await requireStaff();
  if (!ok) return NextResponse.json({ error: "Staff only." }, { status: 403 });

  const conversations = await prisma.chatConversation.findMany({
    where: { status: { in: ["WAITING", "LIVE"] } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, body: true, createdAt: true } },
      user: { select: { name: true, email: true, role: true } },
    },
  });

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      status: c.status,
      name: c.user?.name ?? c.name,
      email: c.user?.email ?? c.email,
      visitorPresent: visitorIsPresent(c.visitorSeenAt),
      updatedAt: c.updatedAt.toISOString(),
      messages: c.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    })),
  });
}

/** Staff reply. Emails it on when the visitor has already left the page. */
export async function POST(req: NextRequest) {
  const { user, ok } = await requireStaff();
  if (!ok) return NextResponse.json({ error: "Staff only." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const conversationId = String(body?.conversationId ?? "");
  const text = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
  if (!conversationId || !text) {
    return NextResponse.json({ error: "Missing conversation or message." }, { status: 400 });
  }

  const convo = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
  if (!convo) return NextResponse.json({ error: "No such conversation." }, { status: 404 });

  const message = await prisma.chatMessage.create({
    data: { conversationId, role: "STAFF", body: text, authorId: user.id },
  });
  await prisma.chatConversation.update({ where: { id: conversationId }, data: { status: "LIVE" } });

  // If they are still on the page the panel will poll this up in a second or
  // two. If they have gone, the reply would otherwise sit unread — so it is
  // emailed with a link that reopens THIS conversation.
  const present = visitorIsPresent(convo.visitorSeenAt);
  const to = convo.email;
  if (!present && to) {
    const link = `https://${SITE.domain}/chat/${convo.visitorKey}`;
    await sendEmail({
      to,
      subject: `Reply from ${SITE.name}`,
      html:
        `<p>${text.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>` +
        `<p><a href="${link}">Continue the conversation</a></p>`,
    });
    await prisma.chatMessage.update({ where: { id: message.id }, data: { emailedAt: new Date() } });
  }

  return NextResponse.json({ ok: true, emailed: !present && Boolean(to) });
}
