"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, Check, Cloud, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeaturedImageUpload } from "./featured-image-upload";

type FieldType = "text" | "email" | "tel" | "textarea" | "select" | "chips";
type Field = { name: string; label: string; type: FieldType; options?: string[]; placeholder?: string; required?: boolean; span?: 1 | 2 };
type Step = { id: string; title: string; subtitle?: string; fields: Field[] };

const REGIONS = ["East Africa", "West Africa", "North Africa", "Southern Africa", "North America", "Europe", "Middle East", "Asia Pacific"];

const STEPS: Step[] = [
  {
    id: "company", title: "Company & contact", subtitle: "Tell us about your business.",
    fields: [
      { name: "companyName", label: "Company name", type: "text", required: true, span: 2 },
      { name: "hqCountry", label: "Headquarters country", type: "text", required: true },
      { name: "region", label: "Region", type: "select", options: REGIONS, required: true },
      { name: "website", label: "Website / social media", type: "text", placeholder: "https://" },
      { name: "founded", label: "Date founded", type: "text", placeholder: "e.g. 2019" },
      { name: "legalStructure", label: "Legal structure", type: "select", options: ["LLC", "C-Corp", "Ltd", "PLC", "Partnership", "Other"] },
      { name: "founders", label: "Founders & key contacts (with roles)", type: "textarea", span: 2, placeholder: "Name — Role" },
      { name: "contactName", label: "Contact person", type: "text", required: true },
      { name: "contactEmail", label: "Contact email", type: "email", required: true },
      { name: "contactPhone", label: "Contact phone", type: "tel" },
    ],
  },
  {
    id: "ask", title: "The ask", subtitle: "Your investment requirement.",
    fields: [
      { name: "purpose", label: "Purpose of investment", type: "textarea", required: true, span: 2, placeholder: "What will the capital be used for?" },
      { name: "amount", label: "Amount needed (USD)", type: "text", required: true, placeholder: "$" },
      { name: "instrument", label: "Required instrument", type: "chips", span: 2, options: ["Debt", "Equity", "Preferred Share"], required: true },
      { name: "equityStake", label: "Equity stake offered (%)", type: "text", placeholder: "%" },
      { name: "returnOffer", label: "Return offer (%)", type: "text", placeholder: "%" },
    ],
  },
  {
    id: "services", title: "Services & listing", subtitle: "How can we help you raise?",
    fields: [
      { name: "listingTier", label: "Listing tier", type: "select", required: true, options: ["Standard", "Silver", "Gold", "Platinum"] },
      { name: "services", label: "Add services", type: "chips", span: 2, options: ["Basic Teaser Preparation", "Business Plan Writing", "Financial Reporting Services", "Shadow Investor Search", "Investor Roadshow"] },
    ],
  },
];

type Values = Record<string, string | string[]>;
const STORAGE_KEY = "ac_business_intake_v1";

export function BusinessIntake() {
  const [values, setValues] = useState<Values>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        /* Seeding editable form state from a saved draft. Not a mirror of an
           external store (the user edits it afterwards), so useSyncExternalStore
           does not apply; lazy-initialising would mean rendering the wizard
           client-only, putting a skeleton flash in front of the registration
           funnel. Deliberate — the directive must sit on the line directly
           above the call, so the reasoning lives here instead. */
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValues(p.values ?? {});
        setStepIndex(p.stepIndex ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (Object.keys(values).length === 0) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, stepIndex }));
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [values, stepIndex]);

  const progress = Math.round(((stepIndex + 1) / (STEPS.length + 1)) * 100);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  function setField(name: string, value: string | string[]) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: false }));
  }
  function toggleChip(name: string, opt: string) {
    setValues((v) => {
      const cur = Array.isArray(v[name]) ? (v[name] as string[]) : [];
      const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
      return { ...v, [name]: next };
    });
    setErrors((e) => ({ ...e, [name]: false }));
  }
  function validate(): boolean {
    const next: Record<string, boolean> = {};
    let ok = true;
    for (const f of step.fields) {
      if (!f.required) continue;
      const val = values[f.name];
      const empty = f.type === "chips" ? !Array.isArray(val) || val.length === 0 : !val;
      if (empty) {
        next[f.name] = true;
        ok = false;
      }
    }
    setErrors((e) => ({ ...e, ...next }));
    return ok;
  }
  function next() {
    if (!validate()) return;
    if (isLast) {
      if (consent) setSubmitted(true);
      return;
    }
    setStepIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <div className="container-x py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-ink/[0.07] bg-white p-10 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <PartyPopper className="h-7 w-7" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-navy-700">Listing submitted</h2>
          <p className="mt-3 text-ink/60">
            Thank you. Our team will review your business and reach out to confirm your listing and any services you
            selected. We&apos;ll then start putting your opportunity in front of the right investors.
          </p>
          <Link href="/marketplace" className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700">
            See the marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[240px_1fr] md:py-16">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4 flex items-center justify-between text-xs text-ink/65">
          <span>Progress</span>
          <span className="tnum">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-6 space-y-1">
          {STEPS.map((s, i) => {
            const state = i < stepIndex ? "done" : i === stepIndex ? "now" : "todo";
            return (
              <li key={s.id} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm", state === "now" ? "bg-brand-50 font-medium text-ink" : "text-ink/65")}>
                <span className={cn("grid h-6 w-6 place-items-center rounded-[var(--radius-button)] text-xs", state === "done" && "bg-emerald-500 text-white", state === "now" && "bg-brand-600 text-white", state === "todo" && "border border-ink/20 text-ink/60")}>
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {s.title}
              </li>
            );
          })}
        </ol>
      </aside>

      <div>
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-[var(--shadow-soft)] md:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-navy-700">{step.title}</h2>
              {step.subtitle && <p className="mt-1.5 text-sm text-ink/65">{step.subtitle}</p>}
            </div>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-opacity", saved ? "bg-emerald-50 text-emerald-700 opacity-100" : "text-ink/30 opacity-0")}>
              <Cloud className="h-3.5 w-3.5" /> Saved
            </span>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {step.fields.map((f) => {
              const wrap = f.span === 2 || f.type === "chips" || f.type === "textarea" ? "sm:col-span-2" : "";
              const err = errors[f.name];
              const base = "w-full rounded-xl border bg-paper-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-brand-600/30";
              const border = err ? "border-brand-400" : "border-ink/10";
              const val = values[f.name];
              return (
                <div key={f.name} className={wrap}>
                  <label className="mb-1.5 block text-sm font-medium text-ink/80">
                    {f.label} {f.required && <span className="text-brand-600">*</span>}
                  </label>
                  {f.type === "chips" ? (
                    <div className="flex flex-wrap gap-2">
                      {f.options!.map((opt) => {
                        const on = Array.isArray(val) && val.includes(opt);
                        return (
                          <button key={opt} type="button" onClick={() => toggleChip(f.name, opt)} className={cn("rounded-[var(--radius-button)] border px-3.5 py-1.5 text-sm transition-colors", on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/12 text-ink/60 hover:border-ink/25")}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : f.type === "select" ? (
                    <select value={(val as string) ?? ""} onChange={(e) => setField(f.name, e.target.value)} className={cn(base, border)}>
                      <option value="" disabled>Select…</option>
                      {f.options!.map((o) => (<option key={o} value={o}>{o}</option>))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea value={(val as string) ?? ""} onChange={(e) => setField(f.name, e.target.value)} placeholder={f.placeholder} rows={3} className={cn(base, border, "resize-y")} />
                  ) : (
                    <input type={f.type} value={(val as string) ?? ""} onChange={(e) => setField(f.name, e.target.value)} placeholder={f.placeholder} className={cn(base, border)} />
                  )}
                  {err && <p className="mt-1 text-xs text-brand-600">This field is required.</p>}
                </div>
              );
            })}
          </div>

          {isLast && (
            <FeaturedImageUpload
              value={(values.featuredImage as string) || null}
              companyName={(values.companyName as string) || ""}
              onUploaded={(src) => setField("featuredImage", src)}
            />
          )}

          {isLast && (
            <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl bg-paper-2/60 p-4 text-sm text-ink/70">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
              <span>I confirm the information provided is accurate and I consent to Assets &amp; Capital reviewing and listing my business.</span>
            </label>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-ink/[0.06] pt-6">
            <button onClick={() => setStepIndex((i) => Math.max(0, i - 1))} disabled={stepIndex === 0} className="inline-flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={next} disabled={isLast && !consent} className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50">
              {isLast ? "Submit listing" : "Continue"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
