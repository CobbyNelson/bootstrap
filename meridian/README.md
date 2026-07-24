# Meridian

**An investment matchmaking platform for enterprise finance teams** — a two-sided marketplace that pairs institutional capital allocators with vetted investment opportunities and moves a match to a closed, audit-ready allocation on one compliance-native rail.

This directory holds the **planning-phase** deliverables for the product (working codename *Meridian*).

## Contents

| Path | What it is |
|---|---|
| [`PRODUCT_AND_ARCHITECTURE_PLAN.md`](./PRODUCT_AND_ARCHITECTURE_PLAN.md) | The full architecture & product plan — domain/personas, marketplace model, feature scope, matching engine, systems architecture, security & compliance, business intelligence, UX & design system, business strategy, risks, regulatory corrections, open questions, and a milestone plan. |
| [`prototype/index.html`](./prototype/index.html) | A self-contained, clickable design prototype of the 8 priority screens. Open in any browser — no build step, no dependencies. |

## The prototype

Open `prototype/index.html` directly in a browser. Navigate via the left sidebar or press number keys **1–8**. Screens:

1. **Allocator Dashboard** — KPIs, top matches, mandate deployment pacing, tasks & approvals
2. **Opportunity Marketplace** — faceted discovery ranked by mandate fit
3. **Match Detail** — per-criterion fit breakdown, reason codes, compliance readiness
4. **Deal / Data Room** — tabbed underwriting workspace (Overview · Terms · Data Room · Q&A · Sign · Activity)
5. **Mandate Builder** — structured criteria + weighting sliders + live match preview
6. **Deal Pipeline** — Kanban with enforced stage gates
7. **Analytics** — deployment pacing, conversion funnel, exposure, match effectiveness
8. **Compliance Console** — KYC/AML queue, roles matrix, immutable audit log

Design system (dark institutional "Bloomberg-meets-Stripe"): deep-navy canvas `#0A0E17`, brand blue `#3B6EF5`, gold accent `#CBA15A`, semantic green/red reserved for gains-losses and compliance state.

## Status

Planning artifact on the `claude/web-finance-software-planning-txpczi` branch — for review and scoping before any production build. All data in the prototype is illustrative sample data.

## Guiding principle

**Compliance is the product surface, and rules are a floor while ML is a lift.** A deterministic eligibility gate reduces every candidate universe to legally and structurally eligible pairs *before* any scoring; no learned component can resurface a rejected pair. The MVP launches as pure SaaS with zero transaction-based compensation, keeping the platform clearly outside unregistered broker-dealer and investment-adviser status until a deliberate, counsel-blessed broker-dealer integration in a later phase.
