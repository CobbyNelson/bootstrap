"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTl } from "@/components/i18n/locale-provider";
import { filterField, validateField, HONEYPOT_KEY, type FieldKind, type Rule } from "@/lib/form-validation";

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
  /**
   * Sits against the answer as a unit rather than in the placeholder — "$" in
   * front of a figure, "%" behind one. A currency hint that lives in the
   * placeholder disappears the moment somebody types, which is exactly when
   * they need to know which unit is expected.
   */
  prefix?: string;
  suffix?: string;
  /**
   * What this field will accept, applied as it is typed.
   *
   * Rejecting at submit tells somebody their answer was wrong after they
   * finished writing it; refusing the keystroke tells them while their finger
   * is still on the key. Control characters are stripped from every field
   * regardless — they are invisible, they survive a copy-paste out of a PDF,
   * and they break everything downstream that assumes text is text.
   */
  accept?: FieldKind;
  /**
   * The rule this answer is held to, shared verbatim with the server.
   *
   * `accept` only refuses characters; this parses. It is what knows that a
   * website has to be a real address on http or https, that an email needs a
   * domain that could exist, and that a raise of "1e9" is not a number somebody
   * meant to type. Set it on anything that leaves the browser.
   */
  rule?: Rule;
  /**
   * What the recap calls this answer.
   *
   * Falls back to the key, which was the only option and is wrong the moment a
   * key is not already a plain English word: the investor mandate uses branch
   * prefixes, so `pe_irr_min` was rendering to somebody as "PE_IRR_MIN".
   * Nothing secret — a field name is in the DOM and in the request body either
   * way — but internal naming has no business on a form somebody is filling in.
   */
  label?: string;
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

/** Re-exported so form components keep one import. Defined in the shared
 * module, because the server route checks it too. */
export { HONEYPOT_KEY };

/**
 * The character tables live in lib/form-validation.ts, not in this file.
 *
 * They used to be defined here, which quietly made them a property of the UI —
 * and a rule that exists only in the UI is not a rule. Disable JavaScript, or
 * post to the endpoint directly, and every one of them disappears. The same
 * module now runs on the server against the posted body, so a submission that
 * never touched this component is held to the identical standard.
 *
 * The division of labour: `filterField` refuses the keystroke, `validateField`
 * refuses the answer. The first is a courtesy; the second is the rule.
 */
/**
 * What this field refuses on a keystroke.
 *
 * DERIVED from the rule rather than declared beside it. `accept` and `rule`
 * were two separate properties that had to be kept in agreement by hand, and
 * four fields on the investor mandate promptly disagreed: they carried a rule
 * that refused digits on commit while accepting every character as it was
 * typed, so somebody could fill in a name, press Enter, and only then be told.
 *
 * A question can still override it — a company name is filtered more loosely
 * than it is judged — but forgetting is no longer possible.
 */
const filterKindOf = (q: Question) => q.accept ?? q.rule?.kind;

const clean = (raw: string, accept?: Question["accept"]) => filterField(raw, accept);

/**
 * A readable name for an answer, when the question did not give one.
 *
 * Splits camelCase, drops a leading branch prefix, and turns underscores into
 * spaces — so `contactName` reads "contact Name" and `pe_irr_min` reads
 * "irr min" rather than the raw key. A question that wants better than this
 * should set `label`.
 */
function labelFromKey(key: string): string {
  return key
    .replace(/^(pe|re|fd)_/, "")
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

/** Rows before a section spills into the next column. */
const COLUMN_ROWS = 5;

/** Grows the answer as it is typed, so a short one looks considered rather than lost. */
function sizeFor(len: number): string {
  if (len > 90) return "text-xl md:text-2xl";
  if (len > 45) return "text-2xl md:text-3xl";
  return "text-3xl md:text-4xl";
}

export function Conversation({
  questions,
  onComplete,
  /** The form's own heading, above the sections. */
  title,
  intro,
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
  title?: string;
  intro?: string;
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
  /** Set while the outgoing question plays its exit, before the next arrives. */
  const [leaving, setLeaving] = useState(false);
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

  /**
   * Cmd/Ctrl + Backspace steps back a question.
   *
   * Bound to the document rather than the input, so it works while a choice
   * step has focus on a chip and while a section is being announced — the
   * places somebody is most likely to realise they got the last one wrong.
   * Plain Backspace is left alone: it is how you delete a character.
   */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Backspace" || !(e.metaKey || e.ctrlKey)) return;
      if (showAnnouncement) {
        // Dismiss the announcement rather than leaving the section — the
        // visitor is asking to get on with it, or to go back past it.
        e.preventDefault();
        setAnnouncing(false);
        return;
      }
      if (idx === 0) return;
      e.preventDefault();
      goTo(idx - 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, showAnnouncement, values]);

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

  /**
   * A keystroke, with the field's filter applied — and a word about it.
   *
   * Silently dropping refused characters was worse than it looked. Typing
   * "88987njbj@@#&&8" into an entity name quietly became "88987njbj&&8", and
   * because the value then equalled its own filtered form, the server's
   * "refuse anything that had to be cleaned" rule had nothing left to refuse.
   * The client was laundering input into a shape the server would accept.
   *
   * The filter still runs — the character never reaches state, which is the
   * point of having it — but now it says so. Same principle as the server:
   * refusing out loud beats cleaning in silence.
   */
  function onTyped(raw: string) {
    const cleaned = clean(raw, filterKindOf(q));
    setDraft(cleaned);
    setProblem(cleaned === raw ? "" : tl("That character isn't accepted here."));
  }

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
      // The shared rule first, because it is the one the server will also
      // apply — failing here means the submission would have been refused
      // anyway, and it is kinder to say so now than after the last question.
      if (q.rule) {
        const verdict = validateField(v, q.rule);
        if (!verdict.ok) {
          setProblem(tl(verdict.error));
          return;
        }
      }
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
      // Let the answer leave before the next question arrives. The delay
      // matches the exit animation; anything longer is a pause the visitor
      // feels, anything shorter cuts the movement off mid-way.
      setLeaving(true);
      window.setTimeout(() => {
        setLeaving(false);
        // Announce only when the next question opens a section the visitor has
        // not just been in.
        goTo(idx + 1, questions[idx + 1].section !== q.section);
      }, 240);
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
      {title && (
        <div className="mb-8">
          <h2 className="font-display text-3xl font-semibold leading-tight text-navy-700 md:text-4xl">{title}</h2>
          {intro && <p className="mt-2 max-w-2xl text-sm text-ink/65">{intro}</p>}
        </div>
      )}

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

      {/* Everything answered so far, as columns that scroll sideways.
          Stacked, nineteen answers become a wall above the question you are
          trying to read. As columns it stays one band deep however long the
          form is, and the rows are ruled so a value lines up with its label
          instead of floating between two. */}
      {answered.length > 0 && (
        <div className="answer-rail -mx-1 mt-7 flex gap-8 overflow-x-auto px-1 pb-2">
          {/* A section longer than COLUMN_ROWS continues into another column
              rather than growing downwards. Ten answers in one column is the
              wall this was meant to replace, just turned sideways — and it is
              what makes the sideways scroll do any work. */}
          {sections.flatMap((name) => {
            const rows = answered.map((a, i) => ({ a, i })).filter(({ a }) => a.section === name);
            if (rows.length === 0) return [];
            const chunks: typeof rows[] = [];
            for (let i = 0; i < rows.length; i += COLUMN_ROWS) chunks.push(rows.slice(i, i + COLUMN_ROWS));
            return chunks.map((chunk, ci) => ({ name, rows: chunk, ci, of: chunks.length }));
          }).map(({ name, rows, ci, of }, gi) => {
            return (
              <div
                key={`${name}-${ci}`}
                className={cn(
                  "min-w-[15rem] flex-none sm:min-w-[18rem]",
                  // A rule between groups, not around them — the first column
                  // starts at the edge, so a border there would read as a box.
                  gi > 0 && "border-l border-ink/[0.09] pl-8",
                )}
              >
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  {ci === 0 ? name : <span className="text-ink/30">{name} {tl("cont.")}</span>}
                  {of > 1 && ci === 0 && <span className="ml-1 text-ink/30">→</span>}
                </p>
                <div className="mt-2 divide-y divide-ink/[0.07] border-t border-ink/[0.07]">
                  {rows.map(({ a, i }) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => goTo(i)}
                      className="group flex w-full items-baseline gap-3 py-2 text-left"
                      title={tl("Change this answer")}
                    >
                      <span className="w-24 shrink-0 truncate text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink/45">
                        {a.label ?? labelFromKey(a.key)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink/75 transition-colors group-hover:text-brand-700">
                        {values[a.key]
                          ? `${a.prefix ?? ""}${values[a.key]}${a.suffix ?? ""}`
                          : <em className="not-italic text-ink/40">{tl("skipped")}</em>}
                      </span>
                      <span aria-hidden className="shrink-0 text-[0.6rem] text-ink/45 opacity-0 transition-opacity group-hover:opacity-100">
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
      <div key={q.key} className={cn(leaving ? "q-out" : "q-in", "mt-10", showAnnouncement && "hidden")}>
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
          <div className="mt-8 flex items-end gap-4">
            {q.prefix && (
              <span aria-hidden className={cn("shrink-0 pb-3 font-display text-ink/35", sizeFor(draft.length))}>
                {q.prefix}
              </span>
            )}
            {q.multiline ? (
              <textarea
                ref={areaRef}
                id={`q-${q.key}`}
                rows={2}
                value={draft}
                placeholder={q.placeholder}
                onChange={(e) => { onTyped(e.target.value); }}
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
                onChange={(e) => { onTyped(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
                aria-label={q.ask}
                aria-invalid={Boolean(problem)}
                className={cn(
                  "answer-line w-full pb-3 font-display text-brand-700 caret-brand-600 transition-all duration-300 placeholder:text-ink/40",
                  sizeFor(draft.length),
                )}
              />
            )}

            {q.suffix && (
              <span aria-hidden className={cn("shrink-0 pb-3 font-display text-ink/35", sizeFor(draft.length))}>
                {q.suffix}
              </span>
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
