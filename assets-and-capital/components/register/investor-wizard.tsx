"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";
import {
  Briefcase, Building2, PieChart, Check, ArrowRight, ArrowLeft, Cloud, ShieldCheck, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ config */

type FieldType = "text" | "email" | "tel" | "number" | "textarea" | "select" | "chips" | "yesno";
type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  help?: string;
  span?: 1 | 2;
};
type Step = { id: string; title: string; subtitle?: string; fields: Field[] };

const MARKETS = ["East Africa", "West Africa", "North Africa", "Southern Africa", "North America", "Europe", "Middle East", "Asia Pacific"];
const SECTORS = ["Technology", "Healthcare", "Consumer", "Industrials", "FinTech", "Energy", "Financial Services", "Natural Resources", "Real Estate", "Infrastructure", "Communications & Media", "Agriculture", "Hospitality, Travel & Leisure", "Education", "ESG"];

const BRANCHES = [
  { key: "private_equity", title: "Private Equity", desc: "Buyouts, growth, venture, secondaries and distressed.", icon: Briefcase },
  { key: "real_estate", title: "Real Estate", desc: "Direct property, funds, joint ventures and co-investment.", icon: Building2 },
  { key: "fund", title: "Fund Investor", desc: "Mutual, hedge, private, UCITS, ETFs and multi-asset.", icon: PieChart },
] as const;

const ABOUT: Step = {
  id: "about",
  title: "About you",
  subtitle: "Biographical and identification information.",
  fields: [
    { name: "entityName", label: "Investor / entity name", type: "text", required: true, span: 2, placeholder: "e.g. Aurora Family Office" },
    { name: "contactName", label: "Primary contact name", type: "text", required: true },
    { name: "contactTitle", label: "Title", type: "text", placeholder: "e.g. Chief Investment Officer" },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "investorType", label: "Investor type", type: "select", required: true, options: ["Individual", "Family Office", "Institutional Investor", "Pension Fund", "Sovereign Wealth Fund", "Other"] },
    { name: "jurisdiction", label: "Legal domicile & jurisdiction", type: "text", required: true, placeholder: "Country" },
    { name: "accredited", label: "Accredited / qualified investor?", type: "yesno", required: true },
    { name: "kyc", label: "KYC / AML documentation available?", type: "yesno" },
  ],
};

const BRANCH_STEPS: Record<string, Step[]> = {
  private_equity: [
    {
      id: "objectives", title: "Investment objectives", subtitle: "What are you optimising for?",
      fields: [
        { name: "pe_objectives", label: "Primary objectives", type: "chips", span: 2, required: true, options: ["Capital Appreciation", "Sector Leadership", "Diversification", "Strategic Exposure"] },
        { name: "pe_irr_min", label: "Minimum IRR (%)", type: "number", placeholder: "e.g. 12" },
        { name: "pe_irr_target", label: "Target IRR (%)", type: "number", placeholder: "e.g. 18" },
        { name: "pe_irr_aggr", label: "Aggressive IRR (%)", type: "number", placeholder: "e.g. 25" },
        { name: "pe_risk", label: "Risk tolerance", type: "select", options: ["Moderate", "High", "Opportunistic"], required: true },
        { name: "pe_control", label: "Level of control", type: "select", options: ["Majority ownership", "Minority with Board membership", "Silent minority"] },
        { name: "pe_horizon", label: "Investment horizon", type: "select", options: ["3–5 yrs", "5–7 yrs", "7–10 yrs", ">10 yrs"] },
      ],
    },
    {
      id: "strategy", title: "Mandate scope & strategies", subtitle: "Permitted strategies and instruments.",
      fields: [
        { name: "pe_strategies", label: "Private equity strategies", type: "chips", span: 2, required: true, options: ["Buyouts", "Growth Equity", "Venture Capital", "Secondary Stakes", "Turnarounds / Distressed", "Sector-Focused"] },
        { name: "pe_instruments", label: "Investment instruments", type: "chips", span: 2, options: ["Debt Only", "Preference Equity", "Equity"] },
        { name: "pe_stage", label: "Investment stage", type: "chips", span: 2, options: ["Green field / Start Up", "Growth", "Brown field / Mature"] },
      ],
    },
    {
      id: "geo", title: "Geographic & sector preferences", subtitle: "Where and in what you invest.",
      fields: [
        { name: "pe_markets", label: "Target markets", type: "chips", span: 2, required: true, options: MARKETS },
        { name: "pe_sectors", label: "Preferred sectors", type: "chips", span: 2, options: SECTORS },
        { name: "pe_exclusions", label: "Exclusions (e.g. prohibited industries)", type: "text", span: 2 },
      ],
    },
    {
      id: "allocation", title: "Allocation & governance", subtitle: "Capital, liquidity and governance.",
      fields: [
        { name: "pe_total", label: "Total investable capital (USD)", type: "text", required: true, placeholder: "$" },
        { name: "pe_min", label: "Min per deal (USD)", type: "text", placeholder: "$" },
        { name: "pe_target", label: "Target per deal (USD)", type: "text", placeholder: "$" },
        { name: "pe_max", label: "Max per deal (USD)", type: "text", placeholder: "$" },
        { name: "pe_liquidity", label: "Liquidity / exit preference", type: "chips", span: 2, options: ["IPO", "Strategic Sale", "Secondary Sale", "Dividend Recapitalization"] },
        { name: "pe_governance", label: "Governance interests", type: "chips", span: 2, options: ["Board Seat", "Observer Rights", "Advisory Committee", "None"] },
      ],
    },
  ],
  real_estate: [
    {
      id: "goals", title: "Real estate goals", subtitle: "Objectives and return metrics.",
      fields: [
        { name: "re_objectives", label: "Primary objectives", type: "chips", span: 2, required: true, options: ["Income Generation", "Capital Appreciation", "Inflation Hedge", "Portfolio Diversification", "Strategic Sector Exposure"] },
        { name: "re_noi", label: "Target NOI yield (%)", type: "number" },
        { name: "re_growth", label: "Expected capital growth (%)", type: "number" },
        { name: "re_irr", label: "Target total return / IRR (%)", type: "number" },
        { name: "re_risk", label: "Risk profile", type: "select", required: true, options: ["Core (Lower Risk)", "Core-Plus", "Value-Add", "Opportunistic"] },
      ],
    },
    {
      id: "assets", title: "Asset types & strategies", subtitle: "Permitted classes and structures.",
      fields: [
        { name: "re_classes", label: "Asset classes", type: "chips", span: 2, required: true, options: ["Residential", "Commercial Office", "Retail", "Industrial / Logistics", "Hospitality", "Healthcare & Senior Living", "Mixed-Use"] },
        { name: "re_structure", label: "Structure preference", type: "chips", span: 2, options: ["Direct Ownership", "Fund Vehicle", "Joint Venture", "SPV / Co-Investment"] },
        { name: "re_instruments", label: "Investment instruments", type: "chips", span: 2, options: ["Debt Only", "Preference Equity", "Equity"] },
        { name: "re_dev", label: "Development vs stabilized", type: "select", options: ["Stabilized Assets", "Light Renovation", "Ground-Up Development"] },
      ],
    },
    {
      id: "geo", title: "Geographic focus", subtitle: "Target markets.",
      fields: [{ name: "re_markets", label: "Target markets", type: "chips", span: 2, required: true, options: MARKETS }],
    },
    {
      id: "alloc", title: "Allocation & exit", subtitle: "Deployment, liquidity and governance.",
      fields: [
        { name: "re_total", label: "Total capital commitment (USD)", type: "text", required: true, placeholder: "$" },
        { name: "re_min", label: "Min per asset (USD)", type: "text", placeholder: "$" },
        { name: "re_target", label: "Target per asset (USD)", type: "text", placeholder: "$" },
        { name: "re_max", label: "Max per asset (USD)", type: "text", placeholder: "$" },
        { name: "re_deploy", label: "Deployment timeline", type: "select", options: ["Immediate", "3–6 Months", "6–12 Months", "Longer"] },
        { name: "re_liquidity", label: "Liquidity profile", type: "select", options: ["Long-Term Hold", "Medium Hold", "Short-Term Flip"] },
        { name: "re_exit", label: "Exit strategy", type: "chips", span: 2, options: ["Sale to Strategic Buyer", "Recapitalization", "REIT / Public Listing", "Refinancing"] },
        { name: "re_metrics", label: "Performance metrics required", type: "chips", span: 2, options: ["NOI", "Cash-on-Cash Return", "Cap Rate", "Valuation Reports"] },
      ],
    },
  ],
  fund: [
    {
      id: "goals", title: "Investment goals & constraints", subtitle: "Objectives, return and horizon.",
      fields: [
        { name: "fd_objectives", label: "Primary objectives", type: "chips", span: 2, required: true, options: ["Capital Growth", "Income / Dividend Yield", "Capital Preservation", "Diversification", "Hedging Inflation", "Tax Efficiency"] },
        { name: "fd_min", label: "Minimum return (%)", type: "number" },
        { name: "fd_target", label: "Target return (%)", type: "number" },
        { name: "fd_upside", label: "Upside goal (%)", type: "number" },
        { name: "fd_risk", label: "Risk tolerance", type: "select", required: true, options: ["Low", "Moderate", "High", "Opportunistic / Aggressive"] },
        { name: "fd_horizon", label: "Time horizon", type: "select", options: ["<3 years", "3–5 years", "5–7 years", ">7 years"] },
      ],
    },
    {
      id: "types", title: "Fund types & strategies", subtitle: "Permitted categories and styles.",
      fields: [
        { name: "fd_categories", label: "Permitted fund categories", type: "chips", span: 2, required: true, options: ["Mutual / Open-End", "Hedge / Alternative", "Private Funds (AIF, PE)", "UCITS", "ETFs", "Balanced / Multi-Asset"] },
        { name: "fd_styles", label: "Preferred styles", type: "chips", span: 2, options: ["Active Management", "Passive / Index-Linked", "Quantitative / Systematic", "Thematic (ESG, Tech…)", "Sector-Specific"] },
        { name: "fd_strategies", label: "Targeted strategies", type: "chips", span: 2, options: ["Equity-Focused", "Fixed Income", "Multi-asset", "L/S Equity Hedge", "Private Credit", "Real Assets / Infrastructure", "Emerging Markets"] },
        { name: "fd_exclusions", label: "Exclusionary criteria", type: "chips", span: 2, options: ["High Leverage", "Illiquid Only", "Derivatives Only", "Non-ESG Compliant"] },
      ],
    },
    {
      id: "alloc", title: "Allocation & lock-up", subtitle: "Capital and liquidity tolerance.",
      fields: [
        { name: "fd_total", label: "Total capital for fund investments (USD)", type: "text", required: true, span: 2, placeholder: "$" },
        { name: "fd_lockup", label: "Tolerance for lock-ups / notice periods", type: "select", options: ["None", "Up to 3 Months", "3–6 Months", "6–12 Months", ">12 Months"] },
      ],
    },
    {
      id: "gov", title: "Governance & fees", subtitle: "Preferences on control and fee structure.",
      fields: [
        { name: "fd_governance", label: "Governance preferences", type: "chips", span: 2, options: ["Advisory Committee Participation", "Voting Rights in Underlying Holdings", "No Governance Involvement"] },
        { name: "fd_fees", label: "Fee structure preferences", type: "chips", span: 2, options: ["Flat Management Fee", "Performance Fee (Carry)", "Hurdle Rate Requirement", "Tiered Fee"] },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ component */

type Values = Record<string, string | string[]>;
const STORAGE_KEY = "ac_investor_mandate_v1";

export function InvestorWizard() {
  const [branch, setBranch] = useState<string>("");
  const [values, setValues] = useState<Values>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);

  // load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        /* Seeding editable form state from a saved draft. Not a mirror of an
           external store (the user edits it afterwards), so useSyncExternalStore
           does not apply; lazy-initialising would mean rendering the wizard
           client-only, putting a skeleton flash in front of the registration
           funnel. Deliberate — the directive must sit on the line directly
           above the call, so the reasoning lives here instead. */
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBranch(parsed.branch ?? "");
        setValues(parsed.values ?? {});
        setStepIndex(parsed.stepIndex ?? 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // autosave (debounced)
  useEffect(() => {
    if (!branch && Object.keys(values).length === 0) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ branch, values, stepIndex }));
        setSaved(true);
        const s = setTimeout(() => setSaved(false), 1600);
        return () => clearTimeout(s);
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [branch, values, stepIndex]);

  const steps: Step[] = useMemo(() => {
    const branchSteps = branch ? BRANCH_STEPS[branch] ?? [] : [];
    const review: Step = { id: "review", title: "Review & consent", subtitle: "Confirm your mandate.", fields: [] };
    return [ABOUT, ...branchSteps, review];
  }, [branch]);

  const totalSteps = steps.length + 1; // + branch selection
  const currentAbsolute = branch ? stepIndex + 1 : 0;
  const progress = Math.round((currentAbsolute / (totalSteps - 1)) * 100);

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

  function validateStep(step: Step): boolean {
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
    const step = steps[stepIndex];
    if (step.id === "review") {
      if (consent) setSubmitted(true);
      return;
    }
    if (!validateStep(step)) return;
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    if (stepIndex === 0) {
      setBranch("");
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- success ---- */
  if (submitted) {
    return (
      <div className="container-x py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-ink/[0.07] bg-white p-10 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <PartyPopper className="h-7 w-7" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-navy-700">Mandate submitted</h2>
          <p className="mt-3 text-ink/60">
            Thank you. Your investment mandate is being reviewed by our team. You&apos;ll start receiving
            mandate-matched opportunities as soon as your account is verified.
          </p>
          <Link href="/marketplace" className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-6 py-3 text-sm font-medium text-white hover:bg-brand-700">
            Explore the marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  /* ---- branch selection ---- */
  if (!branch) {
    return (
      <div className="container-x py-12 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-ink/65">Step 1 of {totalSteps}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-navy-700">What kind of investor are you?</h2>
          <p className="mt-3 text-ink/60">This tailors your mandate to the right questions. You can change it anytime.</p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
          {BRANCHES.map((b) => (
            <button
              key={b.key}
              onClick={() => {
                setBranch(b.key);
                setValues((v) => ({ ...v, investorClass: b.title }));
                setStepIndex(0);
              }}
              className="group rounded-3xl border border-ink/[0.07] bg-white p-7 text-left transition-all hover:border-brand-600/30 hover:shadow-[var(--shadow-card)]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <b.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-ink">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{b.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                Select <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const step = steps[stepIndex];

  return (
    <div className="container-x grid gap-10 py-12 lg:grid-cols-[260px_1fr] md:py-16">
      {/* progress rail */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4 flex items-center justify-between text-xs text-ink/65">
          <span>Progress</span>
          <span className="tnum">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-6 space-y-1">
          <li className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink/65">
            <span className="grid h-6 w-6 place-items-center rounded-[var(--radius-button)] bg-emerald-500 text-white">
              <Check className="h-3.5 w-3.5" />
            </span>
            {values.investorClass}
          </li>
          {steps.map((s, i) => {
            const state = i < stepIndex ? "done" : i === stepIndex ? "now" : "todo";
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                  state === "now" ? "bg-brand-50 font-medium text-ink" : "text-ink/65"
                )}
              >
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-[var(--radius-button)] text-xs",
                    state === "done" && "bg-emerald-500 text-white",
                    state === "now" && "bg-brand-600 text-white",
                    state === "todo" && "border border-ink/20 text-ink/60"
                  )}
                >
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 2}
                </span>
                {s.title}
              </li>
            );
          })}
        </ol>
      </aside>

      {/* form card */}
      <div>
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-[var(--shadow-soft)] md:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-navy-700">{step.title}</h2>
              {step.subtitle && <p className="mt-1.5 text-sm text-ink/65">{step.subtitle}</p>}
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-opacity",
                saved ? "bg-emerald-50 text-emerald-700 opacity-100" : "text-ink/30 opacity-0"
              )}
            >
              <Cloud className="h-3.5 w-3.5" /> Saved
            </span>
          </div>

          {step.id === "review" ? (
            <ReviewStep values={values} steps={steps} consent={consent} setConsent={setConsent} />
          ) : (
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {step.fields.map((f) => (
                <FieldControl
                  key={f.name}
                  field={f}
                  value={values[f.name]}
                  error={errors[f.name]}
                  onChange={(v) => setField(f.name, v)}
                  onToggle={(opt) => toggleChip(f.name, opt)}
                />
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-ink/[0.06] pt-6">
            <button onClick={back} className="inline-flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={next}
              disabled={step.id === "review" && !consent}
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {step.id === "review" ? "Submit mandate" : "Continue"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink/60">
          <ShieldCheck className="h-3.5 w-3.5" /> Your draft is saved to this device automatically.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ field control */

function FieldControl({
  field,
  value,
  error,
  onChange,
  onToggle,
}: {
  field: Field;
  value: string | string[] | undefined;
  error?: boolean;
  onChange: (v: string) => void;
  onToggle: (opt: string) => void;
}) {
  const base = "w-full rounded-xl border bg-paper-2/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/60 focus:outline-none focus:ring-2 focus:ring-brand-600/30";
  const border = error ? "border-brand-400" : "border-ink/10";
  const wrap = field.span === 2 || field.type === "chips" || field.type === "textarea" ? "sm:col-span-2" : "";

  return (
    <div className={wrap}>
      <label className="mb-1.5 block text-sm font-medium text-ink/80">
        {field.label} {field.required && <span className="text-brand-600">*</span>}
      </label>

      {field.type === "chips" ? (
        <div className="flex flex-wrap gap-2">
          {field.options!.map((opt) => {
            const on = Array.isArray(value) && value.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={cn(
                  "rounded-[var(--radius-button)] border px-3.5 py-1.5 text-sm transition-colors",
                  on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/12 text-ink/60 hover:border-ink/25"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : field.type === "select" ? (
        <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={cn(base, border)}>
          <option value="" disabled>
            Select…
          </option>
          {field.options!.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "yesno" ? (
        <div className="flex gap-2">
          {["Yes", "No"].map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={cn(
                "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                value === o ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/10 text-ink/60 hover:border-ink/25"
              )}
            >
              {o}
            </button>
          ))}
        </div>
      ) : field.type === "textarea" ? (
        <textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={3} className={cn(base, border, "resize-y")} />
      ) : (
        <input
          type={field.type}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn(base, border)}
        />
      )}

      {field.help && <p className="mt-1 text-xs text-ink/60">{field.help}</p>}
      {error && <p className="mt-1 text-xs text-brand-600">This field is required.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ review */

function ReviewStep({
  values,
  steps,
  consent,
  setConsent,
}: {
  values: Values;
  steps: Step[];
  consent: boolean;
  setConsent: (v: boolean) => void;
}) {
  const fieldSteps = steps.filter((s) => s.fields.length > 0);
  return (
    <div className="mt-7">
      <div className="space-y-6">
        {fieldSteps.map((s) => (
          <div key={s.id}>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/60">{s.title}</p>
            <dl className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {s.fields.map((f) => {
                const v = values[f.name];
                const display = Array.isArray(v) ? v.join(", ") : v;
                if (!display) return null;
                return (
                  <div key={f.name} className="flex justify-between gap-4 border-b border-dashed border-ink/[0.08] py-1.5 text-sm">
                    <dt className="text-ink/65">{f.label}</dt>
                    <dd className="text-right font-medium text-ink">{display}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-2xl bg-paper-2/60 p-4 text-sm text-ink/70">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
        <span>
          I confirm the information provided is accurate and reflects my investment intentions. I consent to Assets &amp;
          Capital using it to refer investment opportunities to me. Submitting electronically has the same effect as a
          wet-ink signature.
        </span>
      </label>
    </div>
  );
}
