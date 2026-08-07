import type { Metadata } from "next";
import { EmailAutomation } from "@/components/admin/email-automation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Email · Admin" };

// Counts change as mail goes out, so this must not be served from a cache.
export const dynamic = "force-dynamic";

export default async function AdminEmailPage() {
  const [byStatus, recent] = await Promise.all([
    prisma.emailLog.groupBy({ by: ["status"], _count: { _all: true } }).catch(() => []),
    prisma.emailLog
      .findMany({
        select: { id: true, to: true, subject: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
      .catch(() => []),
  ]);

  const count = (s: string) => byStatus.find((r) => r.status === s)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-7xl">
      <EmailAutomation
        stats={{
          sent: count("sent"),
          failed: count("failed"),
          skipped: count("skipped"),
          configured: Boolean(process.env.RESEND_API_KEY),
          from: process.env.EMAIL_FROM || "hello@assetsandcapitalltd.com",
          recent,
        }}
      />
    </div>
  );
}
