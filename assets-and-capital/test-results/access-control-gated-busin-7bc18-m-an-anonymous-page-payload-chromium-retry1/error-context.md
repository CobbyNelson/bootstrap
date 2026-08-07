# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: access-control.spec.ts >> gated business data is absent from an anonymous page payload
- Location: e2e/access-control.spec.ts:11:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Sahara Solar Grid/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Sahara Solar Grid/i })

```

```yaml
- main:
  - img "Assets & Capital"
  - paragraph: Launching soon
  - heading "Where quality assets meet ready capital." [level=1]:
    - text: Where quality assets meet
    - emphasis: ready capital
    - text: .
  - paragraph: We are putting the final pieces in place — vetted businesses, matched to investor mandates, carried to close by an on-the-ground team.
  - text: Preview access code
  - textbox "Preview access code"
  - button "Enter" [disabled]
  - paragraph:
    - text: © 2026 Assets & Capital Ltd ·
    - link "Privacy":
      - /url: /legal/privacy
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * Access-control regression tests. These lock in the security properties that
  5  |  * were fixed: gated data must never reach an unentitled viewer, and the
  6  |  * payment/document endpoints must refuse unauthenticated callers.
  7  |  */
  8  | 
  9  | const LISTING = "/marketplace/sahara-solar-grid";
  10 | 
  11 | test("gated business data is absent from an anonymous page payload", async ({ page }) => {
  12 |   const res = await page.goto(LISTING);
  13 |   expect(res?.status()).toBe(200);
  14 |   const html = await page.content();
  15 | 
  16 |   for (const secret of ["22% IRR", "EBITDA margin", "Information memorandum", "Why this match"]) {
  17 |     expect(html).not.toContain(secret);
  18 |   }
  19 |   // Core content is still public.
> 20 |   await expect(page.getByRole("heading", { name: /Sahara Solar Grid/i })).toBeVisible();
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  21 | });
  22 | 
  23 | test("anonymous visitors see the subscription lock, not the financials", async ({ page }) => {
  24 |   await page.goto(LISTING);
  25 |   await expect(page.getByText(/investor subscription feature/i)).toBeVisible();
  26 |   await expect(page.getByText(/match rate is locked/i)).toBeVisible();
  27 | });
  28 | 
  29 | test("checkout endpoints reject unauthenticated callers", async ({ request }) => {
  30 |   const create = await request.post("/api/checkout", {
  31 |     data: { provider: "stripe", plan: "Investor Pro" },
  32 |   });
  33 |   expect(create.status()).toBe(401);
  34 | 
  35 |   const confirm = await request.post("/api/checkout/confirm", {
  36 |     data: { reference: "AC-forged", cardNumber: "4242424242424242" },
  37 |   });
  38 |   expect(confirm.status()).toBe(401);
  39 | });
  40 | 
  41 | test("unsigned webhooks never settle a payment", async ({ request }) => {
  42 |   const res = await request.post("/api/webhooks/stripe", {
  43 |     data: { data: { object: { client_reference_id: "AC-forged" } } },
  44 |   });
  45 |   expect(res.status()).toBe(501);
  46 | });
  47 | 
  48 | test("document downloads require a session", async ({ request }) => {
  49 |   const res = await request.get("/api/documents/any-id");
  50 |   expect(res.status()).toBe(401);
  51 | });
  52 | 
  53 | test("protected areas redirect to login", async ({ page }) => {
  54 |   await page.goto("/dashboard");
  55 |   await expect(page).toHaveURL(/\/login/);
  56 |   await page.goto("/admin");
  57 |   await expect(page).toHaveURL(/\/login/);
  58 | });
  59 | 
  60 | test("security headers are present", async ({ request }) => {
  61 |   const res = await request.get("/");
  62 |   const h = res.headers();
  63 |   expect(h["x-content-type-options"]).toBe("nosniff");
  64 |   expect(h["x-frame-options"]).toBe("DENY");
  65 |   expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  66 | });
  67 | 
```