"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2, AlertCircle } from "lucide-react";
import { isEmail, isFilled, minLen } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { useTl } from "@/components/i18n/locale-provider";

type Field = "name" | "email" | "company" | "role" | "message";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const EMPTY: Values = { name: "", email: "", company: "", role: "", message: "" };

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!isFilled(v.name)) e.name = "Please enter your name.";
  if (!isFilled(v.email)) e.email = "Please enter your email.";
  else if (!isEmail(v.email)) e.email = "Enter a valid email address.";
  if (!isFilled(v.role)) e.role = "Select an option.";
  if (!minLen(v.message, 10)) e.message = "Tell us a little more (10+ characters).";
  return e;
}

/**
 * Field error. Lives at module scope on purpose: defined inside ContactForm it
 * was a new component type on every render, so React unmounted and remounted
 * the message on each keystroke rather than updating it in place.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-brand-600">
      <AlertCircle className="h-3.5 w-3.5" /> {message}
    </p>
  );
}

export function ContactForm() {
  const tl = useTl();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [f]: e.target.value };
    setValues(next);
    if (touched[f]) setErrors(validate(next));
  };
  const blur = (f: Field) => () => {
    setTouched((t) => ({ ...t, [f]: true }));
    setErrors(validate(values));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    setTouched({ name: true, email: true, company: true, role: true, message: true });
    if (Object.keys(errs).length) return;
    setStatus("loading");
    try {
      // Integration seam: POST /api/contact (Resend email). Simulated here.
      await new Promise((r) => setTimeout(r, 900));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const base = "w-full rounded-xl border bg-paper-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2";
  const cls = (f: Field) =>
    cn(base, errors[f] && touched[f] ? "border-brand-300 focus:ring-brand-600/30" : "border-ink/10 focus:ring-brand-600/30");

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-navy-700">{tl("Message sent")}</h3>
        <p className="mt-2 text-sm text-ink/60">{tl("Thank you — our team will be in touch within one business day.")}</p>
      </div>
    );
  }

  const errorFor = (f: Field) => (touched[f] ? errors[f] : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-ink/80">{tl("Full name")}</label>
        <input id="contact-name" value={values.name} onChange={set("name")} onBlur={blur("name")} className={cls("name")} placeholder={tl("Jane Doe")} aria-invalid={!!errorFor("name")} aria-describedby={errorFor("name") ? "contact-name-error" : undefined} />
        <FieldError id="contact-name-error" message={errorFor("name")} />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-ink/80">{tl("Email")}</label>
        <input id="contact-email" type="email" value={values.email} onChange={set("email")} onBlur={blur("email")} className={cls("email")} placeholder="you@company.com" aria-invalid={!!errorFor("email")} aria-describedby={errorFor("email") ? "contact-email-error" : undefined} />
        <FieldError id="contact-email-error" message={errorFor("email")} />
      </div>
      <div>
        <label htmlFor="contact-company" className="mb-1.5 block text-sm font-medium text-ink/80">{tl("Company")}</label>
        <input id="contact-company" value={values.company} onChange={set("company")} className={cls("company")} placeholder={tl("Company name")} />
      </div>
      <div>
        <label htmlFor="contact-role" className="mb-1.5 block text-sm font-medium text-ink/80">I am a(n)</label>
        <select id="contact-role" aria-invalid={!!errorFor("role")} aria-describedby={errorFor("role") ? "contact-role-error" : undefined} value={values.role} onChange={set("role")} onBlur={blur("role")} className={cls("role")}>
          <option value="" disabled>{tl("Select…")}</option>
          <option>{tl("Investor")}</option>
          <option>{tl("Business seeking capital")}</option>
          <option>{tl("Partner / advisor")}</option>
          <option>{tl("Other")}</option>
        </select>
        <FieldError id="contact-role-error" message={errorFor("role")} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-ink/80">{tl("How can we help?")}</label>
        <textarea id="contact-message" aria-invalid={!!errorFor("message")} aria-describedby={errorFor("message") ? "contact-message-error" : undefined} value={values.message} onChange={set("message")} onBlur={blur("message")} rows={4} className={cn(cls("message"), "resize-y")} placeholder={tl("Tell us a little about what you're looking for…")} />
        <FieldError id="contact-message-error" message={errorFor("message")} />
      </div>
      {status === "error" && (
        <div className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm font-medium text-brand-700">
          <AlertCircle className="h-4 w-4" /> {tl("Something went wrong. Please try again.")}
        </div>
      )}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {status === "loading" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {tl("Sending…")}</>
          ) : (
            <>{tl("Send message")} <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </form>
  );
}
