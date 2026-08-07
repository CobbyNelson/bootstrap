"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
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
  /**
   * Something that is not a question with an answer — an upload, a consent
   * tick. It renders in place of the input and the button still advances, so a
   * long form does not have to break out of the conversation for one step.
   */
  node?:
    | React.ReactNode
    | ((ctx: {
        /** Everything answered so far, so a step can use an earlier answer. */
        values: Record<string, string>;
        /** This step's own value, and how to set it. */
        value: string;
        set: (v: string) => void;
      }) => React.ReactNode);
  /** A single thing to agree to. Advancing requires it to be ticked. */
  confirm?: string;
};

/**
 * Where a honeypot hit is reported.
 *
 * Deliberately not "website": the input is NAMED website because that is what
 * a bot looks for, but a form may legitimately ask for one.
 */
export const HONEYPOT_KEY = "__trap";

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
  /**
   * Where to keep the draft. A ten-question form that loses everything when
   * somebody closes the tab to go and look up a figure is a form they do not
   * come back to.
   */
  storageKey,
  /** Rendered instead of the conversation once it has been submitted. */
  done,
  error,
}: {
  questions: Question[];
  onComplete: (values: Record<string, string>) => void;
  submitting?: boolean;
  submitLabel?: string;
  storageKey?: string;
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
   * The sections, in the order they first appear. Derived rather than declared,
   * so a question moved between sections cannot leave the rail describing a
   * shape the form no longer has.
   */
  const sections = questions.reduce<string[]>((acc, x) => (acc.includes(x.section) ? acc : [...acc, x.section]), []);
  const sectionOf = (i: number) => sections.indexOf(questions[i].section);
  const currentSection = sectionOf(idx);
  /** First question of each section — where the announcement is due. */
  const isSectionOpener = idx === 0 || questions[idx - 1].section !== q.section;

  /**
   * The section announcement.
   *
   * Shown on arriving at a section's first question, so somebody is told what
   * they are about to be asked about before they are asked. Skipped when
   * stepping BACKWARDS — going back to change an answer is not the start of
   * anything, and re-announcing would make the correction feel like a reset.
   */
  const [announcing, setAnnouncing] = useState(true);
  const showAnnouncement = announcing && isSectionOpener;
  const questionsInSection = questions.filter((x) => x.section === q.section).length;

  /**
   * Moving to a question is an EVENT, so the draft is reset here rather than in
   * an effect reacting to the render that move caused. Setting state inside an
   * effect to mirror a prop is a cascading render, and eslint says so.
   */
  function goTo(next: number, announce = false) {
    setIdx(next);
    setDraft(values[questions[next].key] ?? "");
    setProblem("");
    setAnnouncing(announce);
  }

  // Restore a draft once, on mount. Seeding editable state from storage is not
  // mirroring an external store — the visitor edits it afterwards — so
  // useSyncExternalStore does not apply here.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as { values?: Record<string, string>; idx?: number };
      if (saved.values && Object.keys(saved.values).length) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValues(saved.values);
        const at = Math.min(saved.idx ?? 0, questions.length - 1);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIdx(at);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(saved.values[questions[at].key] ?? "");
      }
    } catch {
      /* a corrupt draft is not worth blocking the form over */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!storageKey || Object.keys(values).length === 0) return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ values, idx }));
      } catch {
        /* storage full or blocked — the form still works */
      }
    }, 500);
    return () => window.clearTimeout(t);
  }, [values, idx, storageKey]);

  // The effect does only what an effect is for: moving focus after the question
  // has animated in.
  useEffect(() => {
    // The question is only visually hidden behind an announcement, so without
    // this guard the caret would jump into it and take focus off Continue.
    if (showAnnouncement) return;
    const t = window.setTimeout(
      () => (q.multiline ? areaRef.current : inputRef.current)?.focus({ preventScroll: true }),
      360,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, showAnnouncement]);

  function commit(raw?: string) {
    const v = (raw ?? draft).trim();
    if (q.confirm && v !== "yes") {
      setProblem(tl("Please confirm to continue."));
      return;
    }
    if (!v && !q.optional && !q.node && !q.confirm) {
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
    //
    // Reported under HONEYPOT_KEY, not under the field's own name. The input is
    // called "website" because that is what a bot expects to fill, and the
    // business intake asks a real question keyed `website` — so reporting it by
    // name would have overwritten a company's actual URL with the bot's.
    if (last) onComplete(hp ? { ...next, [HONEYPOT_KEY]: hp } : next);
    else {
      // Announce only when the next question opens a section the visitor has
      // not just been in.
      goTo(idx + 1, questions[idx + 1].section !== q.section);
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
      {/* The whole journey, up front.
          A conversation that only ever shows the next question tells you
          nothing about how long it is — so the sections are listed the way a
          booking flow lists its steps, and the one being answered is marked.
          Only completed sections are clickable: skipping ahead past required
          questions would put somebody in a section whose answers depend on ones
          they have not given. */}
      {sections.length > 1 && (
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {sections.map((name, i) => {
            const state = i < currentSection ? "done" : i === currentSection ? "current" : "todo";
            const firstOfSection = questions.findIndex((x) => x.section === name);
            return (
              <li key={name} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden className="text-ink/25">·</span>}
                <button
                  type="button"
                  disabled={state !== "done"}
                  onClick={() => goTo(firstOfSection)}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[var(--radius-button)] px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                    state === "current" && "bg-brand-50 text-brand-700",
                    state === "done" && "text-ink/60 hover:text-brand-700",
                    state === "todo" && "cursor-default text-ink/35",
                  )}
                >
                  {state === "done" && <Check className="h-3 w-3" />}
                  {name}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-4 flex items-center gap-4">
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

      {/* Everything answered so far, grouped the way the rail groups it, and
          still listed while the next section is being announced. Any line goes
          back to the question that produced it. */}
      {answered.length > 0 && (
        <div className="mt-7 space-y-5">
          {sections.map((name) => {
            const rows = answered
              .map((a, i) => ({ a, i }))
              .filter(({ a }) => a.section === name);
            if (rows.length === 0) return null;
            return (
              <div key={name}>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink/40">{name}</p>
                <div className="mt-2 space-y-1.5">
                  {rows.map(({ a, i }) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => goTo(i)}
                      className="group flex w-full items-baseline gap-4 text-left"
                      title={tl("Change this answer")}
                    >
                      <span className="w-32 shrink-0 truncate text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-600">
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
              </div>
            );
          })}
        </div>
      )}

      {/* The section, announced before its first question is asked. */}
      {showAnnouncement && (
        <div key={`s-${q.section}`} className="section-in mt-12 py-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-600">
            {tl("Section")} {currentSection + 1} {tl("of")} {sections.length}
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-navy-700 md:text-4xl">
            {q.section}
          </h2>
          <div aria-hidden className="rule-draw mt-5 h-px w-24 bg-brand-600" />
          <p className="mt-5 text-sm text-ink/65">
            {questionsInSection === 1
              ? tl("One question.")
              : `${questionsInSection} ${tl("questions.")}`}
          </p>
          <button
            type="button"
            autoFocus
            onClick={() => setAnnouncing(false)}
            className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            {currentSection === 0 ? tl("Begin") : tl("Continue")}
            <span aria-hidden className="text-base leading-none">&#8629;</span>
          </button>
        </div>
      )}

      {/* The question. Keyed so it remounts, and re-animates, per step. */}
      <div key={q.key} className={cn("q-in mt-10", showAnnouncement && "hidden")}>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink/55">{q.section}</p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-navy-700 md:text-3xl">
          {q.ask}{" "}
          {q.optional && (
            <span className="ml-1 align-middle text-sm font-normal text-ink/50">({tl("optional")})</span>
          )}
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

        {/* Whatever this step actually is, when it is not a question. */}
        {q.node && (
          <div className="mt-6">
            {typeof q.node === "function"
              ? q.node({ values, value: draft, set: (v) => { setDraft(v); setProblem(""); } })
              : q.node}
          </div>
        )}

        {q.confirm && (
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-paper-2/60 p-4 text-sm text-ink/75">
            <input
              type="checkbox"
              checked={draft === "yes"}
              onChange={(e) => { setDraft(e.target.checked ? "yes" : ""); setProblem(""); }}
              className="mt-0.5 h-4 w-4 accent-[var(--color-brand-600)]"
            />
            <span>{q.confirm}</span>
          </label>
        )}

        {/* The answer line. Absent for single-choice, where clicking answered
            it, and for node/confirm steps, which are not typed into. */}
        {!q.choices && !q.node && !q.confirm && (
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
                  "answer-line min-h-24 w-full resize-none pb-3 font-display leading-snug text-brand-700 caret-brand-600 transition-all duration-300 placeholder:text-ink/40",
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
                  "answer-line w-full pb-3 font-display text-brand-700 caret-brand-600 transition-all duration-300 placeholder:text-ink/40",
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
              {last ? submitLabel : tl("Enter")}
              {!submitting && !last && (
                <span aria-hidden className="text-base leading-none">&#8629;</span>
              )}
            </button>
          </div>
        )}

        {(q.node || q.confirm || q.multi) && (
          <button
            type="button"
            onClick={() => commit()}
            disabled={submitting}
            className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {last ? submitLabel : tl("Enter")}
            {!submitting && !last && <span aria-hidden className="text-base leading-none">&#8629;</span>}
          </button>
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
