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
  // Whether the reply actually left the building, not merely whether we tried.
  // sendEmail never throws — it reports `skipped` with no provider configured
  // and `ok:false` when the provider refuses (an unverified sending domain is
  // a 403). Discarding that would stamp emailedAt on a message nobody received
  // and tell the desk it was delivered, which is the one thing staff cannot
  // check for themselves: they would think a waiting investor had been answered.
  let emailed = false;
  let emailError: string | undefined;

  if (!present && to) {
    const link = `https://${SITE.domain}/chat/${convo.visitorKey}`;
    const sent = await sendEmail({
      to,
      subject: `Reply from ${SITE.name}`,
      html:
        `<p>${text.replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>` +
        `<p><a href="${link}">Continue the conversation</a></p>`,
    });
    emailed = sent.ok && !sent.skipped;
    if (emailed) {
      await prisma.chatMessage.update({ where: { id: message.id }, data: { emailedAt: new Date() } });
    } else {
      emailError = sent.skipped
        ? "Email is not set up, so nothing was sent."
        : (sent.error ?? "The email provider refused the message.");
    }
  }

  // The reply itself is saved either way — it is waiting in the thread whether
  // or not the email got out, and the visitor sees it if they come back.
  return NextResponse.json({ ok: true, emailed, emailError });
}
