import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { translatableStrings } from "@/lib/i18n/store";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { TranslationEditor, type Entry } from "@/components/admin/translation-editor";

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
      <TranslationEditor locale={locale} entries={entries} />
    </div>
  );
}
