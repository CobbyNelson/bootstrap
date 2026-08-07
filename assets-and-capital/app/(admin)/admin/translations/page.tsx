import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { translatableStrings } from "@/lib/i18n/store";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { TranslationEditor, type Entry } from "@/components/admin/translation-editor";
import { outstandingNotes } from "@/lib/legal-docs";

export const metadata: Metadata = { title: "Translations" };
// Always the current rows: an editor showing a cached version of what it is
// about to overwrite is how edits get lost.
export const dynamic = "force-dynamic";

const ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) redirect("/admin");

  const { locale: raw } = await searchParams;
  const locale: Locale = raw && isLocale(raw) && raw !== "en" ? raw : "fr";

  const [rows, strings] = await Promise.all([
    prisma.translation.findMany({ where: { locale }, select: { source: true, value: true, machine: true } }),
    Promise.resolve(translatableStrings()),
  ]);

  const notes = outstandingNotes();
  const saved = new Map(rows.map((r) => [r.source, r]));
  const entries: Entry[] = strings.map((s) => ({
    source: s.source,
    context: s.context,
    value: saved.get(s.source)?.value ?? "",
    machine: saved.get(s.source)?.machine ?? false,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-700">Translations</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/65">
          English on the left, the translation on the right. Saving publishes immediately — the
          pages are prerendered, and saving drops their cache so the change is live on the next
          view. Clearing a field reverts that string to the version that ships with the site.
        </p>
      </div>
      {notes.length > 0 && (
        /*
         * Drafting notes, moved here from the public page.
         *
         * These `[CONFIRM: …]` markers were rendering on the live privacy
         * policy where any visitor could read them. They are questions for
         * counsel, so they belong to the people who can answer them — but
         * deleting them silently would let a legal gap vanish, so they are
         * listed here instead.
         */
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-5">
          <p className="text-sm font-semibold text-amber-900">
            {notes.length} unanswered drafting note{notes.length === 1 ? "" : "s"} in the legal documents
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/70">
            Hidden from the public pages, which is where they used to appear. Each is a question for
            counsel — answer it in lib/legal-docs.ts and the note disappears from this list.
          </p>
          <ul className="mt-3 space-y-2">
            {notes.map((n) => (
              <li key={n.slug + n.note} className="text-xs leading-relaxed text-amber-900/85">
                <span className="font-medium">{n.title}</span> — {n.note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <TranslationEditor locale={locale} entries={entries} />
    </div>
  );
}
