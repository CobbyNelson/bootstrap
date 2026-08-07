import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Transactional email. Uses Resend when RESEND_API_KEY is set; otherwise logs
 * and reports "skipped" so flows work in environments without email configured
 * (never throws into a user action).
 */
export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

/**
 * Record the attempt. Never let recording break the send.
 *
 * A mail log that can throw turns a logging problem into a failed registration,
 * which is the wrong way round: the email matters and the record of it does
 * not. No body is stored — a transactional email contains the reader's own
 * details, and keeping a copy turns this into a personal-data store with its
 * own retention question.
 */
async function record(to: string, subject: string, status: string, error?: string) {
  try {
    await prisma.emailLog.create({ data: { to, subject, status, error: error ?? null } });
  } catch {
    /* the send is what matters */
  }
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Assets & Capital <info@assetsandcapitalltd.com>";
  if (!key) {
    console.info(`[email skipped: no RESEND_API_KEY] to=${input.to} subject=${input.subject}`);
    await record(input.to, input.subject, "skipped");
    return { ok: true, skipped: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("sendEmail failed", res.status, body);
      await record(input.to, input.subject, "failed", `Provider returned ${res.status}`);
      return { ok: false, error: `Email provider returned ${res.status}` };
    }
    await record(input.to, input.subject, "sent");
    return { ok: true };
  } catch (e) {
    console.error("sendEmail threw", e);
    await record(input.to, input.subject, "failed", "Could not reach the provider");
    return { ok: false, error: "Could not reach the email provider." };
  }
}

const shell = (body: string) =>
  `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#10141c">
     ${body}
     <hr style="border:none;border-top:1px solid #e6e9ef;margin:24px 0" />
     <p style="font-size:12px;color:#6b7280">Assets &amp; Capital — connecting quality assets with ready capital.</p>
   </div>`;

export const emails = {
  welcome: (name: string | null) => ({
    subject: "Welcome to Assets & Capital",
    html: shell(
      `<h2>Welcome${name ? `, ${name}` : ""}</h2>
       <p>Your account is ready. Set your investment mandate to start receiving mandate-matched opportunities.</p>`
    ),
  }),
  interestExpressed: (business: string) => ({
    subject: `Your interest in ${business}`,
    html: shell(
      `<h2>Interest recorded</h2>
       <p>We've recorded your interest in <strong>${business}</strong>. Sign the NDA to open the data room and see your match breakdown.</p>`
    ),
  }),
  paymentReceipt: (plan: string, amount: string, reference: string) => ({
    subject: `Receipt — ${plan}`,
    html: shell(
      `<h2>Payment received</h2>
       <p>Plan: <strong>${plan}</strong><br/>Amount: <strong>${amount}</strong><br/>Reference: ${reference}</p>`
    ),
  }),
  commitmentReceived: (business: string, amount: string) => ({
    subject: `Commitment received — ${business}`,
    html: shell(
      `<h2>Commitment received</h2>
       <p>We've recorded your soft commitment of <strong>${amount}</strong> to <strong>${business}</strong>.
          Our team will confirm allocation and send the subscription agreement.</p>`
    ),
  }),
};
