import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

/**
 * Load translations from a JSON file into the Translation table.
 *
 *   npx tsx scripts/seed-translations.mts /tmp/translations.json
 *
 * Input shape: { "fr": { "English source": "French text", ... }, "es": {...} }
 *
 * Every row it writes is marked machine:true. That flag is the whole point of
 * this script existing rather than a one-off insert: it lets the editor show
 * which strings have been through a human and which have not, so a reviewer can
 * work down the unverified ones instead of re-reading everything.
 *
 * It will NOT overwrite a row a human has edited (machine:false). Re-running
 * after someone has corrected a translation must not undo their correction —
 * that is the failure mode that makes people stop trusting a seed script.
 */

const prisma = new PrismaClient();

async function main() {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) {
    console.error("usage: tsx scripts/seed-translations.mts <translations.json>");
    process.exit(1);
  }

  const data: Record<string, Record<string, string>> = JSON.parse(fs.readFileSync(file, "utf8"));
  // Imported, not read off disk: it is a TypeScript module and this script runs
  // under tsx, so the import is both simpler and type-checked.
  const { TRANSLATABLE: registry } = await import("../lib/i18n/translatable");

  let inserted = 0;
  let updated = 0;
  let skippedHuman = 0;
  let skippedSame = 0;

  for (const [locale, entries] of Object.entries(data)) {
    for (const [source, value] of Object.entries(entries)) {
      if (!source.trim() || !value.trim()) continue;
      // Nothing to store when the translation is identical to the source — the
      // fallback chain already renders English, and a row that says "English"
      // just makes the editor look complete when it is not.
      if (source.trim() === value.trim()) {
        skippedSame++;
        continue;
      }

      const existing = await prisma.translation.findUnique({
        where: { locale_source: { locale, source } },
        select: { machine: true, value: true },
      });

      if (existing && !existing.machine) {
        skippedHuman++;
        continue;
      }

      const context = registry.find((r) => r.source === source)?.context ?? null;

      if (existing) {
        await prisma.translation.update({
          where: { locale_source: { locale, source } },
          data: { value, context, machine: true },
        });
        updated++;
      } else {
        await prisma.translation.create({
          data: { locale, source, value, context, machine: true },
        });
        inserted++;
      }
    }
  }

  console.log(`inserted ${inserted}, updated ${updated}`);
  console.log(`skipped ${skippedHuman} human-edited, ${skippedSame} identical-to-source`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
