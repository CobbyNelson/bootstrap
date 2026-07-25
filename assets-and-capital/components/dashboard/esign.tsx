"use client";

import { useState } from "react";
import {
  FileSignature, ShieldCheck, Clock, CheckCircle2, PenLine, Download,
  Send, Eye, Fingerprint, Lock, Calendar, MapPin, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DocStatus = "Awaiting you" | "Awaiting others" | "Completed" | "Draft";
type Signer = { name: string; role: string; status: "Signed" | "Pending" | "Viewed"; at?: string };
type Doc = {
  id: number;
  title: string;
  type: string;
  counterparty: string;
  status: DocStatus;
  updated: string;
  signers: Signer[];
};

const DOCS: Doc[] = [
  {
    id: 1, title: "Mutual Non-Disclosure Agreement", type: "NDA", counterparty: "Cedar Ridge Partners", status: "Awaiting you", updated: "10 min ago",
    signers: [
      { name: "Cedar Ridge IR", role: "Disclosing party", status: "Signed", at: "Today · 09:20 GMT" },
      { name: "Aurora Family Office", role: "Receiving party", status: "Pending" },
    ],
  },
  {
    id: 2, title: "Term Sheet — Accra FinPay Series A", type: "Term Sheet", counterparty: "Accra FinPay", status: "Awaiting others", updated: "1h ago",
    signers: [
      { name: "Aurora Family Office", role: "Lead investor", status: "Signed", at: "Today · 08:05 GMT" },
      { name: "David Mensah", role: "CEO, Accra FinPay", status: "Viewed", at: "Today · 08:40 GMT" },
    ],
  },
  {
    id: 3, title: "Subscription Agreement — Fund IV", type: "Agreement", counterparty: "Cedar Ridge Partners", status: "Completed", updated: "Yesterday",
    signers: [
      { name: "Aurora Family Office", role: "Limited partner", status: "Signed", at: "Yesterday · 16:12 GMT" },
      { name: "Cedar Ridge GP", role: "General partner", status: "Signed", at: "Yesterday · 17:44 GMT" },
    ],
  },
  {
    id: 4, title: "Data Room Access & Confidentiality", type: "NDA", counterparty: "Sahel Ventures", status: "Draft", updated: "2d ago",
    signers: [
      { name: "Aurora Family Office", role: "Recipient", status: "Pending" },
      { name: "Sahel Ventures", role: "Provider", status: "Pending" },
    ],
  },
];

const STATUS_STYLE: Record<DocStatus, string> = {
  "Awaiting you": "bg-brand-50 text-brand-700 ring-brand-100",
  "Awaiting others": "bg-amber-50 text-amber-700 ring-amber-100",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Draft: "bg-ink/[0.05] text-ink/65 ring-ink/10",
};

const AUDIT = [
  { icon: Send, label: "Envelope created and sent", who: "A&C Deal Team", meta: "Today · 09:02 GMT", ip: "102.89.x.x" },
  { icon: Eye, label: "Document viewed", who: "Cedar Ridge IR", meta: "Today · 09:15 GMT", ip: "51.140.x.x" },
  { icon: PenLine, label: "Signed with drawn signature", who: "Cedar Ridge IR", meta: "Today · 09:20 GMT", ip: "51.140.x.x" },
  { icon: Fingerprint, label: "Identity verified (email + SMS OTP)", who: "System", meta: "Today · 09:20 GMT", ip: "—" },
];

export function ESign() {
  const [activeId, setActiveId] = useState(1);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const active = DOCS.find((d) => d.id === activeId)!;
  const isSignable = active.status === "Awaiting you" && !signed;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Documents &amp; e-signature</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-navy-700">Agreements</h1>
          <p className="mt-1 text-sm text-ink/65">Legally-binding e-signature with tamper-evident audit trail</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
          <ShieldCheck className="h-3.5 w-3.5" /> eIDAS &amp; ESIGN compliant
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* list */}
        <div className="space-y-2">
          {DOCS.map((d) => (
            <button
              key={d.id}
              onClick={() => { setActiveId(d.id); setSigned(false); setSigning(false); }}
              className={cn("w-full rounded-2xl border bg-white p-4 text-left transition-colors", activeId === d.id ? "border-brand-200 ring-1 ring-brand-100" : "border-ink/[0.07] hover:border-ink/15")}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <FileSignature className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{d.title}</p>
                  <p className="truncate text-xs text-ink/65">{d.type} · {d.counterparty}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={cn("rounded-full px-2 py-0.5 text-[0.7rem] font-medium ring-1", STATUS_STYLE[d.id === activeId && signed ? "Completed" : d.status])}>
                      {d.id === activeId && signed ? "Completed" : d.status}
                    </span>
                    <span className="text-[0.7rem] text-ink/60">{d.updated}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* detail */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
            {/* document preview */}
            <div className="relative border-b border-ink/[0.06] bg-paper-2/40 p-8">
              <div className="mx-auto max-w-lg rounded-xl border border-ink/10 bg-white p-8 shadow-sm">
                <p className="text-center font-display text-lg font-semibold text-navy-700">{active.title}</p>
                <p className="mt-1 text-center text-xs text-ink/60">Between Aurora Family Office and {active.counterparty}</p>
                <div className="mt-6 space-y-2">
                  {[100, 92, 96, 70, 88, 60].map((w, i) => (
                    <div key={i} className="h-2 rounded-full bg-ink/[0.06]" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  {active.signers.map((s, i) => (
                    <div key={i} className={cn("rounded-lg border-2 border-dashed p-3", s.status === "Signed" ? "border-emerald-300 bg-emerald-50/40" : "border-brand-300 bg-brand-50/30")}>
                      <p className="text-[0.65rem] uppercase tracking-wider text-ink/60">Signature</p>
                      {s.status === "Signed" || (i === 1 && signed) ? (
                        <p className="mt-1 font-display text-base italic text-navy-700">{s.name.split(" ").slice(0, 2).join(" ")}</p>
                      ) : (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-600"><PenLine className="h-3.5 w-3.5" /> Sign here</p>
                      )}
                      <p className="mt-1 truncate text-[0.65rem] text-ink/60">{s.role}</p>
                    </div>
                  ))}
                </div>
              </div>
              {signing && !signed && (
                <div className="absolute inset-0 grid place-items-center bg-ink/40 p-6 backdrop-blur-sm">
                  <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                    <p className="font-display text-lg font-semibold text-navy-700">Adopt your signature</p>
                    <p className="mt-1 text-xs text-ink/65">Drawn signature is bound to your verified identity.</p>
                    <div className="mt-4 grid h-24 place-items-center rounded-xl border border-ink/10 bg-paper-2/50">
                      <span className="font-display text-2xl italic text-navy-700">Aurora Family Office</span>
                    </div>
                    <label className="mt-3 flex items-start gap-2 text-xs text-ink/60">
                      <input type="checkbox" defaultChecked className="mt-0.5 accent-[var(--color-brand-600)]" />
                      I agree this electronic signature is the legal equivalent of my handwritten signature.
                    </label>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setSigning(false)} className="flex-1 rounded-full border border-ink/12 py-2.5 text-sm font-medium text-ink/70 hover:bg-paper-2">Cancel</button>
                      <button onClick={() => { setSigning(false); setSigned(true); }} className="flex-1 rounded-full bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Adopt &amp; sign</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* action bar */}
            <div className="flex flex-wrap items-center gap-3 p-4">
              {isSignable ? (
                <button onClick={() => setSigning(true)} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
                  <PenLine className="h-4 w-4" /> Review &amp; sign
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> {signed || active.status === "Completed" ? "You have signed" : "No action required"}
                </span>
              )}
              <button className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/70 hover:bg-paper-2"><Download className="h-4 w-4" /> Download</button>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-ink/60"><Lock className="h-3.5 w-3.5" /> 256-bit encrypted</div>
            </div>
          </div>

          {/* signer status */}
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
            <h2 className="font-display text-base font-semibold text-navy-700">Signer status</h2>
            <div className="mt-4 space-y-3">
              {active.signers.map((s, i) => {
                const done = s.status === "Signed" || (i === 1 && signed);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn("grid h-8 w-8 flex-none place-items-center rounded-full text-xs font-semibold", done ? "bg-emerald-100 text-emerald-700" : "bg-ink/[0.06] text-ink/65")}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{s.name}</p>
                      <p className="text-xs text-ink/65">{s.role}</p>
                    </div>
                    <span className="text-right text-xs text-ink/60">
                      {done ? (s.at ?? "Just now") : s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* audit trail */}
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-brand-600" />
              <h2 className="font-display text-base font-semibold text-navy-700">Certificate of completion</h2>
            </div>
            <div className="mt-3 grid gap-3 rounded-2xl bg-paper-2/50 p-4 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-xs text-ink/60"><Hash className="h-3.5 w-3.5 text-ink/60" /> Envelope AC-8F3K-2291</div>
              <div className="flex items-center gap-2 text-xs text-ink/60"><Calendar className="h-3.5 w-3.5 text-ink/60" /> Created {active.updated}</div>
              <div className="flex items-center gap-2 text-xs text-ink/60"><MapPin className="h-3.5 w-3.5 text-ink/60" /> Region: EU-West</div>
            </div>
            <ol className="mt-5 relative space-y-4 border-l border-ink/[0.08] pl-5">
              {AUDIT.map((a, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[1.7rem] grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-brand-50 text-brand-600">
                    <a.icon className="h-3 w-3" />
                  </span>
                  <p className="text-sm font-medium text-ink">{a.label}</p>
                  <p className="mt-0.5 text-xs text-ink/60">{a.who} · {a.meta} · IP {a.ip}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
