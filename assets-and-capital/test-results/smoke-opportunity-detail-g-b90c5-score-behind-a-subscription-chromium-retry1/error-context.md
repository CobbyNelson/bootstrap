# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> opportunity detail gates the match score behind a subscription
- Location: e2e/smoke.spec.ts:15:5

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('heading', { level: 1 })
Expected pattern: /sahara solar grid/i
Received string:  "Where quality assetsmeet ready capital."
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for getByRole('heading', { level: 1 })
    14 × locator resolved to <h1 class="mt-4 text-balance text-4xl font-bold leading-tight text-white sm:text-5xl">…</h1>
       - unexpected value "Where quality assetsmeet ready capital."

```

```yaml
- heading "Where quality assets meet ready capital." [level=1]:
  - text: Where quality assets meet
  - emphasis: ready capital
  - text: .
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("home page renders hero and primary CTAs", async ({ page }) => {
  4  |   await page.goto("/");
  5  |   await expect(page.getByRole("heading", { level: 1 })).toContainText(/ready capital/i);
  6  |   await expect(page.getByRole("link", { name: /i'?m an investor/i })).toBeVisible();
  7  | });
  8  | 
  9  | test("marketplace lists opportunities", async ({ page }) => {
  10 |   await page.goto("/marketplace");
  11 |   await expect(page.getByRole("heading", { name: /businesses/i })).toBeVisible();
  12 |   await expect(page.getByText(/opportunities/i).first()).toBeVisible();
  13 | });
  14 | 
  15 | test("opportunity detail gates the match score behind a subscription", async ({ page }) => {
  16 |   await page.goto("/marketplace/sahara-solar-grid");
> 17 |   await expect(page.getByRole("heading", { level: 1 })).toContainText(/sahara solar grid/i);
     |                                                         ^ Error: expect(locator).toContainText(expected) failed
  18 |   await expect(page.getByRole("heading", { name: /snapshot/i })).toBeVisible();
  19 |   // The match rate is a paid feature — deal tier, subscription plus expressed
  20 |   // interest — so an anonymous visitor must see the lock, not the score. The
  21 |   // old assertion expected "% match" here, which encoded the pre-entitlement
  22 |   // behaviour; if this test ever finds a score on this page again, that is a
  23 |   // paid feature leaking, not a pass.
  24 |   await expect(page.getByText(/unlock the ai profile/i)).toBeVisible();
  25 |   await expect(page.getByText(/% match/i)).toHaveCount(0);
  26 | });
  27 | 
  28 | test("unknown route shows the branded 404", async ({ page }) => {
  29 |   const res = await page.goto("/definitely-not-a-real-page");
  30 |   expect(res?.status()).toBe(404);
  31 |   await expect(page.getByText("404")).toBeVisible();
  32 | });
  33 | 
  34 | test("match API returns ranked results", async ({ request }) => {
  35 |   const res = await request.get("/api/match?limit=5");
  36 |   expect(res.ok()).toBeTruthy();
  37 |   const body = await res.json();
  38 |   expect(Array.isArray(body.results)).toBe(true);
  39 |   expect(body.results.length).toBeGreaterThan(0);
  40 |   expect(body.results[0]).toHaveProperty("score");
  41 | });
  42 | 
```