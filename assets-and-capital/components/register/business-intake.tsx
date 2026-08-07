"use client";

import Link from "next/link";
import { useState } from "react";
import { PartyPopper } from "lucide-react";
import { useTl } from "@/components/i18n/locale-provider";
import { Conversation, HONEYPOT_KEY, type Question } from "@/components/forms/conversation";
import { FeaturedImageUpload } from "./featured-image-upload";

/**
 * The business intake, asked one question at a time.
 *
 * It was three pages of grids — eleven fields on the first alone — which is
 * what a company fills in to be listed, and reads like a filing. The questions,
 * their order, their grouping and what counts as required are unchanged; only
 * the asking is.
 *
 * THE PAGINATION AND STRUCTURE SURVIVE. Each question still carries the step it
 * belonged to as its section label — Company & contact, The ask, Services &
 * listing — so the three-part shape is still visible, and the counter runs
 * across the whole thing rather than resetting per page.
 *
 * The draft still persists, which matters more here than anywhere else on the
 * site: this asks for figures somebody has to go and look up.
 */
const REGIONS = ["East Africa", "West Africa", "North Africa", "Southern Africa", "North America", "Europe", "Middle East", "Asia Pacific"];
const STORAGE_KEY = "ac_business_intake_v2";

export function BusinessIntake() {
  const tl = useTl();
  const [submitted, setSubmitted] = useState(false);

  const S1 = tl("Company & contact");
  const S2 = tl("The ask");
  const S3 = tl("Services & listing");

  const required = (msg: string) => (v: string) => (v ? null : msg);

  const QUESTIONS: Question[] = [
    // ── Company & contact
    {
      key: "companyName", section: S1,
      ask: tl("What is your company called?"),
      placeholder: tl("Registered company name"),
      autoComplete: "organization",
      validate: required(tl("We need the company name.")),
    },
    {
      key: "hqCountry", section: S1,
      ask: tl("Where is it headquartered?"),
      placeholder: tl("Country"),
      autoComplete: "country-name",
      validate: required(tl("We need the country.")),
    },
    {
      key: "region", section: S1,
      ask: tl("Which region does that fall in?"),
      choices: REGIONS.map((r) => tl(r)),
      validate: required(tl("Choose a region.")),
    },
    {
      key: "website", section: S1,
      ask: tl("Where can we see you online?"),
      hint: tl("A website, or the social account you are most active on."),
      placeholder: "https://",
      optional: true,
    },
    {
      key: "founded", section: S1,
      ask: tl("When was the company founded?"),
      placeholder: tl("e.g. 2019"),
      optional: true,
    },
    {
      key: "legalStructure", section: S1,
      ask: tl("How is it structured?"),
      choices: ["LLC", "C-Corp", "Ltd", "PLC", tl("Partnership"), tl("Other")],
      optional: true,
    },
    {
      key: "founders", section: S1,
      ask: tl("Who founded it, and who else should we know?"),
      hint: tl("Name and role, one per line."),
      placeholder: tl("Name — Role"),
      multiline: true,
      optional: true,
    },
    {
      key: "contactName", section: S1,
      ask: tl("Who should we deal with?"),
      placeholder: tl("Full name"),
      autoComplete: "name",
      validate: required(tl("We need a contact name.")),
    },
    {
      key: "contactEmail", section: S1,
      ask: tl("And their email?"),
      placeholder: "name@company.com",
      type: "email",
      autoComplete: "email",
      validate: (v) => (!v ? tl("We need an email.") : /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(v) ? null : tl("Enter a valid email address.")),
    },
    {
      key: "contactPhone", section: S1,
      ask: tl("A phone number, in case email is slow?"),
      placeholder: "+233…",
      type: "tel",
      autoComplete: "tel",
      optional: true,
    },

    // ── The ask
    {
      key: "purpose", section: S2,
      ask: tl("What will the capital be used for?"),
      hint: tl("The clearer this is, the better we can match you to a mandate."),
      placeholder: tl("A few lines is plenty."),
      multiline: true,
      validate: required(tl("Tell us what the capital is for.")),
    },
    {
      key: "amount", section: S2,
      ask: tl("How much are you raising?"),
      hint: tl("In US dollars."),
      prefix: "$",
      placeholder: "15,000,000",
      type: "text",
      validate: required(tl("We need the amount.")),
    },
    {
      key: "instrument", section: S2,
      ask: tl("What instrument are you offering?"),
      hint: tl("Pick every one you would consider."),
      multi: [tl("Debt"), tl("Equity"), tl("Preferred Share")],
      validate: required(tl("Choose at least one.")),
    },
    {
      key: "equityStake", section: S2,
      ask: tl("What stake are you offering?"),
      suffix: "%",
      placeholder: "18",
      optional: true,
    },
    {
      key: "returnOffer", section: S2,
      ask: tl("And the return you are offering?"),
      suffix: "%",
      placeholder: "22",
      optional: true,
    },

    // ── Services & listing
    {
      key: "listingTier", section: S3,
      ask: tl("Which listing tier suits you?"),
      hint: tl("You can change this later — it sets how prominently you appear."),
      choices: ["Standard", "Silver", "Gold", "Platinum"],
      validate: required(tl("Choose a listing tier.")),
    },
    {
      key: "services", section: S3,
      ask: tl("Would any of these help you raise?"),
      multi: [
        tl("Basic Teaser Preparation"),
        tl("Business Plan Writing"),
        tl("Financial Reporting Services"),
        tl("Shadow Investor Search"),
        tl("Investor Roadshow"),
      ],
      optional: true,
    },
    {
      key: "featuredImage", section: S3,
      ask: tl("Add a photograph of your business."),
      hint: tl("This is what investors see on your card in the marketplace."),
      // A render function, so the upload can name the company the visitor
      // typed eleven questions ago and hand its result back into the answers.
      node: ({ values, value, set }) => (
        <FeaturedImageUpload
          value={value || null}
          companyName={values.companyName ?? ""}
          onUploaded={set}
        />
      ),
      optional: true,
    },
    {
      key: "consent", section: S3,
      ask: tl("One last thing."),
      confirm: tl("I confirm the information provided is accurate and I consent to Assets & Capital reviewing and listing my business."),
    },
  ];

  function submit(values: Record<string, string>) {
    // A bot reached the end. Same journey, nothing submitted.
    if (values[HONEYPOT_KEY]) {
      setSubmitted(true);
      return;
    }
    // Integration seam: POST the intake. The draft is cleared so a returning
    // visitor starts fresh rather than resubmitting what we already have.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSubmitted(true);
  }

  return (
    /* The page renders this bare, straight after the PageHeader — the component
       it replaced brought its own container, and dropping that put the whole
       conversation outside the content column, hard against both edges of the
       viewport. The card matches the contact page's, which is the other place
       a Conversation is mounted. */
    <section className="container-x py-12 md:py-16">
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-[var(--shadow-soft)] md:p-10">
    <Conversation
      questions={QUESTIONS}
      onComplete={submit}
      storageKey={STORAGE_KEY}
      submitLabel={tl("Submit listing")}
      done={
        submitted ? (
          <div className="py-10 text-center" role="status">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <PartyPopper className="h-6 w-6" />
            </span>
            <h2 className="mt-6 font-display text-2xl font-semibold text-navy-700">{tl("Listing submitted")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/65">
              {tl("Our team reviews and verifies every listing before it goes live. We'll be in touch within two business days.")}
            </p>
            <Link
              href="/marketplace"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {tl("Browse the marketplace")}
            </Link>
          </div>
        ) : null
      }
    />
      </div>
    </section>
  );
}
