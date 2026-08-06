import fs from "node:fs";
import path from "node:path";

/**
 * Fail the build when user-facing copy is rendered without going through the
 * translator.
 *
 * This exists because the same fault recurred eight times: a string was
 * extracted, translated, reviewed and seeded, and then rendered in English
 * because nothing at the render site called tl(). Every single one was found by
 * opening a page in a browser — never by a test, because there was no test that
 * could fail. Coverage percentages could not catch it either: they measure how
 * much of the registry has a translation, not whether anything reads it.
 *
 * So the check is deliberately not about translation. It asks one question of
 * every file that renders localised UI: does this literal reach a reader
 * without passing through tl(), t.tl() or translateContent()?
 *
 *   npx tsx scripts/check-i18n.mts          # report and exit non-zero
 *   npx tsx scripts/check-i18n.mts --list   # report, always exit 0
 *
 * ADDING A FILE TO ALLOWLIST is a decision, not a formality: it says the copy
 * in it is genuinely language-neutral, or the surface is staff-only. Anything
 * a visitor reads belongs in the translator instead.
 */

const ROOTS = ["components", "app/[locale]"];

/**
 * Surfaces nobody browses in another language.
 *
 * Admin and dashboard are staff tools. The pre-launch gate is a holding page.
 * The i18n plumbing itself renders language names, which are written in their
 * own language by definition.
 */
const ALLOW_DIRS = [
  "components/admin",
  "components/dashboard",
  "components/i18n",
  "components/analytics",
  "components/providers",
  "components/seo",
  "app/[locale]/(site)/legal", // language-of-record notice, deliberately English
];

const ALLOW_FILES = new Set<string>([
  // Renders the visitor's own language names — always in that language.
  "components/layout/theme-toggle.tsx",
]);

/** Text that is not copy: codes, symbols, numbers, single lowercase tokens. */
function isCopy(s: string): boolean {
  const t = s.trim();
  if (t.length < 4) return false;
  if (!/[a-z]{2}/.test(t)) return false;                 // needs real letters
  if (/^[a-z][a-z0-9-]*$/.test(t)) return false;          // css-ish / api token
  if (/^[a-z]{2,3}_[a-z_]+$/.test(t)) return false;       // field identifiers
  if (/^[a-z]+[A-Z][A-Za-z]*$/.test(t)) return false;     // camelCase
  if (/^[#$€£₵]/.test(t)) return false;
  if (/^\d/.test(t)) return false;
  if (/^https?:|^\/|^@/.test(t)) return false;

  // Reject code. `useState<Errors>(...)` reads as a JSX text node to a regex —
  // the generic's angle brackets are indistinguishable from tags — so anything
  // carrying operator or call syntax is source, not copy.
  if (/[;={}()[\]]|=>|\+\+|&&|\|\|/.test(t)) return false;
  if (/\b(const|let|return|function|await|async|import|export|typeof)\b/.test(t)) return false;

  // Real copy is either a phrase, or a capitalised label.
  return /\s/.test(t) || /^[A-Z]/.test(t);
}

type Finding = { file: string; line: number; text: string; kind: string };

function scan(file: string): Finding[] {
  const src = fs.readFileSync(file, "utf8");
  const out: Finding[] = [];
  const lineOf = (idx: number) => src.slice(0, idx).split("\n").length;

  // Strip the parts of the file that cannot render: comments, and the props
  // that carry machine-read values rather than words.
  const cleaned = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m) => " ".repeat(m.length));

  // Bare JSX text nodes. Anything wrapped already contains { }, which the
  // pattern excludes, so a translated string can never be reported.
  for (const m of cleaned.matchAll(/>([^<>{}]+)</g)) {
    const text = m[1].replace(/\s+/g, " ").trim();
    if (isCopy(text)) out.push({ file, line: lineOf(m.index!), text, kind: "jsx-text" });
  }

  // Copy passed as a literal prop.
  const PROPS = "title|subtitle|label|description|placeholder|heading|eyebrow|caption|summary|alt";
  for (const m of cleaned.matchAll(new RegExp(`(?:${PROPS})=\\{?"([^"]{4,})"`, "g"))) {
    if (isCopy(m[1])) out.push({ file, line: lineOf(m.index!), text: m[1], kind: "literal-prop" });
  }

  return out;
}

function walk(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

const listOnly = process.argv.includes("--list");
const files = ROOTS.flatMap((r) => walk(r))
  .map((f) => f.split(path.sep).join("/"))
  .filter((f) => !ALLOW_DIRS.some((d) => f.startsWith(d)))
  .filter((f) => !ALLOW_FILES.has(f));

const findings = files.flatMap(scan);

// Group by file: one unwired component produces dozens of lines, and the
// actionable unit is the component, not the string.
const byFile = new Map<string, Finding[]>();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file)!.push(f);
}

if (byFile.size === 0) {
  console.log("i18n check: no untranslated rendered copy found");
  process.exit(0);
}

const total = findings.length;
console.log(`i18n check: ${total} untranslated string(s) rendered in ${byFile.size} file(s)\n`);
for (const [file, list] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${file}  (${list.length})`);
  for (const f of list.slice(0, 4)) {
    console.log(`    ${String(f.line).padStart(4)}  ${JSON.stringify(f.text.slice(0, 68))}`);
  }
  if (list.length > 4) console.log(`    …and ${list.length - 4} more`);
}
console.log(
  "\nWrap each in tl() / t.tl(), pass its data through translateContent(),\n" +
  "or add the file to ALLOW_DIRS / ALLOW_FILES in this script with a reason.",
);

process.exit(listOnly ? 0 : 1);
