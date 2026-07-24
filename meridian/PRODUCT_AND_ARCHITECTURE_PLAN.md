# Meridian — Product & Architecture Plan

**The compliance-native origination-to-allocation network for private markets.**

> Institutional allocators and vetted investment opportunities are matched only on written-mandate fit, then moved to a closed, audit-ready allocation on one multi-tenant rail.

| | |
|---|---|
| **Product type** | Investment matchmaking platform — a two-sided marketplace pairing institutional capital allocators with vetted investment opportunities |
| **Primary users** | Enterprise finance teams (institutional LPs, family offices, corp-dev/M&A, PE/VC, treasury, sovereign/pension) and issuers (GPs raising, companies raising, secondaries, co-invest) |
| **Tech direction** | Next.js + React + TypeScript · Node.js (NestJS/TypeScript) · PostgreSQL 16 (Aurora) · AWS |
| **This deliverable** | Architecture & product plan (this doc) + a clickable design prototype (`prototype/index.html`) |
| **Status** | Planning — for review and scoping before build |
| **Working codename** | **Meridian** (placeholder — rename freely) |

This plan was produced by a multi-expert planning pass (product/domain, systems architecture, matching engine, security & compliance, business intelligence, UX/design system, and board strategy), synthesized into a unified plan, then run past an adversarial compliance-and-completeness critic whose corrections are folded throughout and summarized in [§13](#13-regulatory--design-corrections).

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Product vision & positioning](#2-product-vision--positioning)
3. [Users & personas](#3-users--personas)
4. [Marketplace model & deal lifecycle](#4-marketplace-model--deal-lifecycle)
5. [Feature scope](#5-feature-scope)
6. [The matching engine](#6-the-matching-engine)
7. [Systems architecture](#7-systems-architecture)
8. [Security, compliance & regulatory](#8-security-compliance--regulatory)
9. [Business intelligence & analytics](#9-business-intelligence--analytics)
10. [UX, information architecture & design system](#10-ux-information-architecture--design-system)
11. [Business strategy](#11-business-strategy)
12. [Top risks & mitigations](#12-top-risks--mitigations)
13. [Regulatory & design corrections](#13-regulatory--design-corrections)
14. [Open questions](#14-open-questions)
15. [Milestone plan](#15-milestone-plan)
16. [Appendix — a worked match](#16-appendix--a-worked-match)

---

## 1. Executive summary

Private-markets fundraising and allocation is slow, relationship-bound, and evidentiary-thin. Deal flow arrives via fragmented emails, PPMs, and warm intros; allocators waste diligence hours on mandate-misfit managers; issuers grind through referral-dependent raises or pay placement agents ~200 bps; and every side re-keys the same data into spreadsheets with no audit trail a governance committee or regulator would accept.

**Meridian** compresses the sourcing-to-term-sheet cycle from 4–9 months to 3–6 weeks by wrapping a **mandate-aware matching engine** in a **compliance-native deal workflow**: accreditation + KYC/AML gating, permissioned watermarked data rooms, e-signature, granular RBAC, and an immutable audit trail — on a multi-tenant platform built for enterprise finance teams.

The defining architectural principle is **compliance-native, defense-in-depth gating**: *rules are a floor, ML is a lift*. A deterministic eligibility gate reduces every candidate universe to legally and structurally eligible pairs **before** any scoring; no ML component can ever resurface a pair the gate rejected. Every match carries explainable reason codes, and every consequential action writes to a tamper-evident ledger.

**MVP posture (deliberate and counsel-gated):** launch as **pure SaaS with zero transaction-based compensation** and no role in negotiation or closing — keeping Meridian clearly outside unregistered broker-dealer and investment-adviser status until a deliberate, securities-counsel-blessed BD-partner integration in a later phase. The MVP is a **compliance-native origination + workflow tool for a curated set of paid design partners**, not an open securities marketplace.

The plan below is intentionally scoped down from the full expert vision to a **buildable ~7-month, design-partner MVP**, with the larger architecture and ML sophistication staged into later phases.

---

## 2. Product vision & positioning

**Value proposition.** The institutional-grade origination-to-allocation network for private markets: we turn capital–opportunity fit into closed allocations. Allocators are matched only to opportunities that fit their written mandate and thesis; issuers reach pre-qualified, verified capital instead of blasting decks. The moat is a compliance-native deal workflow wrapped around a mandate-aware matching engine.

**Positioning statement.** *"Bloomberg-grade intelligence + a broker-dealer-safe transaction rail for private capital"* — one platform across fund primaries, co-invest, secondaries, and direct deals, rather than a data terminal, a wealth-distribution feeder, or a single-transaction marketplace.

**Where Meridian sits vs. the incumbents:**

| Category | Examples | What they do | The gap Meridian fills |
|---|---|---|---|
| Data & fundraising CRM | PitchBook, Preqin, Dakota | Reference data, LP/GP databases, contact intelligence | Inform outreach but don't match on mandate, gate compliance, or carry a deal to close |
| Alternatives distribution / feeders | iCapital, CAIS, Moonfare, Allfunds | Distribute alt products to wealth/HNW channels | One-directional wealth distribution, not institutional two-sided matchmaking; no co-invest / direct origination |
| Secondaries / private-share venues | Nasdaq Private Market, Forge, EquityZen, Palico | Liquidity for one transaction type | Point solutions with no primary origination or mandate matching |
| Startup–investor networks | AngelList, Carta, OurCrowd | Early-stage / retail-leaning syndication | Not built for institutional check sizes, RBAC, audit, or KYC/AML/accreditation rigor |
| Placement agents & advisory | Campbell Lutyens, PJT Park Hill, Evercore | High-touch human intermediation at ~200 bps | Expensive, slow, no software/audit layer |
| Corp-dev deal sourcing | Grata, SourceScrub, Cyndx, Axial | Company sourcing/targeting | Lists and connections without two-sided capital matching, accreditation gating, or closing workflow |
| Deal workflow / VDR | Datasite, Intralinks, Ansarada | Data rooms for execution | Execution-only; capital and opportunity must already have found each other |

Meridian embeds a best-in-class data room but **originates and matches the deal that fills it** — making the VDR a feature, not the product.

---

## 3. Users & personas

Three sides participate: **allocators** (demand for opportunities), **issuers/opportunities** (demand for capital), and **platform-internal** trust & operations roles.

### Allocators (demand side)
- **Institutional LP Investment Officer** (pension / endowment / foundation) — deploys $50M–$500M+/yr into funds and select co-investments, governed by an IPS, IC, and consultant. Needs repeatable, documentable diligence and ILPA-aligned terms comparison.
- **Family Office CIO / Principal** — allocates across directs, co-invest, and funds; privacy-sensitive, relationship-driven, thin team. Needs curated off-market access and identity discretion.
- **Corporate Development / M&A Director** — balance-sheet / CVC capital with a strategic thesis; board, antitrust, and CFIUS scrutiny. Needs proprietary sourcing and MNPI controls.
- **PE / VC Investment Partner** — direct deals, co-invest, and LP secondaries under an LPA mandate. Needs proprietary deal flow, syndicate access, and speed.
- **Sovereign Wealth / Large Pension PM** — $100M–$1B+ tickets; governance- and sanctions-sensitive, cross-border. Needs opportunities that can absorb ticket size and bespoke terms.
- **Corporate Treasury Investment Manager** — capital-preservation, private credit / yield; strict risk, duration, and regulatory-capital limits.

### Issuers / opportunities (supply side)
- **Fund Manager (GP) Head of IR / Capital Formation** — running a raise to first/final close under Reg D / Reg S / AIFMD pre-marketing constraints.
- **Private Company CFO / Founder** — primary capital raise.
- **Placement Agent / Capital Advisor** — represents issuers (must be a registered BD to solicit for transaction-based comp — see [§8](#8-security-compliance--regulatory)).
- **LP Secondary Seller** — seeking discreet liquidity for an LP stake.

### Platform-internal
- **Compliance / KYC-AML Analyst** — dispositions verification and screening cases; gates participation.
- **Deal Success / Relationship Manager** — curates high-value matches, shepherds deals.
- **Platform Admin / Trust & Safety & Data Steward** — tenant, data, and integrity oversight.

The common thread: fragmented sourcing, costly diligence on misfit counterparties, fear of over-exposing appetite/identity, weak audit, and compliance bottlenecks at the close. Every persona's pain resolves to *"find genuinely mandate-fit counterparties fast, without leaking, with a defensible record."*

---

## 4. Marketplace model & deal lifecycle

**Matching trigger.** A scored match is generated when an allocator's **active, verified mandate** overlaps an opportunity's structured **profile** above a configurable relevance threshold — across asset class & strategy, sub-strategy, geography, sector/theme, stage, vehicle type, and check/ticket size.

**Trust is enforced by layered, evidenced gating, not self-attestation:** KYB + UBO mapping, KYC on signatories, accreditation / qualified-purchaser verification with a reasonable-steps evidence trail, and sanctions/PEP/adverse-media screening — resolving to a **trust-tier badge** that gates what each party can see and do.

**Progressive disclosure is the core privacy mechanism:** appetite and identity are never broadcast unilaterally. Anonymous teasers are shown pre-consent; identities and contacts unlock only on **reciprocal (double opt-in) interest**, which also creates the deal record.

### Deal lifecycle (sourcing → closed allocation)

1. **Onboarding & verification** — tenant/org setup, RBAC, KYB (entity + UBO), KYC on users, accreditation/QP verification, sanctions/PEP/adverse-media screening → trust-tier badge.
2. **Mandate & opportunity intake** — allocators publish structured mandates (anonymous by default); issuers build opportunity profiles with teaser + structured attributes + gated document slots.
3. **Sourcing & matching** — the engine produces ranked, explainable matches into each side's feed; saved searches/alerts; RM curation; anonymous teasers pre-consent.
4. **Mutual interest & introduction (double opt-in)** — on reciprocal opt-in, identities unlock and a private deal room/thread is created.
5. **NDA & data room access** — e-sign NDA gates the full VDR; tiered, permissioned, watermarked, access-logged (teaser → Tier 1 → full VDR).
6. **Diligence & Q&A** — structured Q&A tracker, reference checks, meetings; compliance re-checks / EDD for high-risk.
7. **Indication & negotiation** — IOI/soft-circle, term sheet / LOI, side-letter/MFN negotiation with versioning and audit.
8. **Compliance gating & documentation** — final eligibility gate (accreditation re-confirm, sanctions re-screen, suitability, jurisdiction), document generation and e-sign. *(MVP stops here — see scope.)*
9. **Closing & settlement** — signed subscription/transfer docs, funds flow / capital calls, allocation confirmed. *(Phase 2+, via BD partner.)*
10. **Closed allocation & post-close** — booked to portfolio; ILPA-style reporting, monitoring, re-up, continuous re-screening. *(Phase 2+.)*

**MVP boundary:** Meridian carries a deal from match through **double opt-in → NDA → data room → diligence Q&A → term sheet e-sign → a booked (soft, non-binding) commitment record.** It does **not** move money, generate subscription/closing documents, or record binding commitments in the MVP — those cross into securities-transaction facilitation and wait for the counsel-blessed BD rail.

---

## 5. Feature scope

Prioritized MVP / Phase 2 / Later. The MVP is the minimum that makes matchmaking *useful and trustworthy* for paid design partners.

### MVP (the buildable core)
1. **Multi-tenant orgs & granular RBAC + ABAC**, hard tenant isolation (Postgres RLS backstop). Foundation for everything.
2. **Onboarding & verification** — KYB/UBO, KYC on signatories, accreditation/QP verification, sanctions/PEP/adverse-media screening, vendor-integrated, **hard gate**.
3. **Allocator Mandate Builder** — structured, taxonomy-driven, anonymous by default; the demand-side input to matching and the legal framing that keeps matching a neutral criteria-based filter.
4. **Opportunity / Listing Builder** — funds, directs, secondaries, co-invest; teaser + structured attributes + gated document slots; **mandatory offering-exemption flag** (drives visibility/gating).
5. **Matching engine (Stages 1 & 3)** — deterministic eligibility gate + weighted, explainable content score with reason codes (see [§6](#6-the-matching-engine)). **α = 1.0 at launch** (rules + generic text embeddings; no ML propensity model yet).
6. **Double opt-in introductions + secure per-deal messaging.**
7. **Virtual data room** — tiered, permissioned, watermarked, fully access-logged; presigned short-TTL URLs; WORM (S3 Object Lock) for executed docs.
8. **E-signature** for NDAs and core documents (DocuSign / Dropbox Sign).
9. **Deal pipeline / lifecycle CRM** (Kanban + table) with **enforced stage gates** (cannot advance without KYC/NDA/compliance sign-off).
10. **Immutable, hash-chained audit trail** + activity logging (SEC 17a-4-aligned recordkeeping posture).
11. **Saved searches, alerts & notifications.**
12. **Design-partner analytics** — match feed, pipeline funnel, fundraise progress, compliance/onboarding SLA view (enough to prove and tune the model without the full BI warehouse).

### Phase 2 (GA & transaction rail)
ML match ranking & recommendations · structured DDQ/ODD workspace + Q&A tracker · subscription/closing doc generation + funds flow **(via BD partner)** · portfolio monitoring & post-close reporting · full analytics warehouse · jurisdiction-aware compliance rule engine · ongoing sanctions/PEP monitoring & periodic KYC refresh · SSO/SAML + SCIM + advanced enterprise security · placement-agent / multi-party deal representation.

### Later
Secondaries bid/ask marketplace · co-investment syndication tooling · AI diligence copilot · third-party data & valuation integrations (PitchBook/Preqin) · escrow & payment rails · regulatory reporting automation (Form D/PF, AIFMD Annex IV) · public API/webhooks/partner ecosystem · native mobile app.

---

## 6. The matching engine

**Approach: hybrid content + (later) behavioral matching, compliance-gated, structured as a funnel so no single model is a black box over a fiduciary decision.**

```
Stage 1  HARD ELIGIBILITY GATE   (boolean, deterministic, non-negotiable)
             │  reduces the universe to legally + structurally eligible pairs
             ▼
Stage 2  CANDIDATE RETRIEVAL     (recall — semantic ANN over embeddings + filters)
             │  top-N candidates per side
             ▼
Stage 3  SCORING & RANKING       (precision — weighted content score + reason codes)
             │  0–100 MatchScore, bucketed Strong / Good / Exploratory
             ▼
Stage 4  CAPACITY & DIVERSIFICATION   (constrained assignment — Phase 2+)
```

**Design principle — rules are a floor, ML is a lift.** ML can only re-rank and personalize *within* the eligible, rules-approved set; it can never resurrect a pair the gate rejected. The eligibility/compliance gate stays 100% deterministic forever. This is what makes a recommender safe for regulated capital — and what keeps Meridian framed as a *neutral criteria-based filter* rather than an investment adviser.

### Match dimensions (weights sum to 100%)

| Dimension | Weight | What it captures |
|---|---:|---|
| Asset class & strategy fit | 16% | Taxonomy + strategy-adjacency (growth-equity mandate scores partial on late-stage venture) |
| Check size & capacity fit (two-sided) | 14% | Allocator ticket band ∩ opportunity accepted range / remaining capacity |
| Sector & investment thesis | 13% | GICS-style taxonomy + **semantic** thesis embedding similarity |
| Stage / vintage / lifecycle | 10% | Financing stage / fund number / vintage vs. mandate deployment pacing |
| Risk / return profile fit | 10% | Target IRR/MOIC/DPI & risk tier, with an asymmetric downside penalty |
| Manager track record / quality | 9% | Prior-fund quartile, DPI/TVPI, loss ratio; monotonic constraint |
| **Geography** | **8%** | Domicile / target-region fit (adjacency-scored) |
| Mandate constraints & diversification | 7% | Soft IPS parts: currency, liquidity, concentration headroom |
| Terms, fees & structure | 5% | Mgmt fee, carry, hurdle, GP commit, LPA terms vs. fee sensitivity |
| Relationship & behavioral affinity (CF) | 5% | Re-up boost + collaborative filtering — **disabled at cold start** |
| ESG / impact & values alignment | 3%* | SFDR Article 8/9, exclusion themes — *promoted to near-hard filter where the allocator flags ESG binding* |

*(Geography is documented here as the 11th dimension explicitly; the critic caught that it was used in the worked example but missing from the earlier dimension list. Weights now sum to exactly 100%.)*

### Scoring model
`MatchScore = 100 × ( α · S_content + (1−α) · S_ml )`, produced only for pairs that pass the gate.

- **S_content** = Σ wₐ · fₐ over the dimensions, where each fₐ ∈ [0,1] is a calibrated sub-score: **tent/Gaussian tolerance** functions for numeric fits (check size, stage, risk/return), **adjacency-matrix** lookups for categorical fits (asset class, geography, sector), and **cosine similarity** of embeddings for semantic fits (thesis, ESG).
- Weights are **personalized** per allocator by declared priorities and (later) a learned residual, **bounded to ±40% of base** so the system stays interpretable and auditable.
- **α starts at 1.0 (pure rules + embeddings) and is segment-adaptive**, decaying only as real outcome data accrues, floored at 0.3 so rules never disappear.
- Every match ships **reason codes** from the top ± contributors ("Matched: mid-market buyout, North America, $25–50M ticket fits, top-quartile prior DPI. Watch-outs: 2.5% fee above your 2.0% preference"), and scores are **bucketed** (Strong 80–100 / Good 60–79 / Exploratory 40–59; <40 suppressed) to avoid false precision.

### Rules → ML evolution
- **Phase 0 (cold, 0 outcome data):** 100% rules + generic text embeddings, α=1.0, expert-set weights. **Shippable to a regulated buyer with no "the AI decided" risk.** This is the MVP.
- **Phase 1 (engagement data):** a learning-to-rank re-ranker reorders within the eligible set (α≈0.7); CF/affinity switches on; de-biased with inverse-propensity weighting.
- **Phase 2 (outcome data):** a calibrated funnel-conversion propensity model, α→0.3 in data-rich segments only, with monotonic constraints on track-record/capacity/return.
- **What never moves to ML:** the eligibility gate, monotonicity constraints, the α-floor, and the personalization bounds. A kill-switch reverts α→1.0 if calibration or fairness metrics regress.

> **Cold-start correction (from the critic):** the two-tower retrieval model, the 0.78 ML propensity score, collaborative filtering, and α=0.5 blends **cannot exist at launch** with zero interaction data. The MVP is explicitly *generic text embeddings + a static weighted score*. All learned components are staged into the roadmap, not the MVP.

### Compliance guardrails on matching
Accreditation / investor-qualification gate (506(b) vs 506(c), 3(c)(1)/3(c)(7), 144A/QIB) · KYC/AML/sanctions clearance on both parties · **conflicts-of-interest & MNPI information barriers** (affiliation graph, tipping detection) · mandate/IPS hard exclusions · tax & entity-structure gates (ERISA plan-asset 25% rule, UBTI/ECI blockers, Volcker) · jurisdictional marketing eligibility (respect AIFMD/NPPR and reverse-solicitation) · pay-to-play flags for public pensions · suitability/fiduciary floor · consent/NDA/data-room gating · full auditability. **Every gate decision is re-checked against the authoritative compliance oracle at request time — never against a possibly-stale search index.**

---

## 7. Systems architecture

Multi-tenant SaaS on AWS. **Compliance-native, defense-in-depth gating** is the organizing principle: authorization is decided in one centralized policy layer (tenant → role → resource relationship), and every sensitive gate additionally consults a deterministic **compliance-status oracle** before proceeding.

### Stack
- **Frontend:** Next.js 14 (App Router, RSC) + React 18 + TypeScript · TanStack Query · Tailwind CSS + Radix UI primitives · Recharts · strict CSP, SSR for authenticated shells.
- **Backend:** Node.js 20 + TypeScript on **NestJS**, organized as bounded-context modules. **GraphQL (Apollo) BFF** for the SPA; REST/JSON for webhooks & future partner APIs; gRPC internal. **Temporal** for long-running human-in-the-loop workflows (KYC, deal pipeline, e-sign).
- **Data:** **PostgreSQL 16 on Aurora** (Multi-AZ, writer + read replicas). **Row-Level Security** for tenant isolation, **pgcrypto/KMS field-level encryption** for PII, `pg_partman` partitioning for audit tables, **pgvector** for semantic matching.
- **Infra:** ECS Fargate behind ALB · CloudFront · S3 (Object-Lock WORM for executed docs) · ElastiCache Redis · OpenSearch · KMS (per-tenant CMKs) · Secrets Manager · Cognito + partner IdPs · WAF/Shield · Terraform IaC · GitHub Actions CI/CD · blue-green deploys.
- **Key libraries:** Prisma (RLS-aware sessions) · Apollo + GraphQL Codegen · Zod + ts-rest · Temporal SDK · BullMQ · **OpenFGA** (relationship-based ABAC) · OpenTelemetry + Datadog · AWS Encryption SDK · Pino.

### Services (MVP module set)
Consolidated for the MVP from the full 13-service target into a leaner set of bounded-context modules:

| Module | Responsibility (key endpoints) |
|---|---|
| **Identity & Access (IAM)** | Org/user lifecycle, RBAC+ABAC (OpenFGA), MFA/step-up, session/token; owns `org_id` in every JWT. SSO/SCIM **stubbed for Phase 2**. |
| **Allocator & Mandate** | Allocator profiles + structured, versioned mandates with embedding generation. `POST /v1/allocators/:id/mandates`, `PUT /v1/mandates/:id/criteria`, `POST /v1/mandates/:id/publish` |
| **Opportunity** | Supply-side listings + lifecycle (draft→in_review→live→in_diligence→closed) + disclosure tiers + **offering-exemption flag**. |
| **Matching Engine** | Eligibility gate + weighted explainable scoring + pgvector similarity. `POST /v1/matches/compute`, `GET /v1/matches`, `GET /v1/matches/:id/explanation` |
| **Deal Pipeline & Workflow** | Temporal-orchestrated pipeline with gating checks on each transition. `POST /v1/deals`, `PATCH /v1/deals/:id/stage`, `POST /v1/deals/:id/tasks` |
| **Data Room & Document** | Folders, versioned docs, per-user grants + expiry, watermarking, view/download tracking; presigned S3 URLs; WORM for executed docs; all access → Audit. |
| **Compliance & Onboarding** | KYC/KYB, accreditation/QP verification, sanctions/PEP screening; **exposes the compliance-status oracle** other modules consult. `GET /v1/compliance/status?subjectId=` |
| **Agreements & E-Signature** | Templated NDAs / term sheets; envelopes, signing order, completion callbacks; executed PDF → deal record + WORM. |
| **Search & Discovery** | OpenSearch faceted search over opportunities/allocators; tenant + disclosure-tier filters enforced **server-side**; saved searches & alerts. |
| **Audit & Ledger** *(standalone)* | Immutable, hash-chained append-only log of every security/compliance-relevant action; 7-year retention; compliance exports. |
| **Notification** | Email + in-app inbox + webhooks; per-tenant templates, preferences. |

> **Deferred to Phase 2+ (per the critic — money movement is out of MVP scope):** the **Commitments & Funding** service (capital calls, wire instructions, Modern Treasury/Plaid) is removed from the MVP service catalog and integrations list.

### Core data model (Aurora Postgres 16)

Every tenant-scoped row carries `org_id` (RLS-enforced). Principal entities:

- **Organization** (`type: allocator|sponsor|platform`, `entity_type`, `kyb_status`, `risk_rating`) — root of all RLS-scoped rows.
- **User**, **Membership** (`role_id`, `scopes` jsonb ABAC), **Role** (`permissions` jsonb; referenced by the OpenFGA model).
- **AllocatorProfile** (`investor_classification: accredited|qualified_purchaser|institutional`, `aum_band`) → **Mandate** (`asset_class`, `stage`, `geographies[]`, `ticket_min/max`, `target_irr`, `exclusions` jsonb, `thesis_text`, **`thesis_embedding` vector**, `version`, `status`).
- **Opportunity** (`kind: company_raise|fund_raise|secondary|co_investment|direct_deal`, `asset_class`, `sector`, `geography`, `target_raise`, `min_ticket`, `disclosure_tier`, **offering-exemption flag**) → **OpportunityRound**, **DataRoom**.
- **Match** (`mandate_id`, `opportunity_id`, `score`, `score_breakdown` jsonb, `hard_filters_passed` bool, `allocator_action`, `sponsor_action`, `status: proposed|mutual|declined|expired`) → 0..1 **Deal**.
- **Deal** (`match_id`, `stage: intro|nda|diligence|ioi|ic_review|loi|…`, `owner_user_id`, `workflow_run_id` (Temporal)) → **DealParticipant**, **Agreement**, DataRoom scope.
- **DataRoom** (`kms_key_id`, `watermark_policy`) → **Document** (`s3_key`, `content_hash` sha256, `object_lock_until` WORM) → **DocumentAccessGrant** (`permission: view|download`, `expires_at`).
- **ComplianceCase** (`check_type: kyc|kyb|accreditation|aml_screening`, `vendor`, `vendor_ref`, `result: pass|fail|review|expired`, `risk_score`, `expires_at`) — gates Match intros, DataRoom access, and stage transitions.
- **Agreement** (`type: nda|term_sheet|…`, `esign_envelope_id`, `executed_document_id`).
- **AuditEvent** (`org_id` partition key, `actor_user_id`, `action`, `resource_type/id`, **`prev_hash` / `record_hash` chain**, `metadata` jsonb, `occurred_at`) — append-only, hash-chained.

*(Commitment / CapitalCall entities exist in the full model but are Phase 2+; the MVP records a soft, non-binding commitment on the Deal, not a binding Commitment row — see [§13](#13-regulatory--design-corrections).)*

### Integrations (MVP unless noted)
Identity/SSO (Okta / Entra ID / Auth0 — **Phase 2**) · KYC (Persona / Onfido) · KYB/UBO (Middesk / LexisNexis Bridger) · AML screening (ComplyAdvantage / Refinitiv World-Check) · accreditation/QP (Parallel Markets / VerifyInvestor) · e-signature (DocuSign / Dropbox Sign) · email (SES / Postmark) · observability (Datadog). **Deferred:** market data (PitchBook/Preqin/Capital IQ), external VDR federation (Datasite/Ansarada), payments/banking (Modern Treasury, Plaid), billing (Stripe — thin in MVP). **Add a vendor-risk-management program with at least one fallback KYC/screening vendor** (no single-vendor SPOF).

### Cross-cutting concerns
- **Multi-tenancy isolation:** shared Aurora with mandatory `org_id` RLS; tenant id is a signed JWT claim set into the DB session (`SET app.current_org`) at request start, so a query can't cross tenants even on a bug. Large tenants can be promoted to a dedicated schema/cluster. Per-tenant KMS CMKs encrypt data-room objects.
- **AuthZ:** coarse RBAC + fine-grained relationship-based ABAC via OpenFGA (*"user X can view document Y because they're a participant on deal Z in diligence"*). Every gate also checks the compliance oracle **at request time**.
- **Search:** OpenSearch read model kept in sync from Postgres. **For the MVP, use the transactional outbox + a simple synchronous indexer** rather than standing up Kafka/Debezium CDC (deferred to scale). Queries always apply tenant + disclosure-tier + accreditation filters server-side — but results are **re-verified against the compliance oracle before any intro, grant, or e-sign** (the index is a discovery convenience, never the authority).
- **Eventing & workflows:** transactional outbox → EventBridge for domain events; **Temporal** for durable, retryable, human-in-the-loop flows; BullMQ for lightweight jobs.
- **Audit:** a **separate, append-only, hash-chained** ledger on WORM storage, stored apart from app admins with read-only auditor access. **Per-tenant hash chains** with a defined ordering strategy (avoids a global serialized-write bottleneck and correctness hazard). **Ledger stores pseudonymized references/tokens, not raw PII**, so GDPR erasure of PII never breaks the chain.
- **Security posture:** TLS 1.3 (mTLS internal), KMS/pgcrypto at rest, S3 Object Lock (WORM) for executed docs, WAF/Shield, least-privilege IAM, region-pinning for future EU residency, GDPR/CCPA DSAR tooling. Targets **SOC 2 (Type I at GA, Type II bridge)** and ISO 27001.
- **Scalability & resilience:** stateless services on Fargate with target-tracking autoscaling; Aurora Multi-AZ failover; PITR backups; cross-region DR for datastore and document store; contract-tested service boundaries.

---

## 8. Security, compliance & regulatory

This is a regulated-finance product; compliance is the product surface, not an afterthought. **Rules gate everything; the compliance gate is 100% deterministic and never delegated to ML.**

### Regulatory framework (US-first)

| Regime | Why it applies | What Meridian does |
|---|---|---|
| **Reg D 506(b)** | Private placements without general solicitation; requires a **pre-existing substantive relationship** | **See correction below — likely dropped from MVP.** If hosted: relationship-gated visibility, never publicly searchable, 35-non-accredited cap, Form D support |
| **Reg D 506(c)** | General solicitation permitted; accredited-only with **reasonable-steps verification** | Documented verification workflow (income/net-worth/third-party letter within 90 days); block allocation/e-sign until verified |
| **Reg S** | Non-US allocators, offshore sales | Determine US-person status at onboarding; segregate Reg S / Reg D pools; no directed selling into the US |
| **Exchange Act §15 (broker-dealer)** | Soliciting + **transaction-based comp** risks unregistered-BD status | **MVP: flat SaaS fees only, no transaction comp, no role in negotiation/closing.** Encode in the fee engine. BD partner in Phase 2 |
| **Investment Advisers Act (1940)** | Recommending specific securities for comp → adviser | Frame matches as **neutral criteria-based filtering**; non-advice disclaimers; keep the gate deterministic |
| **Investment Company Act §3(c)(1)/3(c)(7)** | Fund exclusions | Track eligibility tier per fund; enforce 3(c)(1) beneficial-owner caps; QP gating for 3(c)(7) |
| **BSA / PATRIOT Act §326 / FinCEN CDD** | AML exposure | **Reframed — see correction.** Risk-based CIP, UBO to 25%, screening; SAR/CTR only attach to a BSA-defined financial institution |
| **OFAC (SDN, 50% Rule)** | Strict no-fault liability | Screen every party + UBO against OFAC/UN/EU/UK, PEP, adverse-media at onboarding and continuously; 50% Rule; geo-block sanctioned jurisdictions |
| **Reg S-P / S-ID** | NPI safeguards, red flags | Safeguards program, privacy notices, identity-theft red-flags, 30-day breach notice |
| **GDPR / UK GDPR** | EU/UK data subjects | Lawful basis, DSAR, Art. 30 records, DPIAs, SCCs / DPF, 72-hour breach notice |
| **CCPA/CPRA + US state laws** | US individual users | Notices, consumer rights, GPC signals, service-provider contracts |
| **GLBA Safeguards Rule** | Financial-institution info security | Documented infosec program, encryption, MFA, vendor oversight, IR plan |

### KYC/AML program (risk-based, tiered)
CIP (name/address/DOB/TIN for individuals; entity equivalents) → CDD & **UBO at 25% + one control person** → **screening** (OFAC/UN/EU/UK sanctions, PEP, adverse-media at onboarding and continuously; OFAC 50% Rule) → risk scoring & **EDD** for high-risk/cross-border → ongoing monitoring & periodic KYC refresh (12/24/36 months by tier) → recordkeeping. **The allocation workflow is hard-gated: no data-room access, e-sign, or (Phase 2) capital movement until KYC/AML is "cleared" for all relevant parties.**

### Accreditation (per-offering gate, distinct from KYC)
- **506(c):** documented reasonable-steps verification — income ($200k/$300k, W-2s/1099s/returns), net worth (>$1M ex-primary-residence + credit report), **or** a third-party letter dated within 90 days **from a registered BD, SEC-RIA, licensed CPA, or attorney**. Supports the expanded 2020 categories (Series 7/65/82, knowledgeable employees, qualifying entities).
- **3(c)(7) Qualified Purchaser** (≥$5M individuals / ≥$25M entities): treated as **rep-and-warranty / self-certification** — there is no documentary verification vendor for QP the way there is for accreditation (critic correction).
- Sensitive financials flow through a **walled verification vendor**; Meridian stores only **results + evidence pointers**, never raw financials, structured as the **issuer's documented agent**.

### RBAC + ABAC roles
Platform Super Admin (break-glass, no tenant data by default) · Tenant Org Admin · **Compliance / AML-BSA Officer** · Deal Lead · Analyst · Data Room Manager · Investor Member · Issuer Member · Legal/Counsel · Finance/Treasury Ops · Auditor (read-only) · Support (consent-gated, time-boxed impersonation) · Service/API principal.

**Separation of duties:** the person who creates a deal cannot approve its compliance gate; the AML officer who dispositions a case cannot be the benefiting deal lead; (Phase 2) capital movement requires dual control. Enterprise auth via SAML/OIDC SSO + SCIM (Phase 2), mandatory MFA (WebAuthn/TOTP) for privileged roles, JIT elevation with expiry for break-glass. Sensitive fields (accreditation evidence, UBO PII) carry field-level permissions independent of base role.

> **SoD caveat (critic):** dual approval is unworkable for 1–3-person family-office tenants. A **platform-side compliance-ops role backstops approvals** for small tenants.

### Data protection & audit
AES-256 at rest (KMS, customer-scoped keys) + field-level encryption/tokenization for the most sensitive PII (TIN, accreditation financials, UBO, bank details) · TLS 1.2+/1.3, mTLS internal · org_id authZ + RLS backstop · Secrets Manager with rotation · envelope encryption, per-tenant CMKs · **data minimization** (raw financials never in the primary DB) · region-pinned residency · private VPC, WAF, DDoS · encrypted tested backups + PITR + WORM copies · data-room DRM (per-viewer watermarking, revocable, no persistent client caching) · secure SDLC (SAST/DAST/SCA, secret scanning, IaC scanning, annual pen test, bug bounty).

**Audit trail:** immutable, tamper-evident, full 5-W record (who/what/when/where/why) for every security- and money-relevant event, streamed to a SIEM with anomaly alerting (impossible-travel, mass downloads, privilege escalation). WORM + hash-chained, separate from app admins. Retention: 6-year WORM if operating as/through a BD (Rule 17a-4), else 7-year default with legal-hold override. **Logs store references/tokens, not raw PII.**

### Certifications (roadmap)
**SOC 2 Type I at GA → Type II bridge** (Type II needs a 3–12-month observation window and cannot be finished by launch) · ISO 27001 (+27017/27018) · SOC 3 seal · GDPR + EU-US DPF · CCPA/CPRA · CSA STAR · annual pen test · independent AML audit (if/when BD) · NIST CSF/800-53 mapping. **Add a VPAT / WCAG conformance track** — pension/government/sovereign procurement commonly requires it.

---

## 9. Business intelligence & analytics

Enterprise finance users live in dense, defensible numbers. Analytics spans **platform health**, **match quality**, **deal flow**, **portfolio performance**, and **compliance SLA**.

### Dashboards
- **Marketplace Liquidity & Health** (ops/exec) — GAV vs target, two-sided liquidity ratio, dual acquisition funnel, revenue bridge + take rate, TTFM p50/p90, NDR cohort heatmap.
- **Match Intelligence & Model Quality** (data science/product) — score distribution + calibration curve, acceptance & match-to-close by cohort, Precision@10 vs baseline, rejection-reason Pareto, feature-drift/AUC monitoring, A/B scoreboard.
- **Deal Flow & Sourcing** (allocator CIO) — inbound by sector/geo/strategy, channel mix + attribution, screening throughput, coverage-vs-mandate gaps.
- **Pipeline & Deployment Forecast** (deal leads/IC) — funnel in $ and count, Kanban aging + SLA flags, weighted pipeline value & coverage ratio, stage-conversion waterfall, forecast bands, win/loss.
- **Portfolio & Performance** (IC/PM) — Committed/Called/Uncalled/NAV tiles, J-curve, Net IRR/TVPI/DPI/RVPI/MOIC by vintage, exposure treemap + HHI, call/distribution calendar, PME.
- **Fundraise Command Center** (GP IR) — hard-committed vs soft-circled vs target + fill rate, commitment velocity + projected close, investor funnel, data-room engagement heatmap.
- **Compliance, Onboarding & Risk** (compliance/legal) — KYC/AML time-to-clear SLA, accreditation coverage, OFAC/PEP hit queue, gating block-rate by reason.
- **Executive Scorecard (Tenant/Board)** — north-star tiles vs target with sparklines, capital deployed/raised vs plan, risk roll-up, annotated board-pack export.

### Headline KPIs (precise definitions)
Gross Allocation Volume (GAV) · Take Rate · Two-Sided Liquidity Ratio · **Match Acceptance Rate** · **Match-to-Close Conversion** (cohorted, fixed maturity window) · Time to First Match (p50/p90) · **Match Precision@K** vs baseline · Mandate Fit Score (0–100; any hard/compliance violation caps at 0 and prevents surfacing) · Weighted Pipeline Value · Stage Conversion · Cycle Time (p50/p90) · Pipeline Coverage Ratio (healthy ~3–4×) · Win Rate · Fill Rate · Net IRR · TVPI/DPI/RVPI · Dry Powder · **KYC/AML Clearance Rate & Time-to-Clear** · Compliance Gating Block Rate · Data Room Engagement Score.

### Data pipeline (Phase 2 warehouse; MVP is app-native)
OLTP Postgres → (Phase 2) CDC → S3 bronze → Snowflake silver/gold (Kimball star: `fct_allocations`, `fct_matches`, `fct_pipeline_stage_history`, `fct_cashflows`, `fct_engagement`, `fct_compliance_events` around conformed dims) → **dbt** transforms + tests → **governed semantic layer** (every KPI defined once) → Looker/Tableau embedded per-tenant with the same RLS/RBAC → reverse-ETL pushes scores back into the app. Financial marks are snapshotted with explicit as-of dates as slowly-changing dimensions (fully restatable). **MVP ships design-partner analytics natively over Aurora read replicas — the full warehouse is Phase 2.**

### Visualization guidelines
Tables + small multiples lead; charts for trends/comparisons; right-aligned tabular numerals with consistent units; explicit as-of date + freshness badge; always show denominators/sample size and grey out small-n; diverging palettes only for signed metrics; **colorblind-safe (Okabe-Ito) + WCAG AA in light and dark**; the right form per concept (waterfall for capital-account/revenue bridges, funnel for pipeline, J-curve for fund performance, cohort heatmap for vintage); reference/benchmark lines; drill-down with preserved lineage (portfolio→position→transaction, score→features); p50/p90 not just averages; enforce tenant + MNPI visibility **in the viz layer** with a confidentiality watermark on exports; export cleanly to board-pack PDF.

---

## 10. UX, information architecture & design system

### Navigation
Persistent, **role-aware left sidebar**: Workspace · Discover · Mandates · Pipeline · Data Rooms · Analytics · Admin & Compliance (officers/admins only). Top bar carries the org/workspace switcher, global search, a **Cmd-K command palette**, a notifications/approvals bell, help, and the account menu. Record screens use a contextual tab bar (Overview · Terms · Data Room · Q&A · Sign · Activity) and breadcrumbs for deep, shareable, audit-logged URLs. Collapses to an icon rail, then a mobile drawer.

### Information architecture (sections → screens)
- **Workspace** — Allocator Dashboard · Notifications & Approvals Inbox · Saved Searches & Watchlist
- **Discover** — Opportunity Marketplace · Match Feed · Match Detail · Opportunity/Deal Detail (with Data Room)
- **Mandates** — Mandate List · Mandate Builder · Mandate Performance & Coverage
- **Pipeline** — Deal Pipeline (Kanban/Table) · Allocation Workflow & Stage Gates · Task & IC Review Queue
- **Data Rooms** — Data Room Index · Secure Document Viewer · Diligence Q&A Thread
- **Analytics** — Portfolio & Exposure · Pipeline & Match Effectiveness · Scheduled Reports & Exports
- **Admin & Compliance** — Compliance Console · Users, Roles & Permissions · Immutable Audit Log · Org/Entity/SSO Settings · Billing
- **Account & Onboarding** — Onboarding & Accreditation Wizard · Profile & Security · Notification Preferences

### Design system

**Vibe:** institutional, trustworthy, data-dense but calm — *"Bloomberg terminal meets Stripe."* Cool deep-navy dark canvas by default (reduces glare in long underwriting sessions) with a matched light mode for compliance review and print. Restrained chrome, high-contrast type, a single confident blue for primary action. **Color is reserved for meaning** — gains/losses, match strength, compliance status — never decoration.

**Color tokens**

| Token | Hex | Use |
|---|---|---|
| background | `#0A0E17` | app canvas |
| surface | `#141A26` | cards / panels |
| primary | `#3B6EF5` | primary action / brand blue |
| accent | `#CBA15A` | gold accent, pending/attention |
| positive | `#24B47E` | gains, verified, strong match |
| negative | `#E5484D` | losses, blocked, destructive |
| textPrimary | `#EAEEF6` | primary text |
| textMuted | `#8B96A9` | secondary text |
| border | `#232B3B` | 1px borders / dividers |

**Typography.** Inter (Inter Display ≥24px; production alternative Söhne/Aeonik), weights 500–700, tracking −1% to −2% at display sizes. Body Inter 14px with **tabular numerals** so figures align across rows. **IBM Plex Mono** (fallback JetBrains Mono) for monetary figures, entity IDs, timestamps, hashes. 8pt spacing grid, minor-third type scale (Display 32/40 · H1 24/32 · H2 20/28 · H3 16/24 · Body 14/20 · Caption 12/16). Numerals always tabular in tables/KPIs; currency/percentages right-aligned.

**Components.** Border-first, low-elevation surfaces (1px `#232B3B` border on `#141A26`; shadow reserved for overlays). Radii 6px inputs/buttons, 10px cards, full-round pills. Primary = filled blue; secondary = ghost with border; destructive = red. 2px accessible focus ring. **Data tables are the workhorse:** sticky headers, 40px rows (32px compact toggle), right-aligned numerals, inline status pills. Semantic badges (verified/pending/blocked/neutral). **Match strength on a 3-tier scale** (Strong ≥80 / Good 60–79 / Exploratory <60). Calm charts: muted 1px gridlines, no heavy fills, tabular-num axis labels.

**Prototype priority (built in this deliverable):** Allocator Dashboard → Opportunity Marketplace → Match Detail → Opportunity/Deal Detail with Data Room → Mandate Builder → Deal Pipeline/Kanban → Analytics Dashboard → Admin/Compliance Console.

---

## 11. Business strategy

### Business model
Two-sided, land-and-expand, priced to seed liquidity first (subsidize the allocator/demand side; monetize issuers + the transaction rail).

**Revenue streams:** allocator enterprise SaaS (org licenses + seats) · GP/issuer raise-enablement subscriptions + tiered listing/placement · **transaction/facilitation fees earned only through a registered BD/funding-portal partner** · data & market-intelligence subscriptions · trust & verification services (vendor pass-through + margin) · VDR usage (metered overage) · API/integration access · professional services.

**Indicative pricing:** Allocator Professional $18k/user/yr; Team $60k/yr; Enterprise $120k–$300k/yr; Data add-on $50k–$150k/yr. GP/Issuer: Emerging $25k/yr (<$250M), Growth $60k/yr ($250M–$1B), Institutional $120k–$150k/yr (>$1B); featured placement $10k–$40k/raise. Transaction layer (via BD partner): 25–75 bps on committed capital (blended net-to-platform ~40–50 bps) vs. ~200 bps standard placement fee — a ~4× issuer saving. Blended target ACV Year 1 ~$55k → ~$95k–$110k as data + transaction attach grows.

### Market sizing
- **TAM ≈ $28B/yr** — placement fee pool ~$12B (≈200 bps on agent-intermediated private capital) + private-markets data ~$9B + deal-workflow/VDR/fund-admin tech ~$7B. Anchored on ~$13.1T private-markets AUM (end-2023) → ~$18T+ by 2027.
- **SAM ≈ $5.5B/yr** (~20%) — North America + UK/EU + digitally-transacting APAC/MENA hubs; the onboardable institutional segments (~2,500 raising GPs, ~1,500 institutional LPs/FoFs, ~5,000 investment-grade family offices, mid/large corp-dev).
- **SOM ≈ $200–220M ARR by Year 5** (~4% of SAM). Interim: Y1 ~$4–6M (10–15 design partners → early GA), Y2 ~$18–25M, Y3 ~$55–70M.
- **Note:** the transaction line is gated by BD/funding-portal registration; SaaS + data revenue is the unrestricted, counter-cyclical base (allocators must deploy dry powder even in down markets), de-risking vs. transaction-only marketplaces.

### Go-to-market
Seed **supply first** (hand-curated inventory of vetted GPs/deals) so early allocators see day-one value → recruit **10–15 marquee paid design partners** across personas → sales-led enterprise ABM into the top ~500 GPs and ~300 family offices/FoFs, land with one module and expand → subsidize demand, monetize issuers + transactions → stand up the **regulatory rail early** (BD partner + KYC/AML/accreditation vendors — "compliance-native" is the wedge) → ecosystem co-sell with fund admins, custodians, law firms; turn placement agents into channel partners → association GTM (ILPA, SBAI, family-office networks) + invite-only LP–GP summits → content/data flywheel → **security-led credibility** (SOC 2, ISO 27001, SSO/SCIM) → expand US institutional → UK/EU → APAC/MENA.

### Roadmap (business view)
- **Phase 0–1 (M0–6):** foundations + design-partner MVP — multi-tenant + RBAC + audit, matching v1 (rules + explainable scores), compliance-native core, 10–15 paid design partners live, 2–3 progressed to term sheet.
- **Phase 2 (M6–12):** GA + transaction rail — self-serve issuer onboarding, matching v2 (ML embeddings/feedback), **BD partner live for first compliant facilitation fees**, SOC 2 + SSO/SCIM, ~$18–25M ARR trajectory.
- **Phase 3 (M12–24):** multi-asset + data product + integrations — co-invest & secondaries modules, paid Data & Analytics tier, Salesforce/DealCloud + fund-admin connectors + public API, UK/EU via FCA/MiFID partner, NRR >115%, ~$55–70M ARR.
- **Phase 4 (M24–36):** network scale + AI copilot + new geographies — AI diligence copilot, richer closing workflows, APAC/MENA hubs, ~$200–220M ARR SOM checkpoint.

### Board metrics
ARR + growth (split by revenue type) · NRR (>115%) / GRR (>90%) / churn · GMV facilitated + blended take rate · marketplace-liquidity funnel (match→intro→data-room→term sheet→closed) · TTFM + cycle time (target 3–6 weeks) · two-sided health (active allocators/opportunities, liquidity ratio, fill rate, repeat rate) · CAC / CAC payback (<18mo) / LTV:CAC (>3×) / Magic Number · gross margin (>75% software) / burn multiple / Rule of 40 · sales efficiency (coverage 3–4×, ACV, win rate, cycle length) · engagement (WAU/MAU, seats activated, data-room activity) · trust & compliance (SOC 2/ISO status, uptime, KYC/accreditation completion, zero material incidents) · cohort economics (net dollar expansion, module attach).

---

## 12. Top risks & mitigations

| # | Risk | Sev | Mitigation |
|---|---|---|---|
| 1 | **Unregistered broker-dealer** — transaction fees while soliciting/facilitating | High | MVP charges **flat SaaS only, zero transaction comp**, no negotiation/closing role; encode in the fee engine. Counsel opinion before Phase 2; facilitation fees only via a FINRA-member BD/funding-portal partner as BD-of-record |
| 2 | **General-solicitation violation (506(b) vs 506(c))** | High | Offering-exemption type is a mandatory attribute driving visibility/gating; 506(b) never publicly searchable; 506(c) requires documented verification before e-sign; segregate Reg S/Reg D pools; log every decision |
| 3 | **Sanctions/AML failure** — sanctioned party or blocked UBO (OFAC strict liability) | High | Hard-gate all downstream activity on "cleared"; screen all parties + UBOs continuously; 50% Rule + 25% UBO mapping; EDD on high-risk; AML/BSA officer + SAR workflow + annual independent testing |
| 4 | **Cross-tenant leakage / IDOR** | High | One centralized authZ policy layer scoped by `org_id` + Postgres RLS backstop; per-tenant KMS; automated isolation + IDOR-fuzzing tests in CI; anomaly monitoring; optional dedicated schemas for large tenants |
| 5 | **Matchmaking = unregistered investment advice** | Med | Neutral criteria-based filtering with explainable reason codes; issuers/humans control what surfaces; prominent non-advice disclaimers; gate stays 100% deterministic, never ML |
| 6 | **Two-sided cold start** | High | Seed supply first (curated vetted inventory); 10–15 paid marquee design partners; Phase 0 rules+embeddings useful with zero history; subsidize allocators, monetize issuers |
| 7 | **Sensitive-data breach** (accreditation financials, UBO, TINs, bank details) | Med | Data minimization + tokenization (raw financials via walled vendor, store results + pointers only); field-level encryption; KMS + TLS 1.3/mTLS; least-privilege field RBAC; annual pen test; IR playbooks meeting GDPR 72h / Reg S-P 30d |
| 8 | **Audit-trail integrity / insider tampering** | Med | Immutable, hash-chained, append-only ledger on WORM, separate from app admins, read-only auditor access; full who/what/when/where incl. impersonation chains; SIEM alerting; strictest-rule retention with legal hold |

---

## 13. Regulatory & design corrections

An adversarial compliance-and-completeness critic reviewed the synthesized plan. Its material findings are folded into the sections above; the highest-impact corrections:

1. **Engage securities counsel *before* M1, not before Phase 2.** The 506(b) relationship problem, IA-creep, placement-agent registration, and AML statutory status shape the MVP data model, matching UX, and onboarding — not just the fee engine.
2. **Consider dropping 506(b) from the MVP; launch 506(c)-only** (general solicitation permitted, verified-accredited). 506(b) legally requires an *issuer-established pre-existing substantive relationship before the offering*; a platform introducing strangers can't cure this by gating visibility — so 506(b) may be non-viable without registering as, or partnering with, a BD/IA.
3. **Reframe AML as contractual, risk-based OFAC/sanctions + KYC screening, not a statutory SAR/CTR program**, until BD status exists. A flat-fee SaaS that moves no money is likely not a BSA-defined financial institution and cannot file a CTR; remove CTR references and align SAR language to the actual (likely non-filer) status.
4. **Freeze the matching narrative to the MVP:** α=1.0, generic text embeddings, **no propensity model, no collaborative filtering, no two-tower model** (none can be trained at cold start). The worked example's 0.78 ML score and α=0.5 blend are corrected to a pure-rules launch; all learned components move explicitly into the phased roadmap.
5. **Fix the dimension math:** geography is documented as the 11th dimension; weights sum to exactly 100%.
6. **Gate every disclosure/action against the authoritative compliance oracle at request time.** OpenSearch is a discovery convenience whose results are re-verified before any intro, grant, or e-sign — never the compliance authority (avoids surfacing now-ineligible opportunities on a stale index).
7. **Cut MVP infrastructure to fit scope/timeline:** defer Kafka/Debezium CDC in favor of the transactional outbox + a synchronous indexer; remove **Commitments & Funding / Modern Treasury / Plaid** from the MVP (money movement is already out of scope).
8. **Design an explicit MNPI / information-barrier model:** scope and log platform-staff and placement-agent access, add tipping detection, disclose the platform's own sourcing conflicts, and **segregate seeded/curated inventory from "neutral" matched inventory** (the cold-start seeding conflicts with the neutral-filter posture unless disclosed and separated).
9. **Reconcile erasure vs. retention up front:** securities/AML recordkeeping and legal holds override GDPR erasure; scope crypto-shredding to data *not* under a retention obligation; keep the **audit ledger pseudonymized** (tokens/references, not raw PII) so erasure never breaks the hash chain.
10. **Correct the finance errors:** separate the **ERISA plan-asset 25% rule / VCOC-REOC** handling from **UBTI/ECI blockers** (distinct issues); restate the 506(c) "90-day" rule as *document recency*, not status expiry; label **QP status as rep-and-warranty**, not vendor-verified.
11. **Structure 506(c) verification** so the platform acts as the **issuer's documented agent** with issuer-retained evidence; rely on the third-party-letter safe harbor only when the letter is from a registered BD, RIA, CPA, or attorney.
12. **Make the AML/BSA officer and a staffed compliance-ops function an explicit M1 dependency and documented go-live gate** (dispositioning throughput + SoD backstop for small tenants).
13. **Reset buyer expectations to SOC 2 Type I at GA with a Type II bridge**; add a vendor-risk-management program with ≥1 fallback KYC/screening vendor; add a **VPAT/WCAG** track for pension/sovereign procurement.
14. **Add E&O insurance, ToS reliance/non-advice disclaimers surfaced in the match UI, an investor-complaint workflow, and a documented regulator-exam response playbook.**
15. **Booked "binding" commitment cuts against the BD-safe framing** — the MVP records a **soft, non-binding** commitment only; binding commitments and any funds flow wait for the BD rail.

---

## 14. Open questions

These shape scope and should be resolved with the user / counsel before build:

1. **Regulatory framing for launch** — confirm MVP is strictly flat-fee SaaS with no negotiation/closing role, and agree the trigger/timeline for engaging securities counsel and a BD/funding-portal partner to unlock transaction fees.
2. **Persona focus for MVP** — recommend narrowing to institutional LPs/FoFs + GPs raising primaries (+ family offices), deferring corp-dev/M&A, treasury/private-credit, and sovereign-specific workflows. Agree?
3. **Build vs. federate the data room** — ship the native permissioned/watermarked VDR (recommended) vs. integrate Datasite/Ansarada for sponsors who already host materials.
4. **KYC/AML/accreditation vendor selection** — Persona vs Onfido; Middesk vs LexisNexis; ComplyAdvantage vs Refinitiv; Parallel Markets vs VerifyInvestor. Existing relationships or procurement constraints?
5. **Jurisdictional scope** — US-only (Reg D 506(c) + Reg S) for launch, or do design partners require EU/UK (AIFMD/MiFID) that pulls the full compliance rule engine forward?
6. **Compliance ops** — stand up an in-house AML/BSA officer + compliance-ops team before the first live counterparty, or run design-partner onboarding in a limited/manual mode first? (Gates the go-live date.)
7. **Design partners** — which specific marquee logos are realistically reachable, and what paid-pilot pricing converts them into references?
8. **"Anonymous by default" for large tickets** — do sovereign/pension and family-office partners need extra identity-masking (hiding check size / entity type pre-opt-in), and does that change the match-explainability UI?

---

## 15. Milestone plan

A buildable ~7-month design-partner MVP (the full expert vision — 13 services, Kafka/Debezium, full ML, SOC 2 Type II by launch — is Series-A-scale and deliberately staged down here).

| Milestone | Timing | Deliverables |
|---|---|---|
| **M0 — Foundations & tenancy** | Months 0–2 | Multi-tenant org/workspace model with `org_id` RLS + centralized RBAC+ABAC (OpenFGA); auth (login, MFA, session/token) with SSO/SCIM stubbed; immutable hash-chained AuditEvent ledger on WORM from day one; core data model on Aurora 16; AWS baseline (ECS Fargate, CloudFront, S3 Object Lock, per-tenant KMS CMKs, Secrets Manager, Terraform, GitHub Actions CI/CD, IDOR/isolation tests in CI) |
| **M1 — Compliance-native onboarding gate** | Months 2–3.5 | KYB/UBO + KYC signatory verification (Temporal-orchestrated); accreditation/QP verification with 506(c) reasonable-steps evidence trail (results + pointers only); OFAC/PEP/adverse-media screening with a compliance case queue and pass/fail gating; the compliance-status oracle all gates consult; onboarding wizard with progressive gate-unlock. **Securities counsel engaged; AML/BSA officer + compliance-ops staffed (go-live gate).** |
| **M2 — Mandates, listings & rules-based matching** | Months 3.5–5 | Mandate Builder (taxonomy-driven, anonymous by default, versioned, embeddings); Opportunity/Listing Builder with mandatory offering-exemption flag; Stage 1 eligibility gate + Stage 3 weighted content score with pgvector similarity; ranked, bucketed match feed with reason codes; OpenSearch discovery with server-side tenant + tier + accreditation filters (oracle re-check at action time); saved searches + alerts |
| **M3 — Introductions, data room, e-sign & pipeline** | Months 5–6 | Double opt-in introductions + secure per-deal messaging; tiered, permissioned, watermarked VDR (presigned short-TTL URLs, access logging, WORM for executed docs) + lightweight Q&A thread; e-signature (NDA + term sheet) with certificate retention; Deal Pipeline CRM (Kanban + table) with enforced stage gates + soft-commitment record; notifications |
| **M4 — Design-partner launch & instrumentation** | Months 6–7 | Design-partner analytics (match acceptance, funnel/stage conversion, TTFM, KYC time-to-clear); 10–15 paid design partners live across both sides, 2–3 progressed to term sheet; feedback loop capturing engagement/outcome events to seed future ML; security readiness (SOC 2 Type I + Type II bridge initiated, pen test, GDPR/CCPA DSAR tooling, IR playbooks) — positioning for Phase 2 GA, SSO/SCIM, and the counsel-blessed BD transaction rail |

---

## 16. Appendix — a worked match

**Allocator:** *Meridian State Retirement System*, a $4.2B public pension. Mandate: North American mid-market **buyout**, $25–50M ticket, target net IRR ≥15%, wants realized DPI, **ESG binding** (SFDR Art. 8+), ERISA-plan-asset-aware, tax-exempt (UBTI-sensitive), fee-sensitive (≤2.0% mgmt), max 10% of PE bucket to any single manager.

**Opportunity:** *Cedar Ridge Capital Fund IV*, $1.2B North American mid-market buyout; Fund III top-quartile (realized DPI 1.4×, net IRR 19%, loss ratio 8%); terms 2.0%/20%/8% pref; min LP commitment $10M; Article 8; cleared for US institutional marketing.

- **Stage 1 — eligibility gate:** institutional Qualified Purchaser → passes 3(c)(7); OFAC/KYC clear; no board interlock → conflict check passes; ERISA plan-asset handled via appropriate structure (25% cap / VCOC-REOC — *distinct from* the UBTI/ECI blocker for tax-exempt returns); US-institution marketing cleared; pay-to-play check on any placement agent clean. **Pair is ELIGIBLE.**
- **Stage 2 — retrieval:** the mandate embedding retrieves Cedar Ridge IV in the top candidates via ANN on the buyout / mid-market / North-America thesis vector.
- **Stage 3 — scoring (personalized weights):** asset class buyout=buyout f=1.00 (16%); check size $25–50M above $10M min, within capacity f=0.95 (14%); sector/thesis cosine f=0.88 (13%); stage/vintage fresh Fund IV, under-deployed f=0.92 (10%); geography North America exact f=1.00 (8%); risk/return 19% vs ≥15% f=0.90 (10%); track record top-quartile DPI 1.4× f=0.93 (9%); diversification $50M ≈1.2% of PE bucket f=0.85 (7%); terms 2.0% meets ≤2.0% f=0.80 (5%); relationship no prior tie f=0.30 (5%); ESG Art. 8 meets binding requirement f=0.90 (promoted). **S_content ≈ 89.**
- **MVP blend:** α=1.0 (pure rules + embeddings) → **MatchScore ≈ 89 → "Strong."** *(In a later phase, once outcome data exists, a calibrated propensity model would blend in; at cold-start launch it does not.)*
- **Reason codes:** *"Matched: mid-market buyout, North America, $25–50M ticket fits, top-quartile prior DPI 1.4×, 2.0% fee within your limit, Article 8 ESG. Watch-outs: no prior relationship with this GP; vintage pacing check advised."*
- **Surfacing & consent:** appears on both dashboards (double opt-in). Meridian State requests an intro → Cedar Ridge accepts → NDA e-sign → gated data-room access opens. **Every step writes an audit record** (score, features, reason codes, consent, compliance results).

---

*Planning artifact for the Meridian investment matchmaking platform. Produced on the `claude/web-finance-software-planning-txpczi` branch. Companion: `prototype/index.html` (clickable design prototype).*
