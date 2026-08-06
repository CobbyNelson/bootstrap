"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Search } from "lucide-react";
import { LOCALES, LOCALE_META, DEFAULT_LOCALE, isRtl, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export type Entry = { source: string; context: string; value: string; machine: boolean };

/**
 * Side-by-side translation editor.
 *
 * English on the left, the target on the right, one row per string, grouped by
 * where it appears. The layout is the point: a translator reads down a column
 * and can see at a glance which rows are still English, which is the question
 * they actually have. A key-based table would show `home.subhead` and be
 * unusable by the person best placed to fix the wording.
 *
 * Empty means "use the shipped translation" rather than "blank" — the fallback
 * chain already resolves an absent row, so clearing a field is how you revert.
 * That avoids a second control whose meaning would need explaining.
 */
export function TranslationEditor({
  locale,
  entries,
}: {
  locale: Locale;
  entries: Entry[];
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(entries.map((e) => [e.source, e.value])),
  );
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const rtl = isRtl(locale);

  const dirty = useMemo(
    () => entries.filter((e) => (draft[e.source] ?? "") !== e.value),
    [draft, entries],
  );

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = entries.filter((e) => {
      if (onlyMissing && (draft[e.source] ?? "").trim()) return false;
      if (!q) return true;
      return e.source.toLowerCase().includes(q) || (draft[e.source] ?? "").toLowerCase().includes(q);
    });
    const by = new Map<string, Entry[]>();
    for (const e of filtered) {
      const list = by.get(e.context) ?? [];
      list.push(e);
      by.set(e.context, list);
    }
    return [...by.entries()];
  }, [entries, query, onlyMissing, draft]);

  const translated = entries.filter((e) => (draft[e.source] ?? "").trim()).length;

  async function save() {
    if (!dirty.length) return;
    setState("saving");
    try {
      const res = await fetch("/api/admin/translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          entries: dirty.map((e) => ({ source: e.source, value: draft[e.source] ?? "", context: e.context })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(body.error ?? "Could not save.");
        return;
      }
      setState("saved");
      setMessage(`${body.saved} saved${body.cleared ? `, ${body.cleared} reverted` : ""}. Live now.`);
    } catch {
      setState("error");
      setMessage("Could not reach the server.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[var(--radius-button)] border border-ink/10 bg-white p-1">
          {LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((l) => (
            <Link
              key={l}
              href={`/admin/translations?locale=${l}`}
              aria-current={l === locale ? "page" : undefined}
              className={cn(
                "rounded-[var(--radius-button)] px-3.5 py-1.5 text-sm font-medium transition-colors",
                l === locale ? "bg-brand-600 text-white" : "text-ink/60 hover:text-ink",
              )}
            >
              {LOCALE_META[l].label}
            </Link>
          ))}
        </div>

        <p className="text-sm text-ink/60">
          <span className="font-medium text-ink">{translated}</span> of {entries.length} translated
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[14rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search English or translated text…"
            className="w-full rounded-[var(--radius-button)] border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-ink/70">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          Untranslated only
        </label>
        <button
          type="button"
          onClick={save}
          disabled={!dirty.length || state === "saving"}
          className="rounded-[var(--radius-button)] bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "saving" ? "Saving…" : dirty.length ? `Save ${dirty.length}` : "Saved"}
        </button>
      </div>

      {message && (
        <p
          role={state === "error" ? "alert" : undefined}
          className={cn("text-sm", state === "error" ? "font-medium text-brand-700" : "text-ink/60")}
        >
          {state === "saved" && <Check className="mr-1 inline h-4 w-4 text-emerald-600" />}
          {message}
        </p>
      )}

      {groups.length === 0 && <p className="py-10 text-sm text-ink/55">Nothing matches.</p>}

      {groups.map(([context, rows]) => (
        <section key={context} className="rounded-2xl border border-ink/[0.07] bg-white p-5">
          <h2 className="label-cta mb-3 text-[0.62rem] text-ink/55">{context}</h2>
          <ul className="divide-y divide-ink/[0.06]">
            {rows.map((e) => {
              const value = draft[e.source] ?? "";
              return (
                <li key={e.source} className="grid gap-3 py-3 md:grid-cols-2 md:gap-5">
                  {/* Source is read-only: editing English here would orphan
                      every translation keyed to it. */}
                  <p className="text-sm leading-relaxed text-ink/70">{e.source}</p>
                  <div>
                    <textarea
                      value={value}
                      onChange={(ev) => setDraft((d) => ({ ...d, [e.source]: ev.target.value }))}
                      rows={value.length > 90 ? 3 : 1}
                      // The field is typed in the target language, so it has to
                      // be laid out in that language's direction — an Arabic
                      // translator typing into a left-aligned box is fighting
                      // the tool.
                      dir={rtl ? "rtl" : "ltr"}
                      lang={locale}
                      placeholder={e.source}
                      className={cn(
                        "w-full resize-y rounded-[var(--radius-button)] border px-3 py-2 text-sm leading-relaxed focus:outline-none",
                        value.trim()
                          ? "border-ink/15 focus:border-brand-500"
                          : "border-dashed border-ink/20 bg-paper-2/40",
                      )}
                    />
                    {!value.trim() && (
                      <p className="mt-1 text-[0.68rem] text-ink/45">
                        Shows the English above until translated.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
