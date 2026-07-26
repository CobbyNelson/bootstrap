# Assets & Capital

A premium digital investment marketplace connecting **vetted businesses seeking capital** with a **global network of ready investors** — for capital raising, partnerships, and market expansion.

> _Where quality assets meet ready capital._

Built for [assetsandcapitalltd.com](https://assetsandcapitalltd.com).

## Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, React Server Components) |
| UI | **React 19** · **TypeScript** (strict) |
| Styling | **Tailwind CSS v4** (CSS-first `@theme` tokens) |
| Animation | **framer-motion** |
| Icons | **lucide-react** (+ inline brand SVGs) |
| Fonts | **Figtree** (headings) · **Inter** (body & UI) via `next/font` |

_The brief specified Next.js 15; the toolchain installed the newer Next 16 / React 19 / Tailwind v4, which we adopted._

## Design system

Defined in [`app/globals.css`](app/globals.css) as Tailwind v4 theme tokens:

- **Brand red** `#df2d25` / `#c11f18` · **navy** `#132f52` primary · **ink** `#10141c` & **cool paper** `#f8f9fb` neutrals.
- Headings Figtree, body and UI Inter, tabular numerals for figures. One type scale in `globals.css` (`--text-*`, `--tracking-*`, `--leading-*`) drives every size.
- Reusable primitives in `components/ui/`: `Button` (cva variants), `Badge`, `Reveal` (scroll animation), `Counter` (animated), `SectionHeading`, `OpportunityCard`.

## What's built

**Marketing** — premium home page (hero with live deal card, animated stats, how-it-works tabs, why-us, featured opportunities, 14-sector industries, investment-process band, services, testimonials, insights, events, CTA), plus `Investors`, `Businesses`, `About`, `Contact`, `Events`, `Insights`, and `Pricing` (listing tiers + success-fee model + services + FAQ).

**Marketplace** (`/marketplace`) — faceted filtering (region, sector, stage, instrument, tier), search, sort, grid/list views, empty state.

**Onboarding**
- **Investor mandate wizard** (`/register/investor`) — three branches (Private Equity / Real Estate / Fund) with conditional questions from the mandate questionnaire, autosave to `localStorage`, progress rail, validation, review & consent.
- **Business intake** (`/register/business`) — company, the ask, services & listing tier.

**Auth** — split-screen `/login`, `/register` hub.

**Dynamic content** — `/services/[slug]` (roadshows, market-access, business-plan, financial-modelling, teaser) and `/legal/[slug]` (privacy, terms, cookies, disclosures) as SSG.

**Global** — sticky nav with mega menu + mobile drawer, footer with newsletter form, SEO metadata, accessibility (skip link, focus states, reduced-motion), fully responsive.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (all routes prerender)
npm run start
```

## Integration seams (wire up real services next)

The UI is complete and runnable with illustrative data. These points are stubbed for real back-end integration:

- **Auth** — `components/auth/login-form.tsx` → Supabase Auth `signInWithPassword`.
- **Newsletter / contact** — `newsletter-form.tsx`, `contact-form.tsx` → `POST /api/*` (Resend email).
- **Onboarding submit** — wizard/intake success handlers → persist to Postgres (Prisma) + Supabase Storage for uploads.
- **Marketplace** — `lib/marketplace-data.ts` sample data → Prisma-backed queries + AI match scoring.
- **Payments** — pricing tiers → Stripe / Paystack / Flutterwave checkout + success-fee tracking.

## Roadmap

Next phases: Prisma/Postgres schema, investor & business dashboards, admin panel & CMS, payments, document vault (UploadThing), KYC workflow, and AI matching. See the platform architecture plan in `../meridian/PRODUCT_AND_ARCHITECTURE_PLAN.md` for the broader systems design.
