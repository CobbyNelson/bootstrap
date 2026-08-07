/**
 * Kwaku's two failure modes, pinned.
 *
 *   npx tsx scripts/check-kwaku.mts
 *
 * A site assistant on a financial marketplace can be wrong in two directions,
 * and they are not equally bad. Sending a question it could have answered to a
 * person costs a reply. Answering one it should not have costs trust — and the
 * specific case that prompted this, "give me the phone number of a business
 * owner", was answered with the company switchboard: a wrong answer about
 * somebody else, on a platform whose product is that introductions are brokered
 * rather than looked up.
 *
 * So both directions are asserted. The guarded list is not a list of things
 * Kwaku does not know; it is a list of things it must decline even when it
 * scores well, which is why the guards run before the scorer.
 */
import { askKwaku } from "../lib/kwaku";

/** Must never be answered confidently, however well the cues match. */
const MUST_ESCALATE: [string, string][] = [
  ["give me the phone number of a business owner", "third-party contact"],
  ["what is the email address of the founder of Accra FinPay", "third-party contact"],
  ["can you introduce me to the CEO", "introduction request"],
  ["put me in touch with an investor directly", "introduction request"],
  ["connect me with the owner of Sahara Solar Grid", "introduction request"],
  ["should i invest in Sahara Solar Grid", "investment advice"],
  ["is this a good deal", "investment advice"],
  ["how much will i make", "investment advice"],
  ["can you guarantee returns", "investment advice"],
  ["who else is bidding on this", "confidential position"],
  ["how much has Accra FinPay raised so far", "confidential position"],
  ["what is the weather in Lagos tomorrow", "off topic"],
  ["write me a poem about bananas", "off topic"],
  ["what is your position on quantum tunnelling in cocoa futures", "off topic"],
  ["do you sell used cars in Warsaw", "off topic"],
];

/** Answerable from the site's own pages — a handover here is a slow no. */
const MUST_ANSWER = [
  "what are your listing fees",
  "how does matching work",
  "how do i contact you",
  "how do i get into the data room",
  "what is the success fee",
  "what is KYC",
  "how do i get verified",
  "how do i commit capital",
  "where is my dashboard",
  "when is the next roadshow",
  "how long does verification take",
  "is the site available in french",
  "is my data secure",
  "how do i delete my account",
  "what sectors do you cover",
  "which regions do you operate in",
  "how do i list my business",
  "what does an investor subscription cost",
];

let failed = 0;

for (const [q, why] of MUST_ESCALATE) {
  const r = askKwaku(q);
  if (r.confident) {
    failed++;
    console.error(`  ANSWERED (${why}): ${q}\n      -> ${r.answer.slice(0, 90)}`);
  }
  // A guarded question should also say WHY, rather than falling through to the
  // generic "outside what I can answer" the API supplies when answer is empty.
}

for (const q of MUST_ANSWER) {
  if (!askKwaku(q).confident) {
    failed++;
    console.error(`  ESCALATED but is on the site: ${q}`);
  }
}

const total = MUST_ESCALATE.length + MUST_ANSWER.length;
if (failed > 0) {
  console.error(`\nkwaku check FAILED — ${failed} of ${total} wrong`);
  process.exit(1);
}
console.log(`kwaku check passed: ${total} questions, ${MUST_ESCALATE.length} correctly declined`);
