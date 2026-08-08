/**
 * An attack corpus against the form validators.
 *
 *   npm run check:forms
 *
 * Two halves, and the second matters as much as the first. A validator that
 * rejects everything is trivially "secure" and useless — so every payload we
 * refuse is paired with the legitimate input it must not catch. On a platform
 * selling into francophone and Arabic markets, a name rule that rejects Ngô or
 * محمد is a business defect wearing a security badge.
 *
 * These run against the same module the server uses, so a passing run means the
 * boundary holds, not that the UI looks tidy.
 */
import { validateField, validateSubmission, type Rule } from "../lib/form-validation";

const R = (kind: Rule["kind"], extra: Partial<Rule> = {}): Rule => ({ kind, ...extra });

let failed = 0;
const reject = (label: string, kind: Rule["kind"], input: string, extra: Partial<Rule> = {}) => {
  const v = validateField(input, R(kind, extra));
  if (v.ok) {
    failed++;
    console.error(`  ACCEPTED but should not: [${kind}] ${label}\n      ${JSON.stringify(input)} -> ${JSON.stringify(v.value)}`);
  }
};
const accept = (label: string, kind: Rule["kind"], input: string, extra: Partial<Rule> = {}) => {
  const v = validateField(input, R(kind, extra));
  if (!v.ok) {
    failed++;
    console.error(`  REJECTED but should not: [${kind}] ${label}\n      ${JSON.stringify(input)} -> ${v.error}`);
  }
};

/* ---------------------------------------------------- must be refused */

// Script injection, in every field that later renders somewhere.
reject("script tag", "company", '<script>alert(1)</script>');
reject("img onerror", "company", '<img src=x onerror=alert(1)>');
reject("svg onload", "text", '<svg/onload=alert(1)>');
reject("closing tag breakout", "text", '</textarea><script>x</script>');

// The link-shaped ones. A javascript: URL stored and later rendered as an
// anchor is stored XSS; data: is the same trick in a different coat.
reject("javascript scheme", "url", "javascript:alert(document.cookie)");
reject("data scheme", "url", "data:text/html;base64,PHNjcmlwdD4=");
reject("vbscript scheme", "url", "vbscript:msgbox(1)");
reject("file scheme", "url", "file:///etc/passwd");
reject("credentials in url", "url", "https://user:pass@evil.example.com");
reject("no domain", "url", "https://localhost");
reject("private network", "url", "https://192.168.1.1");
reject("link-local metadata", "url", "https://169.254.169.254/latest/meta-data/");
reject("loopback", "url", "http://127.0.0.1:5432");
reject("bare word", "url", "notaurl");
reject("nonsense tld", "url", "https://example.zzzzzzzzzzzzzzzzzzzzzzzzzz");

// Email shapes that mail servers refuse and header-injection attempts.
reject("no domain", "email", "ama@localhost");
reject("double dot", "email", "ama..b@example.com");
reject("leading dot", "email", ".ama@example.com");
reject("header injection", "email", "ama@example.com\nBcc: victim@example.com");
reject("crlf injection", "email", "ama@example.com%0d%0aBcc:x@y.com");
reject("no tld", "email", "ama@example");
reject("trailing hyphen domain", "email", "ama@-example.com");

// Numbers that are not numbers.
reject("letters in a figure", "digits", "15000000 OR 1=1");
reject("negative raise", "digits", "-5000");
reject("hex", "digits", "0x1F4");
reject("scientific", "digits", "1e9");
reject("over the cap", "decimal", "150", { maxValue: 100 });

// Phone numbers that are not phone numbers.
reject("too short", "phone", "12345");
reject("too long", "phone", "1234567890123456789");
reject("plus in the middle", "phone", "+233+201234567");

// A URL scheme where a URL cannot belong. Inert as text, live the moment a
// company name is rendered into an href — which is an ordinary thing to build.
reject("scheme as a company name", "company", "javascript:alert(1)");
reject("scheme as a person's name", "name", "data:text/html,x");
reject("bare protocol in a company", "company", "https://evil.example.com");
reject("javascript scheme in prose", "text", "click javascript:alert(1) now");
reject("data uri in prose", "text", "see data:text/html;base64,PHN2Zz4=");
// ...but prose that merely mentions a site is a normal sentence.
accept("https mentioned in prose", "text", "Our deck is at https://kumasiagri.com/deck");

// Names that are not names.
reject("only punctuation", "name", "---...");
reject("too short", "name", "A");
reject("punctuation run", "name", "A...B");

// Required means required.
reject("empty when required", "name", "", { required: true });
reject("whitespace only when required", "text", "   ", { required: true });

// Length is a denial-of-service control as much as a tidiness one.
reject("megabyte of prose", "text", "a".repeat(6000));
reject("overlong company", "company", "x".repeat(200));

/* ------------------------------------------------- must NOT be refused */

accept("ordinary name", "name", "Ama Mensah");
accept("apostrophe", "name", "O'Brien");
accept("hyphen", "name", "Nkrumah-Addo");
accept("french accents", "name", "Amaëlle Ngô");
accept("arabic", "name", "محمد بن سالم");
accept("curly apostrophe", "name", "O’Brien");

accept("company with ampersand", "company", "Kumasi AgriWorks & Co. (Ltd)");
accept("company with digits", "company", "3i Group plc");
accept("company with comma", "company", "Mensah, Osei and Partners");

accept("bare domain", "url", "kumasiagri.com");
accept("https with path", "url", "https://kumasiagri.com/about?ref=1");
accept("subdomain", "url", "https://www.kumasiagri.com.gh");
accept("linkedin", "url", "https://www.linkedin.com/company/kumasi-agriworks/");

accept("ordinary email", "email", "ama@kumasiagri.com");
accept("plus addressing", "email", "ama+listing@kumasiagri.com");
accept("subdomain email", "email", "ama@mail.kumasiagri.com.gh");

accept("ghana mobile", "phone", "+233 20 123 4567");
accept("local formatting", "phone", "(020) 123-4567");

accept("thousands separators", "digits", "15,000,000");
accept("decimal percentage", "decimal", "18.5", { maxValue: 100 });

accept("prose with punctuation", "text", "Working capital, a second line — and hiring. 40% of it.");
accept("optional left empty", "text", "");

/* ------------------------------------------- whole-submission behaviour */

const SCHEMA: Record<string, Rule> = {
  companyName: R("company", { required: true, min: 2 }),
  website: R("url"),
  contactEmail: R("email", { required: true }),
  amount: R("digits", { required: true, minValue: 1 }),
};

const good = validateSubmission(
  { companyName: "Kumasi AgriWorks", website: "kumasiagri.com", contactEmail: "AMA@Kumasiagri.COM", amount: "15,000,000" },
  SCHEMA,
);
if (!good.ok) {
  failed++;
  console.error("  a legitimate submission was rejected:", good.errors);
} else {
  if (good.values.contactEmail !== "ama@kumasiagri.com") {
    failed++;
    console.error("  email was not normalised to lowercase:", good.values.contactEmail);
  }
  if (good.values.amount !== "15000000") {
    failed++;
    console.error("  separators were not stripped from the figure:", good.values.amount);
  }
  if (!good.values.website.startsWith("https://")) {
    failed++;
    console.error("  bare domain was not normalised to https:", good.values.website);
  }
}

// A payload cannot introduce fields the schema never declared.
const extra = validateSubmission(
  { companyName: "Kumasi AgriWorks", contactEmail: "ama@kumasiagri.com", amount: "1", role: "SUPER_ADMIN", isAdmin: "true" },
  SCHEMA,
);
if (extra.ok && ("role" in extra.values || "isAdmin" in extra.values)) {
  failed++;
  console.error("  MASS ASSIGNMENT: undeclared keys survived validation:", Object.keys(extra.values));
}

// Non-string values are refused rather than coerced.
const wrongType = validateSubmission(
  { companyName: { toString: () => "x" }, contactEmail: "ama@x.com", amount: "1" } as Record<string, unknown>,
  SCHEMA,
);
if (wrongType.ok) {
  failed++;
  console.error("  an object was accepted where a string was required");
}

if (failed > 0) {
  console.error(`\nform validation check FAILED — ${failed} case(s)`);
  process.exit(1);
}
console.log("form validation check passed: injection, scheme, SSRF, header-injection, bounds, mass-assignment, and the legitimate inputs that must survive");
