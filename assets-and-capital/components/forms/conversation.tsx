"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTl } from "@/components/i18n/locale-provider";

/**
 * One question at a time.
 *
 * The forms on this site asked for everything at once — eleven fields on the
 * business intake, a wizard of grids on the investor side — which is the shape
 * of a tax return, not a conversation with somebody about their capital.
 *
 * Each question animates in on its own. The visitor answers on a long
 * underline, presses Enter to commit (there is a visible button for touch),
 * and the answered question folds up into a recap above that any of them can
 * be clicked to go back and change.
 *
 * THE PAGINATION AND STRUCTURE SURVIVE. Questions still carry the section they
 * belonged to, that section is named above the question, and the progress
 * hairline counts across the whole conversation — so a form that was four
 * pages of grouped fields is still visibly four groups, asked one at a time.
 *
 * Nothing about validation, payloads or endpoints changes here. This component
 * takes the questions and hands back the answers; whoever owns the form still
 * owns what happens to them.
 */

export type Question = {
  key: string;
  /** The section this belonged to on the old paginated form. */
  section: string;
  /** Asked as a question, in the second person. */
  ask: string;
  hint?: string;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
  /** Single-choice options, committed on click. */
  choices?: string[];
  /** Multi-choice: committed with the button, joined with ", ". */
  multi?: string[];
  type?: string;
  autoComplete?: string;
  /** Returns a message when the answer is not acceptable, null when it is. */
  validate?: (v: string) => string | null;
};

/** Grows the answer as it is typed, so a short one looks considered rather than lost. */
function sizeFor(len: number): string {
  if (len > 90) return "text-lg md:text-xl";
  if (len > 45) return "text-xl md:text-2xl";
  return "text-2xl md:text-3xl";
}

export function Conversation({
  questions,
  onComplete,
  submitting = false,
  submitLabel = "Send",
  /** Rendered instead of the conversation once it has been submitted. */
  done,
  error,
}: {
  questions: Question[];
  onComplete: (values: Record<string, string>) => void;
  submitting?: boolean;
  submitLabel?: string;
  done?: React.ReactNode;
  error?: string | null;
}) {
  const tl = useTl();
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState("");
  const [hp, setHp] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const q = questions[idx];
  const last = idx === questions.length - 1;

  /**
   * Moving to a question is an EVENT, so the draft is reset here rather than in
   * an effect reacting to the render that move caused. Setting state inside an
   * effect to mirror a prop is a cascading render, and eslint says so.
   */
  function goTo(next: number) {
    setIdx(next);
    setDraft(values[questions[next].key] ?? "");
    setProblem("");
  }

  // The effect does only what an effect is for: moving focus after the question
  // has animated in.
  useEffect(() => {
    const t = window.setTimeout(
      () => (q.multiline ? areaRef.current : inputRef.current)?.focus({ preventScroll: true }),
      360,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  function commit(raw?: string) {
    const v = (raw ?? draft).trim();
    if (!v && !q.optional) {
      setProblem(q.validate?.("") ?? tl("We do need this one."));
      return;
    }
    if (v) {
      const bad = q.validate?.(v);
      if (bad) {
        setProblem(bad);
        return;
      }
    }
    const next = { ...values, [q.key]: v };
    setValues(next);
    // A bot that filled the hidden field gets the same journey and nothing
    // sent — see the honeypot at the foot of this component.
    if (last) onComplete(hp ? { ...next, website: hp } : next);
    else {
      setIdx(idx + 1);
      setDraft(values[questions[idx + 1].key] ?? "");
      setProblem("");
    }
  }

  function toggleMulti(opt: string) {
    const cur = draft ? draft.split(", ").filter(Boolean) : [];
    const next = cur.includes(opt) ? cur.filter((c) => c !== opt) : [...cur, opt];
    setDraft(next.join(", "));
    setProblem("");
  }

  if (done) return <>{done}</>;

  const answered = questions.slice(0, idx);
  const chosen = draft ? draft.split(", ") : [];

  return (
    <div className="relative">
      {/* Progress, and where in the original structure this question sat. */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-ink/10">
          <div
            className="h-px bg-brand-600 transition-all duration-500"
            style={{ width: `${(idx / questions.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/55">
          {idx + 1} / {questions.length}
        </span>
      </div>

      {/* What has been answered. Any line goes back to that question. */}
      {answered.length > 0 && (
        <div className="mt-6 space-y-1.5">
          {answered.map((a, i) => (
            <button
              key={a.key}
              type="button"
              onClick={() => goTo(i)}
              className="group flex w-full items-baseline gap-4 text-left"
              title={tl("Change this answer")}
            >
              <span className="w-28 shrink-0 truncate text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-600">
                {a.key.replace(/([A-Z])/g, " $1")}
              </span>
              <span className="min-w-0 truncate text-sm text-ink/65 transition-colors group-hover:text-brand-700">
                {values[a.key] || <em className="not-italic opacity-60">{tl("skipped")}</em>}
              </span>
              <span aria-hidden className="ml-auto shrink-0 text-[0.65rem] text-ink/55 opacity-0 transition-opacity group-hover:opacity-100">
                {tl("edit")}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* The question. Keyed so it remounts, and re-animates, per step. */}
      <div key={q.key} className="mt-10">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/55">{q.section}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-navy-700 md:text-3xl">
          {q.ask}
          {q.optional && <span className="ml-2 align-middle text-sm font-normal text-ink/50">{tl("optional")}</span>}
        </h2>
        {q.hint && <p className="mt-2 max-w-xl text-sm text-ink/65">{q.hint}</p>}

        {/* Single choice commits immediately — the click IS the answer. */}
        {q.choices && (
          <div className="mt-6 flex flex-wrap gap-2.5">
            {q.choices.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => commit(c)}
                className={cn(
                  "rounded-[var(--radius-button)] border px-4 py-2.5 text-sm transition-colors",
                  draft === c
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-ink/12 text-ink/70 hover:border-brand-600 hover:text-brand-700",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Multi-choice needs a separate commit — the last tap is not the end. */}
        {q.multi && (
          <div role="group" aria-label={q.ask} className="mt-6 flex flex-wrap gap-2.5">
            {q.multi.map((c) => {
              const on = chosen.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleMulti(c)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border px-4 py-2.5 text-sm transition-colors",
                    on
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-ink/12 text-ink/70 hover:border-brand-600 hover:text-brand-700",
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {/* The answer line. Absent for single-choice, where clicking answered it. */}
        {!q.choices && (
          <div className="mt-7 flex items-end gap-4">
            {q.multiline ? (
              <textarea
                ref={areaRef}
                id={`q-${q.key}`}
                rows={2}
                value={draft}
                placeholder={q.placeholder}
                onChange={(e) => { setDraft(e.target.value); setProblem(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); } }}
                aria-label={q.ask}
                aria-invalid={Boolean(problem)}
                className={cn(
                  "min-h-24 w-full resize-none border-0 border-b border-ink/25 bg-transparent pb-3 font-display leading-snug text-brand-700 caret-brand-600 outline-none transition-all duration-300 placeholder:text-ink/40 focus:border-brand-600",
                  sizeFor(draft.length),
                )}
              />
            ) : q.multi ? null : (
              <input
                ref={inputRef}
                id={`q-${q.key}`}
                type={q.type ?? "text"}
                autoComplete={q.autoComplete}
                value={draft}
                placeholder={q.placeholder}
                onChange={(e) => { setDraft(e.target.value); setProblem(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
                aria-label={q.ask}
                aria-invalid={Boolean(problem)}
                className={cn(
                  "w-full border-0 border-b border-ink/25 bg-transparent pb-3 font-display text-brand-700 caret-brand-600 outline-none transition-all duration-300 placeholder:text-ink/40 focus:border-brand-600",
                  sizeFor(draft.length),
                )}
              />
            )}

            <button
              type="button"
              onClick={() => commit()}
              disabled={submitting}
              aria-label={last ? submitLabel : tl("Next question")}
              className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {last ? submitLabel : tl("OK")}
              {!submitting && !last && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        )}

        {problem && <p role="alert" className="mt-3 text-sm font-medium text-brand-700">{problem}</p>}
        {error && <p role="alert" className="mt-3 text-sm font-medium text-brand-700">{error}</p>}

        {idx > 0 && (
          <button
            type="button"
            onClick={() => goTo(idx - 1)}
            className="mt-6 text-sm text-ink/55 transition-colors hover:text-ink"
          >
            {tl("← Back")}
          </button>
        )}
      </div>

      {/* Humans never see it; bots fill it. Carried through to the payload so
          the caller can drop the submission without telling them why. */}
      <input
        type="text"
        name="website"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] top-0 h-px w-px opacity-0"
      />
    </div>
  );
}
