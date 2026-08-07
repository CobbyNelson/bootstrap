import "server-only";
import { LOCALE_META, type Locale } from "./config";

/**
 * Machine translation for strings nobody has translated yet.
 *
 * The point is not to replace a translator. It is that a string added on
 * Tuesday should not read in English on the French site until someone gets to
 * it on Friday — the fallback chain renders English, which looks like a bug to
 * a visitor and is invisible to everyone else. A machine draft marked
 * `machine: true` puts something readable on the page and leaves an explicit
 * "not reviewed" flag in the editor for a human to work down.
 *
 * Every row it writes is a DRAFT. The editor already distinguishes machine from
 * human, and seeding never overwrites a human edit.
 */

/** Set ANTHROPIC_API_KEY to enable. Absent is a supported state, not an error. */
export function machineTranslationAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Placeholders must survive translation, or the sentence breaks.
 *
 * `"{name} is seeking {ask} in {instrument}"` renders the literal text
 * "{name}" if a translation drops or renames a hole. Every batch is checked
 * against its source and a translation with a different set of placeholders is
 * REJECTED rather than stored — a missing translation falls back to English,
 * which is recoverable; a corrupted one reaches a reader looking correct.
 */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

function placeholdersMatch(source: string, candidate: string): boolean {
  const a = placeholders(source);
  const b = placeholders(candidate);
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

const SYSTEM = `You translate interface copy for a private-capital marketplace.

Rules, in order of importance:
1. Preserve every {placeholder} EXACTLY — same spelling, same braces. They are
   substituted with live values at render time. Never translate, reorder the
   characters inside, or drop one. You MAY move a placeholder within the
   sentence if the target language needs it elsewhere.
2. Do not translate: brand names (Assets & Capital), product tier names
   (Standard, Silver, Gold, Platinum), business names, or people's names.
3. Keep the register formal and financial. This is a site where the copy is
   effectively a financial representation.
4. Preserve leading and trailing whitespace, and any punctuation the source
   opens or closes with.
5. Return ONLY the translation. No quotes around it, no commentary, no
   alternatives.`;

type Result = { source: string; value: string }[];

/**
 * Translate a batch. Returns only the entries that came back usable — a
 * rejected placeholder mismatch, an empty answer or an unchanged string is
 * dropped, so the caller stores fewer rows rather than bad ones.
 */
export async function machineTranslate(sources: string[], locale: Locale): Promise<Result> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !sources.length) return [];

  const language = LOCALE_META[locale].english;
  const numbered = sources.map((s, i) => `${i + 1}. ${s}`).join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content:
            `Translate each numbered line into ${language}. Return the same numbering, ` +
            `one translation per line, nothing else.\n\n${numbered}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Translation API returned ${res.status}`);
  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (body.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");

  // Parse back by line number rather than by position: a model that merges or
  // splits a line would otherwise shift every translation after it onto the
  // wrong source, which is the one failure mode that produces plausible,
  // confidently wrong output.
  const byIndex = new Map<number, string>();
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(\d+)\.\s*(.+?)\s*$/);
    if (m) byIndex.set(Number(m[1]), m[2]);
  }

  const out: Result = [];
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const value = byIndex.get(i + 1);
    if (!value || value === source) continue;
    if (!placeholdersMatch(source, value)) continue;
    out.push({ source, value });
  }
  return out;
}

/** How many of a batch were rejected, for reporting honestly to the admin. */
export function rejectedCount(sources: string[], results: Result): number {
  return sources.length - results.length;
}
