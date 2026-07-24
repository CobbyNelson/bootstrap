# Backend wiring guide

The app ships as a complete, production-styled front end with **integration
seams** — clearly marked points where live services plug in. Nothing here is a
throwaway mock: the data shapes, the scoring engine and the API route are the
real thing, running against in-memory data. Swap the data source for a database
and connect the services below to go fully live.

## 1. Database (Prisma + PostgreSQL / Supabase)

- Schema: [`prisma/schema.prisma`](../prisma/schema.prisma) (20 models).
- Set `DATABASE_URL` / `DIRECT_URL` (see `.env.example`), then:
  ```bash
  npx prisma migrate deploy
  npx prisma generate
  ```
- Replace the in-memory `MARKETPLACE` (`lib/marketplace-data.ts`) reads with
  Prisma queries. The matching API is already isolated for this — see §4.

## 2. Auth (Supabase Auth)

- Seam: `components/auth/login-form.tsx` (`onSubmit`) and the register flows.
- Wire `signInWithPassword` / `signUp`, then gate the `(app)` and `(admin)`
  route groups with middleware that checks the session.

## 3. Payments (Stripe / Paystack / Flutterwave)

- Seam: pricing tiers (`lib/content.ts` → `LISTING_TIERS`) and the billing UI
  (`components/dashboard/billing.tsx`).
- Add `app/api/checkout/route.ts` to create a session and a webhook route to
  fulfil. Keys in `.env.example`.

## 4. Live matching (already wired)

- `app/api/match/route.ts` runs the **real** scoring engine
  (`lib/matching.ts`) server-side:
  ```bash
  curl "$SITE/api/match?limit=5"                    # demo mandate
  curl -X POST "$SITE/api/match" -d '{"mandate":{...}}'  # custom mandate
  ```
- To go fully live, change `rank()` to read opportunities from Prisma instead
  of the in-memory list. The scoring code is unchanged.

## 5. Email (Resend)

- Seams: `components/contact/contact-form.tsx`,
  `components/layout/newsletter-form.tsx`, and the admin email flows
  (`components/admin/email-automation.tsx`).
- Add `app/api/contact/route.ts` / `app/api/newsletter/route.ts` that call
  Resend with `RESEND_API_KEY`.

## 6. File uploads / data rooms

- Seam: `components/dashboard/*` data-room UI.
- Wire UploadThing or S3 with `UPLOADTHING_TOKEN`; keep the audit-trail UI.

## Testing & CI

- `npm run build` — type-checks, lints and compiles.
- `npm run test:e2e` — Playwright smoke tests (`e2e/smoke.spec.ts`).
- CI runs both on every push — [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).
