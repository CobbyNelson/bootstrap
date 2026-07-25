import { test, expect } from "@playwright/test";

/**
 * Access-control regression tests. These lock in the security properties that
 * were fixed: gated data must never reach an unentitled viewer, and the
 * payment/document endpoints must refuse unauthenticated callers.
 */

const LISTING = "/marketplace/sahara-solar-grid";

test("gated business data is absent from an anonymous page payload", async ({ page }) => {
  const res = await page.goto(LISTING);
  expect(res?.status()).toBe(200);
  const html = await page.content();

  for (const secret of ["22% IRR", "EBITDA margin", "Information memorandum", "Why this match"]) {
    expect(html).not.toContain(secret);
  }
  // Core content is still public.
  await expect(page.getByRole("heading", { name: /Sahara Solar Grid/i })).toBeVisible();
});

test("anonymous visitors see the subscription lock, not the financials", async ({ page }) => {
  await page.goto(LISTING);
  await expect(page.getByText(/investor subscription feature/i)).toBeVisible();
  await expect(page.getByText(/match rate is locked/i)).toBeVisible();
});

test("checkout endpoints reject unauthenticated callers", async ({ request }) => {
  const create = await request.post("/api/checkout", {
    data: { provider: "stripe", plan: "Investor Pro" },
  });
  expect(create.status()).toBe(401);

  const confirm = await request.post("/api/checkout/confirm", {
    data: { reference: "AC-forged", cardNumber: "4242424242424242" },
  });
  expect(confirm.status()).toBe(401);
});

test("unsigned webhooks never settle a payment", async ({ request }) => {
  const res = await request.post("/api/webhooks/stripe", {
    data: { data: { object: { client_reference_id: "AC-forged" } } },
  });
  expect(res.status()).toBe(501);
});

test("document downloads require a session", async ({ request }) => {
  const res = await request.get("/api/documents/any-id");
  expect(res.status()).toBe(401);
});

test("protected areas redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("security headers are present", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
