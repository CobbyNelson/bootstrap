# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> unknown route shows the branded 404
- Location: e2e/smoke.spec.ts:28:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 404
Received: 200
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e5]:
      - img "Assets & Capital" [ref=e6]
      - paragraph [ref=e7]: Launching soon
      - heading [level=1] [ref=e8]:
        - text: Where quality assetsmeet
        - emphasis [ref=e9]: ready capital
        - text: .
      - paragraph [ref=e10]: We are putting the final pieces in place — vetted businesses, matched to investor mandates, carried to close by an on-the-ground team.
      - generic [ref=e11]:
        - generic [ref=e12]: Preview access code
        - generic [ref=e13]:
          - textbox "Preview access code" [ref=e14]
          - button "Enter" [disabled] [ref=e15]
      - paragraph [ref=e16]:
        - text: © 2026 Assets & Capital Ltd ·
        - link "Privacy" [ref=e17] [cursor=pointer]:
          - /url: /legal/privacy
  - alert [ref=e18]
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
  17 |   await expect(page.getByRole("heading", { level: 1 })).toContainText(/sahara solar grid/i);
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
> 30 |   expect(res?.status()).toBe(404);
     |                         ^ Error: expect(received).toBe(expected) // Object.is equality
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