/**
 * Every question that takes typing must carry a rule.
 *
 *   npm run check:coverage
 *
 * This exists because four fields on the investor mandate shipped with a rule
 * and no keystroke filter: they refused digits when somebody pressed Enter and
 * accepted them while typing. The engine now derives the filter from the rule,
 * so that specific mistake cannot recur — but a question with NO rule at all
 * still gets no server-side check, because `validateSubmission` only walks the
 * schema. A field the schema never declares is silently dropped, so the form
 * would ask for something and the server would throw the answer away.
 *
 * Deliberately a source scan rather than a runtime one. The questions are built
 * inside client components with `tl()` calls all through them; importing them
 * here would drag React and the locale provider in, and a check nobody can run
 * is not a check.
 */
import { readFileSync } from "node:fs";
import { CONTACT_SCHEMA, INTAKE_SCHEMA, INVESTOR_SCHEMA } from "../lib/intake-schema";
import { filterField, validateField } from "../lib/form-validation";

const SCHEMAS: Record<string, Record<string, { kind: string }>> = {
  CONTACT_SCHEMA, INTAKE_SCHEMA, INVESTOR_SCHEMA,
};

const FORMS = [
  "components/contact/contact-form.tsx",
  "components/register/business-intake.tsx",
  "components/register/investor-wizard.tsx",
];

/** Questions that are not typed into, so a character rule means nothing. */
const NOT_TYPED = /\b(choices|multi|node|confirm):/;

let bad = 0;
let checked = 0;
const report: string[] = [];

for (const file of FORMS) {
  const src = readFileSync(file, "utf8");

  // Each question runs from its `key:` to the start of the next one.
  for (const m of src.matchAll(/key: "([A-Za-z_]+)"([\s\S]*?)(?=\n\s*\{\s*\n?\s*key:|\n\s*\];)/g)) {
    const [, key, body] = m;
    if (NOT_TYPED.test(body)) continue;
    checked++;

    const declared = /\brule: (\w+_SCHEMA)\.(\w+)/.exec(body);
    if (!declared) {
      bad++;
      console.error(`  ${file}\n    "${key}" is typed into but carries no rule — the server will drop it.`);
      continue;
    }

    const rule = SCHEMAS[declared[1]]?.[declared[2]];
    if (!rule) {
      bad++;
      console.error(`  ${file}\n    "${key}" points at ${declared[1]}.${declared[2]}, which does not exist.`);
      continue;
    }

    // What the engine will actually filter with: `q.accept ?? q.rule.kind`.
    const override = /accept: "(\w+)"/.exec(body);
    const effective = override?.[1] ?? rule.kind;

    // THE ASSERTION THAT MATTERS: the keystroke filter must not be looser than
    // the rule that will judge the answer.
    //
    // A first version of this compared the filter against itself — it asked
    // whether a field whose EFFECTIVE filter was "name" behaved like a name
    // field, so overriding a name to `accept: "text"` simply exempted itself
    // and the check passed on the exact bug it was written for.
    //
    // The honest test runs both halves in sequence. Filter a probe the way the
    // keyboard will, then judge it the way the server will. If what survived
    // the filter is then REFUSED for its characters, the filter let somebody
    // type something the rule was always going to reject — which is the defect:
    // you fill in a name, press Enter, and only then are told.
    const PROBE = "Ama123!<>@x";
    const typed = filterField(PROBE, effective as never);
    const judged = validateField(typed, rule as never);
    if (!judged.ok && /characters this field/.test(judged.error)) {
      bad++;
      console.error(
        `  ${file}\n    "${key}": filter is "${effective}" but the rule is "${rule.kind}".` +
        `\n      Typing ${JSON.stringify(PROBE)} leaves ${JSON.stringify(typed)}, which the rule then refuses.`,
      );
      continue;
    }
    report.push(`    ${key.padEnd(16)} ${effective}`);
  }
}

// A form file that stops matching is worse than a failure: it reports success
// while checking nothing.
if (checked < 15) {
  console.error(`\nform coverage check FAILED — only ${checked} questions matched, which means the parser has stopped finding them.`);
  process.exit(1);
}

if (bad > 0) {
  console.error(`\nform coverage check FAILED — ${bad} of ${checked}`);
  process.exit(1);
}
console.log(report.join("\n"));
console.log(`form coverage check passed: ${checked} typed questions, each with a rule and a live filter`);
