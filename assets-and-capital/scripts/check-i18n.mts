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

/**
 * JSX escapes, resolved to the characters they stand for.
 *
 * Without this the check went BLIND to any sentence containing one: `&apos;`
 * carries a semicolon, semicolons mean code, and so every line with an
 * apostrophe in it — "Hello, I&apos;m Kwaku", most of the chat greeting, a
 * quarter of the marketing copy — was silently skipped. Twenty-four lines were
 * hiding behind that one character.
 *
 * The decoding is also what makes wrapping correct rather than merely detected:
 * inside a tl() call the text is a JavaScript string, where `&apos;` is five
 * literal characters rather than an apostrophe.
 */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&apos;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
};

export function decodeEntities(s: string): string {
  return s.replace(/&[a-z]+;/g, (m) => ENTITIES[m] ?? m);
}

/**
 * A Tailwind class list, which the ternary pass would otherwise report as copy.
 *
 * `cn(active ? "bg-brand-50 text-brand-700" : "text-ink/70")` has exactly the
 * shape of a label that flips on state, because it IS one — just for styling.
 * Matching on utility prefixes rather than on "looks lowercase" keeps real
 * lowercase copy ("private-capital marketplace") out of the exclusion.
 */
const TW = new RegExp(
  "^(bg|text|border|ring|from|to|via|hover|focus|active|group|peer|dark|sm|md|lg|xl|" +
  "p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|w|h|min|max|flex|grid|col|row|gap|space|" +
  "rounded|shadow|opacity|z|inset|top|bottom|left|right|translate|scale|rotate|" +
  "transition|duration|ease|animate|font|leading|tracking|overflow|cursor|select|" +
  "outline|underline|items|justify|self|place|order|object|fill|stroke)[-:]",
);

function looksLikeClassNames(t: string): boolean {
  const tokens = t.split(/\s+/);
  return tokens.some((tok) => TW.test(tok));
}

/** Text that is not copy: codes, symbols, numbers, single lowercase tokens. */
function isCopy(s: string): boolean {
  const t = decodeEntities(s).trim();
  if (looksLikeClassNames(t)) return false;
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
  // Parentheses alone are NOT code. "I am a(n)" was rejected by this rule and
  // rendered in English on the contact form in all three languages, with a
  // translation sitting in the registry the whole time. What marks source is a
  // CALL — an identifier immediately followed by `(` — or the other operators.
  if (/[;={}[\]]|=>|\+\+|&&|\|\|/.test(t)) return false;
  // Empty or unbalanced parentheses are code caught mid-expression — the
  // fragment "(), sector: new Set" is what a regex sees of `new Set(), sector:
  // new Set(`. Copy that legitimately uses parentheses closes them around
  // words: "a(n)", "(optional)".
  // A text node never opens with a closing bracket or ends with an opening one:
  // ") : interested ? (" is a JSX ternary, sliced between a `>` and a `<`.
  if (/^[)\]}]/.test(t) || /[([{]$/.test(t)) return false;
  if (/\(\s*\)/.test(t)) return false;
  if ((t.match(/\(/g) ?? []).length !== (t.match(/\)/g) ?? []).length) return false;
  if (/\b(const|let|return|function|await|async|import|export|typeof)\b/.test(t)) return false;

  // A type intersection or union between two generics reads as a text node for
  // the same reason: `HTMLAttributes<X> & VariantProps<Y>` closes one angle
  // bracket and opens another, so `& VariantProps` looks like copy between two
  // tags. Both real cases were exactly this shape — a lone operator followed by
  // a PascalCase type — which no sentence a visitor reads ever is.
  if (/^[&|]\s*[A-Z][A-Za-z]*$/.test(t)) return false;

  // Real copy is either a phrase, or a capitalised label.
  return /\s/.test(t) || /^[A-Z]/.test(t);
}

type Finding = { file: string; line: number; text: string; kind: string };

function scan(file: string): Finding[] {
  const src = fs.readFileSync(file, "utf8");
  const out: Finding[] = [];
  const lineOf = (idx: number) => src.slice(0, idx).split("\n").length;

  /**
   * Per-line opt-out: `i18n-exempt` in a comment on the string's line or the
   * one above it.
   *
   * Some copy is genuinely the same in every language — a brand name, a product
   * name — and allowlisting the whole FILE to excuse one such string would
   * silently excuse every future string added beside it. Marking the line keeps
   * the exemption where the reader is, next to the reason someone had to write.
   *
   * Collected before comments are stripped, for the obvious reason.
   */
  const exempt = new Set<number>();
  const srcLines = src.split("\n");
  srcLines.forEach((line, i) => {
    if (!line.includes("i18n-exempt")) return;
    exempt.add(i + 1); // the marker's own line
    // Then the next line that is actually CODE. A reason worth writing rarely
    // fits on one line, and stopping at i+2 exempted the second line of the
    // comment instead of the string underneath it.
    for (let j = i + 1; j < srcLines.length; j++) {
      const t = srcLines[j].trim();
      if (!t || t.startsWith("//") || t.startsWith("/*") || t.startsWith("*") || t.startsWith("{/*")) continue;
      exempt.add(j + 1);
      break;
    }
  });

  // Strip the parts of the file that cannot render: comments, and the props
  // that carry machine-read values rather than words.
  const cleaned = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m) => " ".repeat(m.length));

  // Bare JSX text nodes. Anything wrapped already contains { }, which the
  // pattern excludes, so a translated string can never be reported.
  for (const m of cleaned.matchAll(/>([^<>{}]+)</g)) {
    const text = decodeEntities(m[1].replace(/\s+/g, " ").trim());
    const line = lineOf(m.index!);
    if (isCopy(text) && !exempt.has(line)) out.push({ file, line, text, kind: "jsx-text" });
  }

  /**
   * Copy inside a JSX expression: `{saved ? "Saved" : "Save"}`.
   *
   * The text-node pattern above excludes `{` and `}` by design — that is what
   * stops it reporting an already-wrapped string — and the cost is that it
   * cannot see INTO an expression either. Every button whose label flips on
   * state was therefore invisible, on pages that were otherwise fully wired.
   *
   * Anchored on the ternary and `&&` because those are what actually render a
   * literal. Matching a bare `: "..."` instead would report every object
   * literal in the content files, which are translated by translateContent and
   * are not a defect.
   */
  const STR = `"((?:[^"\\\\]|\\\\.){4,}?)"`;
  const BRANCH = `(?:tl\\([^)]*\\)|t\\.tl\\([^)]*\\)|${STR})`;
  for (const m of cleaned.matchAll(new RegExp(`\\?\\s*${BRANCH}\\s*:\\s*${BRANCH}`, "g"))) {
    for (const g of [m[1], m[2]]) {
      const text = g && decodeEntities(g);
      const line = lineOf(m.index!);
      if (text && isCopy(text) && !exempt.has(line)) {
        out.push({ file, line, text, kind: "jsx-ternary" });
      }
    }
  }
  for (const m of cleaned.matchAll(new RegExp(`&&\\s*${STR}\\s*[)}]`, "g"))) {
    const text = decodeEntities(m[1]);
    const line = lineOf(m.index!);
    if (isCopy(text) && !exempt.has(line)) out.push({ file, line, text, kind: "jsx-and" });
  }

  /**
   * Copy read out of an object and rendered raw: `{b.desc}`, `{step.title}`.
   *
   * No literal appears at the render site at all, so nothing above can see it —
   * and this is where most of the copy on a form-heavy page actually lives. The
   * investor wizard's three branch cards, every step heading, the compliance
   * table's labels: all held in const arrays, all English in three languages.
   *
   * There are two legitimate ways to translate such data, and only one of them
   * is visible here. A file that calls translateContent has already translated
   * the whole object before it reaches JSX, so `{b.desc}` there is correct and
   * must not be reported — which is why this pass is skipped for those files
   * entirely rather than trying to prove it property by property.
   */
  // `name` is deliberately absent. On this codebase it is almost never copy:
  // it holds a business ("Sahara Solar Grid"), a person, a payment provider, a
  // form field id, or the site itself — proper nouns and identifiers, which
  // translating would corrupt rather than localise. Including it produced 14
  // findings, every one of them wrong.
  const COPY_PROPS = "title|subtitle|label|desc|description|blurb|body|text|copy|answer|question|summary|caption|intro|heading";
  if (!src.includes("translateContent")) {
    for (const m of cleaned.matchAll(new RegExp(`\\{\\s*(\\w+)\\.(${COPY_PROPS})\\s*\\}`, "g"))) {
      const line = lineOf(m.index!);
      if (!exempt.has(line)) {
        out.push({ file, line, text: `${m[1]}.${m[2]}`, kind: "raw-object-copy" });
      }
    }
  }

  // Copy passed as a literal prop.
  // Every prop name that was found carrying a sentence, not the ten that were
  // guessed. `desc=` alone hid a paragraph on the marketplace detail page for as
  // long as this check has existed — it reported zero while a subscription
  // pitch sat there in English on every localised page.
  //
  // `d` is deliberately absent: it carries SVG path data, which starts with a
  // capital M and contains spaces, and so would pass every copy test there is.
  const PROPS =
    "title|subtitle|label|description|placeholder|heading|eyebrow|caption|summary|alt|" +
    "desc|tag|subject|intro|empty|overall|delta|blurb|note|hint|cta|message|error";
  for (const m of cleaned.matchAll(new RegExp(`(?:${PROPS})=\\{?"([^"]{4,})"`, "g"))) {
    const line = lineOf(m.index!);
    if (isCopy(m[1]) && !exempt.has(line)) out.push({ file, line, text: m[1], kind: "literal-prop" });
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
const updateBaseline = process.argv.includes("--update-baseline");

const files = ROOTS.flatMap((r) => walk(r))
  .map((f) => f.split(path.sep).join("/"))
  .filter((f) => !ALLOW_DIRS.some((d) => f.startsWith(d)))
  .filter((f) => !ALLOW_FILES.has(f));

const findings = files.flatMap(scan);

const byFile = new Map<string, Finding[]>();
for (const f of findings) {
  if (!byFile.has(f.file)) byFile.set(f.file, []);
  byFile.get(f.file)!.push(f);
}

/**
 * A ratchet, not a gate.
 *
 * There are 174 of these today across 38 files. Failing on any of them would
 * mean a red build from the first commit, and a check that is red on arrival
 * gets switched off within a week — so it would protect nothing.
 *
 * Instead the baseline records what each file owes right now, and the check
 * fails only when a file gets WORSE or a new one appears. Existing debt is
 * paid down at whatever pace suits; new debt cannot be added. Every fix
 * lowers the number, and lowering it is what regenerating the baseline is for.
 */
const BASELINE_PATH = "scripts/i18n-baseline.json";
type Baseline = { total: number; files: Record<string, number> };

const current: Baseline = {
  total: findings.length,
  files: Object.fromEntries([...byFile.entries()].map(([f, l]) => [f, l.length])),
};

if (updateBaseline) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + "\n");
  console.log(`i18n baseline written: ${current.total} string(s) in ${byFile.size} file(s)`);
  process.exit(0);
}

function report() {
  for (const [file, list] of [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${file}  (${list.length})`);
    for (const f of list.slice(0, 4)) {
      console.log(`    ${String(f.line).padStart(4)}  ${JSON.stringify(f.text.slice(0, 68))}`);
    }
    if (list.length > 4) console.log(`    …and ${list.length - 4} more`);
  }
}

// --json emits every finding, untruncated, for tooling that has to act on them
// rather than read them. --list summarises for a human and caps each file at
// four; a codemod needs all of them.
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(findings, null, 2));
  process.exit(0);
}

if (listOnly) {
  console.log(`i18n check: ${current.total} untranslated string(s) in ${byFile.size} file(s)\n`);
  report();
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.error(`No baseline at ${BASELINE_PATH}. Create one with:\n  npm run check:i18n -- --update-baseline`);
  process.exit(1);
}

const baseline: Baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
const regressions: string[] = [];

for (const [file, count] of Object.entries(current.files)) {
  const was = baseline.files[file] ?? 0;
  if (count > was) {
    regressions.push(`  ${file}: ${was} → ${count}` + (was === 0 ? "  (new file)" : ""));
  }
}

if (regressions.length) {
  console.error(`i18n check FAILED — untranslated copy increased:\n`);
  console.error(regressions.join("\n"));
  console.error(
    "\nWrap the new strings in tl() / t.tl(), pass their data through" +
    "\ntranslateContent(), or allowlist the file in scripts/check-i18n.mts" +
    "\nwith a reason. Do NOT regenerate the baseline to make this pass.",
  );
  process.exit(1);
}

const improved = current.total < baseline.total;
console.log(
  `i18n check passed: ${current.total} untranslated string(s), baseline ${baseline.total}` +
  (improved ? `\n  ${baseline.total - current.total} fewer than baseline — run with --update-baseline to lock it in.` : ""),
);
process.exit(0);
