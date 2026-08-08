"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTl } from "@/components/i18n/locale-provider";
import { Conversation, HONEYPOT_KEY, type Question } from "@/components/forms/conversation";
import { CONTACT_SCHEMA } from "@/lib/intake-schema";

/**
 * The contact form, asked one question at a time.
 *
 * It was five fields in a stack with a submit button underneath — the shape of
 * a form, not of somebody telling us what they need. The questions, the
 * validation and the payload are unchanged; only the asking is.
 *
 * The old grouping survives as the section label above each question, so the
 * structure a visitor used to see laid out at once is still visible, one step
 * at a time, with a progress hairline counting across all five.
 */
export function ContactForm() {
  const tl = useTl();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  // Same rules as the stacked form had, moved next to the question they judge.
  const QUESTIONS: Question[] = [
    {
      key: "name", rule: CONTACT_SCHEMA.name,
      section: tl("About you"),
      ask: tl("Who are we speaking with?"),
      placeholder: tl("Your full name"),
      autoComplete: "name",
      accept: "name",
      validate: (v) => (v ? null : tl("Please enter your name.")),
    },
    {
      key: "email", rule: CONTACT_SCHEMA.email,
      section: tl("About you"),
      ask: tl("Where should we reply?"),
      hint: tl("We answer by email, usually within a working day."),
      placeholder: "you@company.com",
      type: "email",
      autoComplete: "email",
      accept: "email",
      validate: (v) => (v ? null : tl("Please enter your email.")),
    },
    {
      key: "role", rule: CONTACT_SCHEMA.role,
      section: tl("About you"),
      ask: tl("Which of these sounds like you?"),
      // A single choice, so the tap is the answer — there is nothing to type
      // and no reason to make them confirm it.
      choices: [tl("Investor"), tl("Business seeking capital"), tl("Partner / advisor"), tl("Other")],
      validate: (v) => (v ? null : tl("Select an option.")),
    },
    {
      key: "company", accept: "company", rule: CONTACT_SCHEMA.company,
      section: tl("About you"),
      ask: tl("And your company?"),
      placeholder: tl("Company name"),
      autoComplete: "organization",
      optional: true,
    },
    {
      key: "message", accept: "text", rule: CONTACT_SCHEMA.message,
      section: tl("What you need"),
      ask: tl("What can we help with?"),
      hint: tl("The more you tell us, the better we can point you at the right person."),
      placeholder: tl("A few lines is plenty."),
      multiline: true,
      validate: (v) => (v ? null : tl("Tell us what you need.")),
    },
  ];

  async function submit(values: Record<string, string>) {
    // A bot filled the hidden field. It gets the same thank-you and nothing is
    // sent — telling it otherwise only teaches it what to change.
    if (values[HONEYPOT_KEY]) {
      setStatus("done");
      return;
    }
    setStatus("loading");
    try {
      // The server checks all of this again against the same schema. What it
      // sends back on a rejection is deliberately not shown field-by-field:
      // anything the server refuses, the form already refused, so a message
      // here would mean the two have drifted.
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Conversation
      questions={QUESTIONS}
      onComplete={submit}
      submitting={status === "loading"}
      title={tl("Send us a note")}
      intro={tl("Five questions. We reply by email, usually within a working day.")}
      submitLabel={tl("Send")}
      error={status === "error" ? tl("Something went wrong. Please try again.") : null}
      done={
        status === "done" ? (
          <div className="py-10 text-center" role="status">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Check className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold text-navy-700">{tl("Thank you — message received.")}</h2>
            <p className="mt-2 text-sm text-ink/65">{tl("We'll reply by email, usually within a working day.")}</p>
          </div>
        ) : null
      }
    />
  );
}
