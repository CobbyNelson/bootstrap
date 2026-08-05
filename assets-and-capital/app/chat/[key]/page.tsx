import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { VISITOR_COOKIE } from "@/lib/chat-server";

/**
 * The link in an emailed reply.
 *
 * Re-attaches the visitor's cookie so the widget reopens THAT conversation
 * rather than starting a blank one — otherwise a reply sent by email leads to
 * a chat with no history, which reads as the team having lost the thread.
 *
 * The key is an unguessable UUID and carries no privileges beyond resuming the
 * conversation it belongs to.
 */
export default async function ResumeChatPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const convo = await prisma.chatConversation.findUnique({ where: { visitorKey: key }, select: { id: true } });

  if (convo) {
    const jar = await cookies();
    jar.set(VISITOR_COOKIE, key, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  redirect("/?chat=1");
}
