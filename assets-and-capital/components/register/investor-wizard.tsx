"use client";

import Link from "next/link";
import { useState } from "react";
import { Briefcase, Building2, PieChart, ArrowRight, PartyPopper } from "lucide-react";
import { useTl } from "@/components/i18n/locale-provider";
import { Conversation, HONEYPOT_KEY, type Question } from "@/components/forms/conversation";
import { INVESTOR_OPTIONS, INVESTOR_SCHEMA } from "@/lib/intake-schema";

/**
 * The investment mandate, asked one question at a time.
 *
 * It was a five-to-six step wizard of dense two-column grids — the private
 * equity path alone asked twenty-eight fields, several of them labelled things
 * like "Aggressive IRR (%)" with no explanation of what distinguishes it from
 * the target. That reads like a form somebody's compliance team wrote, which is
 * a strange first impression for the side of the marketplace bringing money.
 *
 * THE BRANCH AND THE PAGINATION SURVIVE. The three paths are still a deliberate
 * first choice on their own screen — they are genuinely different mandates, not
 * a dropdown — and each path's steps are still its sections, so the rail across
 * the top shows the same five or six stages the wizard's progress bar did.
 * Every question, its order, and what counts as required are unchanged.
 *
 * The draft still persists per branch. This asks for figures an investment
 * committee has to agree, so leaving and coming back is the normal case.
 */

const BRANCHES = [
  { key: "Private Equity", title: "Private Equity", desc: "Buyouts, growth, venture, secondaries and distressed.", icon: Briefcase },
  { key: "Real Estate", title: "Real Estate", desc: "Direct property, funds, joint ventures and co-investment.", icon: Building2 },
  { key: "Fund Investor", title: "Fund Investor", desc: "Mutual, hedge, private, UCITS, ETFs and multi-asset.", icon: PieChart },
] as const;

const STORAGE_KEY = "ac_investor_mandate_v2";

export function InvestorWizard() {
  const tl = useTl();
  const [branch, setBranch] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  /* ---------------------------------------------------------- the branch */

  if (!branch && !submitted) {
    return (
      <section className="container-x py-12 md:py-16">
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-[var(--shadow-soft)] md:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand-600">{tl("Where to begin")}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-navy-700 md:text-4xl">
            {tl("What kind of investor are you?")}
          </h2>
          <p className="mt-3 max-w-2xl text-ink/65">
            {tl("The three mandates ask different questions, so this decides what we need from you. You can change it later without losing your answers.")}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {BRANCHES.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setBranch(b.key)}
                className="group rounded-2xl border border-ink/[0.09] p-6 text-left transition hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <b.icon className="h-5 w-5" />
                </span>
                <span className="mt-4 block font-display text-lg font-semibold text-navy-700">{tl(b.title)}</span>
                <span className="mt-1.5 block text-sm text-ink/60">{tl(b.desc)}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
                  {tl("Start")} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------- the questions */

  const S1 = tl("About you");
  const opt = (key: string) => (INVESTOR_OPTIONS[key] ?? []).map((o) => tl(o));
  const required = (msg: string) => (v: string) => (v ? null : msg);

  /**
   * What the recap calls each answer.
   *
   * Separate from `ask` because the question is a sentence — "What are you
   * optimising for?" — and the recap needs a column heading. Without these the
   * component falls back to the key, which for this form meant somebody read
   * "PE_IRR_MIN" back to themselves.
   */
  const LABEL: Record<string, string> = {
    entityName: tl("Investor"), investorType: tl("Type"), jurisdiction: tl("Domicile"),
    contactName: tl("Contact"), contactTitle: tl("Title"), email: tl("Email"), phone: tl("Phone"),
    accredited: tl("Accredited"), kyc: tl("KYC ready"),

    pe_objectives: tl("Objectives"), pe_irr_min: tl("Minimum IRR"), pe_irr_target: tl("Target IRR"),
    pe_irr_aggr: tl("Upside IRR"), pe_risk: tl("Risk"), pe_control: tl("Control"),
    pe_horizon: tl("Horizon"), pe_strategies: tl("Strategies"), pe_instruments: tl("Instruments"),
    pe_stage: tl("Stage"), pe_markets: tl("Markets"), pe_sectors: tl("Sectors"),
    pe_exclusions: tl("Exclusions"), pe_total: tl("Total capital"), pe_min: tl("Minimum ticket"),
    pe_target: tl("Typical ticket"), pe_max: tl("Maximum ticket"), pe_liquidity: tl("Exit"),
    pe_governance: tl("Governance"),

    re_objectives: tl("Objectives"), re_noi: tl("Target NOI"), re_growth: tl("Capital growth"),
    re_irr: tl("Total return"), re_risk: tl("Risk"), re_classes: tl("Asset classes"),
    re_structure: tl("Structure"), re_instruments: tl("Instruments"), re_dev: tl("Condition"),
    re_markets: tl("Markets"), re_total: tl("Total capital"), re_min: tl("Minimum ticket"),
    re_target: tl("Typical ticket"), re_max: tl("Maximum ticket"), re_deploy: tl("Deployment"),
    re_liquidity: tl("Hold period"), re_exit: tl("Exit"), re_metrics: tl("Reporting"),

    fd_objectives: tl("Objectives"), fd_min: tl("Minimum return"), fd_target: tl("Target return"),
    fd_upside: tl("Upside"), fd_risk: tl("Risk"), fd_horizon: tl("Horizon"),
    fd_categories: tl("Fund types"), fd_styles: tl("Styles"), fd_strategies: tl("Strategies"),
    fd_exclusions: tl("Exclusions"), fd_total: tl("Total capital"), fd_lockup: tl("Lock-up"),
    fd_governance: tl("Governance"), fd_fees: tl("Fees"),

    consent: tl("Confirmed"),
  };

  const ABOUT: Question[] = [
    {
      key: "entityName", label: LABEL.entityName, section: S1, accept: "company", rule: INVESTOR_SCHEMA.entityName,
      ask: tl("Who is investing?"),
      hint: tl("The entity that would appear on a commitment, not the individual signing it."),
      placeholder: tl("e.g. Aurora Family Office"),
      autoComplete: "organization",
      validate: required(tl("We need the investor or entity name.")),
    },
    {
      key: "investorType", label: LABEL.investorType, section: S1, rule: INVESTOR_SCHEMA.investorType,
      ask: tl("And what kind of entity is that?"),
      choices: opt("investorType"),
      validate: required(tl("Choose an investor type.")),
    },
    {
      key: "jurisdiction", label: LABEL.jurisdiction, section: S1, rule: INVESTOR_SCHEMA.jurisdiction,
      ask: tl("Where is it domiciled?"),
      hint: tl("The jurisdiction whose rules govern what you can commit to."),
      placeholder: tl("Country"),
      autoComplete: "country-name",
      validate: required(tl("We need the jurisdiction.")),
    },
    {
      key: "contactName", label: LABEL.contactName, section: S1, rule: INVESTOR_SCHEMA.contactName,
      ask: tl("Who should we deal with?"),
      placeholder: tl("Full name"),
      autoComplete: "name",
      validate: required(tl("We need a contact name.")),
    },
    {
      key: "contactTitle", label: LABEL.contactTitle, section: S1, accept: "text", rule: INVESTOR_SCHEMA.contactTitle,
      ask: tl("What is their title?"),
      placeholder: tl("e.g. Chief Investment Officer"),
      optional: true,
    },
    {
      key: "email", label: LABEL.email, section: S1, rule: INVESTOR_SCHEMA.email,
      ask: tl("And their email?"),
      placeholder: "name@entity.com",
      type: "email",
      autoComplete: "email",
      validate: required(tl("We need an email.")),
    },
    {
      key: "phone", label: LABEL.phone, section: S1, rule: INVESTOR_SCHEMA.phone,
      ask: tl("A phone number, in case email is slow?"),
      placeholder: "+971…",
      type: "tel",
      autoComplete: "tel",
      optional: true,
    },
    {
      key: "accredited", label: LABEL.accredited, section: S1, rule: INVESTOR_SCHEMA.accredited,
      ask: tl("Are you an accredited or qualified investor?"),
      hint: tl("Most jurisdictions restrict private placements to investors who meet a wealth or sophistication test."),
      choices: opt("accredited"),
      validate: required(tl("Please answer this one.")),
    },
    {
      key: "kyc", label: LABEL.kyc, section: S1, rule: INVESTOR_SCHEMA.kyc,
      ask: tl("Do you have KYC and AML documentation ready?"),
      hint: tl("Not needed now — knowing tells us how quickly we can verify you."),
      choices: opt("kyc"),
      optional: true,
    },
  ];

  /** Shorthands, because the branches ask thirty of these between them. */
  const pick = (key: string, section: string, ask: string, extra: Partial<Question> = {}): Question => ({
    key, section, ask, label: LABEL[key], choices: opt(key), rule: INVESTOR_SCHEMA[key], ...extra,
  });
  const picks = (key: string, section: string, ask: string, extra: Partial<Question> = {}): Question => ({
    key, section, ask, label: LABEL[key], multi: opt(key), rule: INVESTOR_SCHEMA[key], ...extra,
  });
  const pct = (key: string, section: string, ask: string, placeholder: string): Question => ({
    key, section, ask, label: LABEL[key], suffix: "%", placeholder, accept: "decimal", rule: INVESTOR_SCHEMA[key], optional: true,
  });
  const usd = (key: string, section: string, ask: string, extra: Partial<Question> = {}): Question => ({
    key, section, ask, label: LABEL[key], prefix: "$", placeholder: "25,000,000", accept: "digits", rule: INVESTOR_SCHEMA[key], optional: true, ...extra,
  });

  const PE: Question[] = (() => {
    const A = tl("Objectives"), B = tl("Strategy"), C = tl("Geography & sectors"), D = tl("Allocation");
    return [
      picks("pe_objectives", A, tl("What are you optimising for?"), { hint: tl("Pick every one that applies."), validate: required(tl("Choose at least one.")) }),
      pct("pe_irr_min", A, tl("What is the least you would accept, as an IRR?"), "12"),
      pct("pe_irr_target", A, tl("And what are you targeting?"), "18"),
      pct("pe_irr_aggr", A, tl("What would count as a very good year?"), "25"),
      pick("pe_risk", A, tl("How much risk are you willing to carry?"), { validate: required(tl("Choose a risk tolerance.")) }),
      pick("pe_control", A, tl("How much control do you want?"), { optional: true }),
      pick("pe_horizon", A, tl("Over what horizon?"), { optional: true }),
      picks("pe_strategies", B, tl("Which strategies are in scope?"), { validate: required(tl("Choose at least one.")) }),
      picks("pe_instruments", B, tl("And which instruments?"), { optional: true }),
      picks("pe_stage", B, tl("At what stage do you want to come in?"), { optional: true }),
      picks("pe_markets", C, tl("Which markets are you looking at?"), { validate: required(tl("Choose at least one market.")) }),
      picks("pe_sectors", C, tl("Any sectors you favour?"), { optional: true }),
      { key: "pe_exclusions", section: C, accept: "text", rule: INVESTOR_SCHEMA.pe_exclusions, ask: tl("Anything you will not invest in?"), hint: tl("Prohibited industries, mandates you cannot breach."), multiline: true, optional: true },
      usd("pe_total", D, tl("How much capital do you have to deploy?"), { optional: false, validate: required(tl("We need the total.")) }),
      usd("pe_min", D, tl("What is your minimum per deal?"), { placeholder: "5,000,000" }),
      usd("pe_target", D, tl("Your typical ticket?"), { placeholder: "15,000,000" }),
      usd("pe_max", D, tl("And your ceiling?"), { placeholder: "50,000,000" }),
      picks("pe_liquidity", D, tl("How would you want to exit?"), { optional: true }),
      picks("pe_governance", D, tl("What governance do you expect?"), { optional: true }),
    ];
  })();

  const RE: Question[] = (() => {
    const A = tl("Goals"), B = tl("Assets & structure"), C = tl("Geography"), D = tl("Allocation & exit");
    return [
      picks("re_objectives", A, tl("What are you optimising for?"), { hint: tl("Pick every one that applies."), validate: required(tl("Choose at least one.")) }),
      pct("re_noi", A, tl("What NOI yield are you targeting?"), "6.5"),
      pct("re_growth", A, tl("And what capital growth do you expect?"), "4"),
      pct("re_irr", A, tl("What total return would make this worth doing?"), "15"),
      pick("re_risk", A, tl("Where do you sit on risk?"), { validate: required(tl("Choose a risk profile.")) }),
      picks("re_classes", B, tl("Which asset classes?"), { validate: required(tl("Choose at least one.")) }),
      picks("re_structure", B, tl("How would you rather hold it?"), { optional: true }),
      picks("re_instruments", B, tl("And which instruments?"), { optional: true }),
      pick("re_dev", B, tl("Stabilised, or would you take on work?"), { optional: true }),
      picks("re_markets", C, tl("Which markets are you looking at?"), { validate: required(tl("Choose at least one market.")) }),
      usd("re_total", D, tl("How much are you committing to real estate?"), { optional: false, validate: required(tl("We need the total.")) }),
      usd("re_min", D, tl("Minimum per asset?"), { placeholder: "5,000,000" }),
      usd("re_target", D, tl("Your typical ticket?"), { placeholder: "15,000,000" }),
      usd("re_max", D, tl("And your ceiling?"), { placeholder: "50,000,000" }),
      pick("re_deploy", D, tl("How soon do you want to deploy?"), { optional: true }),
      pick("re_liquidity", D, tl("How long would you hold?"), { optional: true }),
      picks("re_exit", D, tl("How would you want to exit?"), { optional: true }),
      picks("re_metrics", D, tl("What reporting do you need?"), { optional: true }),
    ];
  })();

  const FD: Question[] = (() => {
    const A = tl("Goals"), B = tl("Fund types"), C = tl("Allocation"), D = tl("Governance & fees");
    return [
      picks("fd_objectives", A, tl("What are you optimising for?"), { hint: tl("Pick every one that applies."), validate: required(tl("Choose at least one.")) }),
      pct("fd_min", A, tl("What is the least you would accept, as a return?"), "5"),
      pct("fd_target", A, tl("And what are you targeting?"), "9"),
      pct("fd_upside", A, tl("What would count as a very good year?"), "15"),
      pick("fd_risk", A, tl("How much risk are you willing to carry?"), { validate: required(tl("Choose a risk tolerance.")) }),
      pick("fd_horizon", A, tl("Over what horizon?"), { optional: true }),
      picks("fd_categories", B, tl("Which kinds of fund are in scope?"), { validate: required(tl("Choose at least one.")) }),
      picks("fd_styles", B, tl("Any management style you prefer?"), { optional: true }),
      picks("fd_strategies", B, tl("And which strategies?"), { optional: true }),
      picks("fd_exclusions", B, tl("Anything that rules a fund out?"), { optional: true }),
      usd("fd_total", C, tl("How much are you allocating to funds?"), { optional: false, validate: required(tl("We need the total.")) }),
      pick("fd_lockup", C, tl("How long a lock-up can you live with?"), { optional: true }),
      picks("fd_governance", D, tl("How involved do you want to be?"), { optional: true }),
      picks("fd_fees", D, tl("Any preference on fee structure?"), { optional: true }),
    ];
  })();

  const BRANCH_QUESTIONS: Record<string, Question[]> = {
    "Private Equity": PE,
    "Real Estate": RE,
    "Fund Investor": FD,
  };

  const QUESTIONS: Question[] = [
    ...ABOUT,
    ...(BRANCH_QUESTIONS[branch] ?? []),
    {
      key: "consent", label: LABEL.consent,
      section: tl("Confirm"),
      ask: tl("One last thing."),
      confirm: tl("I confirm this mandate is accurate and I consent to Assets & Capital matching me to opportunities against it."),
    },
  ];

  /* ---------------------------------------------------------- submitting */

  async function submit(values: Record<string, string>) {
    // A bot reached the end. Same journey, nothing submitted.
    if (values[HONEYPOT_KEY]) {
      setSubmitted(true);
      return;
    }
    setSending(true);
    setFailed(false);
    try {
      const res = await fetch("/api/investor-mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, branch }),
      });
      if (!res.ok) {
        setFailed(true);
        return;
      }
      // Only once the server has it. A mandate is thirty answers an investment
      // committee had to agree; clearing that on a failed request would be
      // losing somebody else's work.
      try {
        window.localStorage.removeItem(`${STORAGE_KEY}:${branch}`);
      } catch {
        /* ignore */
      }
      setSubmitted(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  }

  /* The page renders this bare, straight after the PageHeader, so the container
     and the card belong here — the same arrangement as the business intake. */
  return (
    <section className="container-x py-12 md:py-16">
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-[var(--shadow-soft)] md:p-10">
        {/* The branch cards say "you can change it later", and until this
            existed they were lying — choosing a path was one-way. Each branch
            keeps its own draft, so coming back really does find the answers
            where they were left. Hidden once submitted: there is nothing left
            to change. */}
        {!submitted ? (
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/[0.07] pb-4">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-brand-600">{tl(branch)}</span>
            <button
              type="button"
              onClick={() => setBranch("")}
              className="text-sm text-ink/55 underline decoration-ink/20 underline-offset-4 transition hover:text-ink/80 hover:decoration-ink/40"
            >
              {tl("Choose a different mandate")}
            </button>
          </div>
        ) : null}
        <Conversation
          // Remounts when the branch changes, so switching path starts that
          // path's questions rather than resuming at another branch's index.
          key={branch}
          questions={QUESTIONS}
          onComplete={submit}
          // Per branch, so a draft of a fund mandate is not offered to somebody
          // who came back to build a real estate one.
          storageKey={`${STORAGE_KEY}:${branch}`}
          title={tl("Build your mandate")}
          intro={tl("{n} questions. Your answers save as you go, so you can leave and come back.").replace("{n}", String(QUESTIONS.length))}
          submitLabel={tl("Submit mandate")}
          submitting={sending}
          error={failed ? tl("That did not go through. Please check your answers and try again.") : null}
          done={
            submitted ? (
              <div className="py-10 text-center" role="status">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                  <PartyPopper className="h-6 w-6" />
                </span>
                <h2 className="mt-6 font-display text-2xl font-semibold text-navy-700">{tl("Mandate submitted")}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-ink/65">
                  {tl("Thank you. Your investment mandate is being reviewed by our team. You'll start receiving mandate-matched opportunities as soon as your account is verified.")}
                </p>
                <Link
                  href="/marketplace"
                  className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
                >
                  {tl("Explore the marketplace")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null
          }
        />
      </div>
    </section>
  );
}
