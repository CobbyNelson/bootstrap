# Compliance & security posture

**Status: technical controls implemented. Certification and legal sign-off are not done and cannot be done in code.**

Read the two honest caveats first — they matter more than the checklists below.

## What "ISO compliant" actually means

**ISO/IEC 27001 is a certification of an organisation, not a property of a website.** It certifies that a company operates an Information Security Management System — with named risk owners, management review meetings, internal audits, a documented Statement of Applicability, and evidence collected over months — and it is awarded only by an accredited external auditor after a two-stage audit.

No amount of code makes a site "ISO 27001 compliant". What code can do is implement the technical controls an auditor will test, so that when the organisational work is done the technology does not hold you back. That is what has been built, and the mapping is below.

The realistic path, if certification is genuinely wanted:

1. Decide the scope (likely: the platform and the team that runs it).
2. Appoint an owner. Run a risk assessment and write the Statement of Applicability.
3. Operate the controls for 3–6 months, keeping evidence.
4. Engage an accredited certification body for Stage 1 and Stage 2 audits.

Budget months and external cost. Anyone offering "ISO compliance" as a software feature is selling something else.

## What GDPR status actually is

The application now implements the technical requirements. **The remaining gaps are business decisions and legal review, not code** — every one is marked `[CONFIRM]` in `lib/legal-docs.ts` and appears on the published policy pages, deliberately, so they cannot be forgotten:

- Registered office, company number, and whether a DPO or EU/UK representative is required
- The list of sub-processors (hosting, payments, identity verification, email)
- Exact retention periods, especially the AML retention period
- Governing law and jurisdiction
- Transfer risk assessments for any provider outside the UK/EEA

Also note: **Ghana's Data Protection Act 2012 applies here as well as GDPR.** It requires registration with the Data Protection Commission — an administrative step with a fee, not a technical one. [CONFIRM whether Assets & Capital Ltd is registered.]

---

## GDPR — implemented in code

| Requirement | Where |
|---|---|
| Art. 13/14 transparency | `lib/legal-docs.ts` → `/legal/privacy`, written against actual system behaviour |
| Art. 6 lawful basis, stated per purpose | Privacy policy, "Why we use it" |
| Art. 7 consent — granular, opt-in, no pre-ticking | `lib/consent.ts`, `components/layout/cookie-consent.tsx` |
| Art. 7(3) withdrawal as easy as giving | Footer "Cookie settings" + Settings → privacy controls |
| Art. 15 access | `GET /api/account/export` |
| Art. 20 portability | Same endpoint — machine-readable JSON |
| Art. 17 erasure | `POST /api/account/delete` — anonymises, preserving AML records under Art. 17(3)(b) |
| Art. 25 data protection by design | Session-derived scoping everywhere; media library scoped to uploader |
| Art. 32 security of processing | See the security table below |
| Art. 30 records of processing | This document + the cookie registry |

**The erasure design is the part worth understanding.** A financial intermediary cannot simply delete KYC and transaction records on request — AML law requires retaining them. So deletion anonymises: identifying fields are cleared, the login is destroyed, and rows that must survive do so with no route back to a person. The privacy policy says this plainly rather than promising a deletion the system does not perform, because a notice that misdescribes the system is itself a finding.

## ePrivacy / cookies

- No non-essential cookie is set before consent. Consent lives in a first-party cookie the server can read, so consent-gated code can simply not run — the previous localStorage flag could only hide a banner.
- "Reject all" has identical prominence to "Accept all" (EDPB guidance on dark patterns).
- Consent expires after 6 months, then we ask again.
- The published cookie table is generated from `COOKIE_REGISTRY`, so the policy cannot drift from what the code sets.

## Security controls (maps to ISO 27001:2022 Annex A)

| Control area | Implemented | Annex A |
|---|---|---|
| Access control | Role-based; middleware gate; server-side scoping derived from session, never from client input | A.5.15, A.8.3 |
| Authentication | bcrypt hashes; signed HTTP-only JWT sessions; rate limiting per IP and per account | A.5.17, A.8.5 |
| Cryptography in transit | HTTPS everywhere, HSTS 2 years with preload, `upgrade-insecure-requests` | A.8.24 |
| Secure configuration | CSP, X-Frame-Options DENY, nosniff, COOP, CORP, Permissions-Policy denials, Referrer-Policy | A.8.9 |
| Input handling | Allowlist HTML sanitisation at write time; Prisma parameterised queries; path traversal guard on media | A.8.26 |
| Logging & monitoring | `AuditLog` for privileged and irreversible actions incl. erasure; systemd journal | A.8.15, A.8.16 |
| Backup | Nightly database + media to off-site Mega; verified after upload; restore rehearsed | A.8.13 |
| Malware / patching | Unattended security upgrades on the host | A.8.7, A.8.8 |
| Network security | ufw restricted to 22/80/443; Postgres bound to loopback only; fail2ban | A.8.20, A.8.21 |
| Segregation of duties | Deploy user with scoped sudo (restart the app unit only) | A.8.2 |
| Secure development | Typecheck + build gate before deploy; atomic releases with automatic rollback | A.8.25, A.8.31 |

### Known gaps — deliberate, not overlooked

- **CSP allows `'unsafe-inline'` for scripts.** A nonce policy requires dynamic rendering on every page; nearly all routes here are statically prerendered, and a nonce CSP demonstrably broke them (`/login` could not hydrate). The policy still restricts script *origins*, `connect-src`, and `form-action`, which blocks external injection and exfiltration. Upgrade path: force dynamic rendering, then swap in a nonce.
- **Rate limiting is in-memory**, so it is per-process. Correct for a single instance; move to Redis before scaling out.
- **No 2FA yet.** The `twoFactorOn` field exists but no enrolment flow. This is the highest-value next security investment for a platform holding investment mandates.
- **Backups are not encrypted client-side** before upload. Mega encrypts at rest, but the account password is the only thing between an attacker and the data. Consider `rclone crypt`.
- **No automated dependency scanning** in CI.
- **No formal incident response plan.** Required for certification; currently nobody is named as the responder.

## Breach response — the 72-hour clock

GDPR Art. 33 requires notifying the supervisory authority within **72 hours** of becoming aware of a personal data breach. That clock is short enough that improvising fails. Minimum viable plan, to be agreed before launch:

1. Contain — revoke sessions (rotate `AUTH_SECRET`), block the vector.
2. Assess — what data, how many people, what risk to them. `AuditLog` and the journal are the evidence.
3. Notify — the authority within 72 hours; affected individuals without undue delay if the risk to them is high.
4. Record — every breach must be documented, even those not notified.

[CONFIRM: who is the named responder, and their out-of-hours contact.]
