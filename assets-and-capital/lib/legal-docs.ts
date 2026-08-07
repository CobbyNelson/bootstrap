import { SITE } from "@/lib/content";
import { COOKIE_REGISTRY } from "@/lib/consent";

/**
 * Legal document content, extracted from the page component so the privacy and
 * cookie notices can be written properly and reviewed in one place.
 *
 * These are drafted to satisfy UK/EU GDPR Articles 13–14 (what a notice must
 * say) and the ePrivacy cookie rules, against how the application ACTUALLY
 * behaves — the cookie table below is generated from the same registry the code
 * uses, so the published policy cannot drift from reality.
 *
 * They still need a lawyer's eye before launch: only counsel can confirm the
 * lawful bases fit the real commercial arrangements, and only the company can
 * confirm its controller details and retention periods. Every place that needs
 * a business decision is marked [CONFIRM] rather than silently invented.
 */

export type Doc = {
  title: string;
  updated: string;
  intro?: string;
  sections: { h: string; p: string; list?: string[]; table?: { head: string[]; rows: string[][] } }[];
};

/**
 * The privacy contact.
 *
 * This was privacy@, and the settings page pointed at support@, and the site
 * at hello@ — three addresses where one mailbox exists. A privacy policy is
 * the worst place to name one that bounces: it is the address a regulator
 * expects a data-subject request to reach.
 */
const CONTACT = SITE.email;

export const LEGAL_DOCS: Record<string, Doc> = {
  privacy: {
    title: "Privacy Policy",
    updated: "5 August 2026",
    intro: `This notice explains what personal data ${SITE.legalName} collects, why, what we do with it, and the rights you have over it.`,
    sections: [
      {
        h: "Who is responsible for your data",
        p: `${SITE.legalName} is the data controller for the personal data described in this notice. You can reach us about anything on this page at ${CONTACT}. [CONFIRM: registered office address and company number, and whether a Data Protection Officer or EU/UK representative is required — this depends on the scale of monitoring and on whether you offer services into the EU/UK.]`,
      },
      {
        h: "What we collect",
        p: "We collect only what the service needs, in three groups:",
        list: [
          "Data you give us — name, email, password, organisation details, investment mandate or business listing information, documents you upload, and messages you send through the platform.",
          "Identity and compliance data — where you invest or raise capital through us, verification data such as legal name, country, and the outcome of identity, sanctions and politically-exposed-person checks.",
          "Data collected automatically — sign-in activity, security logs, and, if you consent, aggregate usage measurement. We do not build advertising profiles.",
        ],
      },
      {
        h: "Why we use it, and our legal basis",
        p: "We must have a lawful basis for each use. Ours are:",
        list: [
          "To provide the platform — matching investors with opportunities, hosting listings, enabling messaging. Basis: performance of a contract.",
          "To verify identity and prevent financial crime — KYC, sanctions and AML screening. Basis: legal obligation, and our legitimate interest in a trustworthy marketplace.",
          "To keep the service secure — rate limiting, audit logs, fraud prevention. Basis: legitimate interests.",
          "To measure how the platform is used. Basis: your consent, which you can withdraw at any time.",
          "To send service messages you have asked for. Basis: consent, or contract where the message is necessary to the service.",
        ],
      },
      {
        h: "Who we share it with",
        p: "We do not sell personal data. We share it only with providers who process it on our instructions — hosting and infrastructure, payment processing, identity verification, and email delivery — and with regulators, auditors or law enforcement where we are legally required to. [CONFIRM: publish the current list of sub-processors; a named list is what enterprise customers and regulators ask for first.]",
      },
      {
        h: "Where your data is held",
        p: "Our servers are located in Europe. Where a provider processes data outside your country, we rely on appropriate safeguards such as the UK/EU standard contractual clauses. [CONFIRM: confirm the hosting region and complete a transfer risk assessment for each provider outside the UK/EEA.]",
      },
      {
        h: "How long we keep it",
        p: "We keep personal data only as long as we need it:",
        list: [
          "Account data — for as long as your account is open, then deleted or anonymised when you close it.",
          "Identity and transaction records — retained after the relationship ends because anti-money-laundering law requires it. [CONFIRM the exact period with counsel — commonly five years from the end of the business relationship.]",
          "Security and audit logs — 12 months. [CONFIRM]",
          "Cookie consent records — 6 months, after which we ask again.",
        ],
      },
      {
        h: "Your rights",
        p: "You can exercise most of these yourself from Settings → Your data and privacy, without contacting us. You have the right to:",
        list: [
          "Access a copy of your data — download it as a file at any time.",
          "Correct anything inaccurate — edit it in your profile, or ask us.",
          "Delete your account — we remove your personal details. Records we must keep by law are retained in anonymised form; we tell you this rather than claiming a deletion we cannot perform.",
          "Withdraw consent — change your cookie choices at any time, as easily as you gave them.",
          "Object to or restrict processing based on legitimate interests.",
          "Portability — your export is machine-readable JSON.",
          "Complain to a supervisory authority. In Ghana this is the Data Protection Commission; in the UK the ICO; in the EU your national authority. We would rather you came to us first.",
        ],
      },
      {
        h: "Security",
        p: "Passwords are stored hashed with bcrypt and are never recoverable, sessions are signed and HTTP-only, and traffic is encrypted in transit with HTTPS. Access to production data is limited to staff who need it. Backups are taken daily and stored off-site. No system is perfectly secure, and we will notify you and the relevant authority without undue delay if a breach affects your data.",
      },
      {
        h: "Children",
        p: "The platform is for businesses and professional or accredited investors. It is not directed at anyone under 18, and we do not knowingly collect their data.",
      },
      {
        h: "Changes",
        p: "If we change how we use personal data we will update this page and, where the change is significant, tell you directly. The date at the top shows when it was last revised.",
      },
    ],
  },

  cookies: {
    title: "Cookie Policy",
    updated: "5 August 2026",
    intro:
      "Cookies are small files stored by your browser. We use as few as possible, and none that are not strictly necessary without your permission.",
    sections: [
      {
        h: "Your choices",
        p: "When you first visit we ask what you allow. Nothing beyond strictly necessary cookies is set until you choose, rejecting is exactly as easy as accepting, and you can change your mind at any time from Settings → Your data and privacy, or the cookie link in the footer.",
      },
      {
        h: "Cookies we use",
        p: "This table is generated from the application itself, so it reflects what is actually set:",
        table: {
          head: ["Name", "Category", "Purpose", "Retention"],
          rows: COOKIE_REGISTRY.map((c) => [c.name, c.category, c.purpose, c.retention]),
        },
      },
      {
        h: "Analytics",
        p: "If you allow analytics, we measure which parts of the platform are used so we can improve them. This is aggregate — we do not use it to identify you or to advertise to you.",
      },
      {
        h: "Marketing",
        p: "We do not currently use advertising or retargeting cookies. The choice exists in our preference centre so that nothing of the kind can be introduced without your consent.",
      },
      {
        h: "Managing cookies in your browser",
        p: "You can also block or delete cookies in your browser settings. Blocking strictly necessary cookies will stop you signing in, because that is what they do.",
      },
    ],
  },

  terms: {
    title: "Terms of Service",
    updated: "5 August 2026",
    sections: [
      {
        h: "Agreement",
        p: `By using ${SITE.name}, you agree to these terms. If you do not agree, please do not use the platform.`,
      },
      {
        h: "The platform",
        p: "We provide a marketplace connecting investors with businesses seeking capital, and related services. We are a facilitator and do not provide investment, legal, or tax advice.",
      },
      {
        h: "Your account",
        p: "You are responsible for keeping your credentials secure and for activity under your account. Tell us promptly if you believe it has been compromised.",
      },
      {
        h: "Fees",
        p: "Businesses pay listing fees and a success fee on capital raised through the platform. Investors register free and pay only for requested roadshows and partnerships created at their request. [CONFIRM: current fee schedule.]",
      },
      {
        h: "Limitation of liability",
        p: "The platform is provided on an 'as is' basis. To the fullest extent permitted by law, we are not liable for investment outcomes or decisions made using the platform.",
      },
      {
        h: "Governing law",
        p: "[CONFIRM: governing law and jurisdiction — normally Ghana, but confirm with counsel given cross-border investors.]",
      },
    ],
  },

  disclosures: {
    title: "Disclosures",
    updated: "5 August 2026",
    sections: [
      {
        h: "Not investment advice",
        p: `${SITE.name} provides a marketplace and related services. Nothing on the platform constitutes investment, legal, or tax advice, or an offer or solicitation to buy or sell any security.`,
      },
      {
        h: "Vetting",
        p: "While we screen and verify businesses before listing, investors are responsible for their own due diligence. Match scores are informational signals, not recommendations.",
      },
      {
        h: "Risk",
        p: "Private-market investments carry risk, including the risk of losing capital, and are typically illiquid. Past performance is not indicative of future results.",
      },
    ],
  },
};


/**
 * Drafting notes, and how they leave the public page.
 *
 * `[CONFIRM: …]` marks a question for counsel — a registered office number, a
 * sub-processor list, a retention period. They are notes to whoever finishes
 * the document, and five of them were rendering on the LIVE privacy policy, in
 * every language, where any visitor could read them.
 *
 * They also blocked translation. The extractor skips any string containing
 * `[CONFIRM`, and these markers sit INSIDE paragraphs — so one bracket made a
 * whole section of the GDPR notice untranslatable, which is why that page was
 * the only one still reading in English.
 *
 * Stripping them for the public render fixes both at once: visitors see
 * finished prose, and the prose becomes extractable. The notes are not deleted
 * — `outstandingNotes()` lists them for the admin, so a question that has not
 * been answered stays visible to the people who can answer it.
 */
const NOTE = /\s*\[CONFIRM[^\]]*\]/g;

export function stripDraftNotes(text: string): string {
  return text.replace(NOTE, "").replace(/\s{2,}/g, " ").trim();
}

/** Every unanswered drafting note, for the admin. */
export function outstandingNotes(): { slug: string; title: string; note: string }[] {
  const out: { slug: string; title: string; note: string }[] = [];
  for (const [slug, doc] of Object.entries(LEGAL_DOCS)) {
    const seen = new Set<string>();
    const scan = (t: string) => {
      for (const m of t.matchAll(/\[CONFIRM[^\]]*\]/g)) {
        if (!seen.has(m[0])) {
          seen.add(m[0]);
          out.push({ slug, title: doc.title, note: m[0] });
        }
      }
    };
    scan(doc.intro ?? "");
    for (const sec of doc.sections) {
      scan(sec.h);
      scan(sec.p);
      (sec.list ?? []).forEach(scan);
      (sec.table?.rows ?? []).forEach((r) => r.forEach(scan));
    }
  }
  return out;
}

/** The document as a visitor sees it: finished prose, no drafting notes. */
export function publicLegalDoc(slug: string): Doc | undefined {
  const doc = LEGAL_DOCS[slug];
  if (!doc) return undefined;
  return {
    ...doc,
    intro: doc.intro ? stripDraftNotes(doc.intro) : doc.intro,
    sections: doc.sections.map((sec) => ({
      ...sec,
      h: stripDraftNotes(sec.h),
      p: stripDraftNotes(sec.p),
      list: sec.list?.map(stripDraftNotes),
      table: sec.table && {
        head: sec.table.head.map(stripDraftNotes),
        rows: sec.table.rows.map((r) => r.map(stripDraftNotes)),
      },
    })),
  };
}
