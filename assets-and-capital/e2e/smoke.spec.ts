import { test, expect } from "@playwright/test";

test("home page renders hero and primary CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/ready capital/i);
  await expect(page.getByRole("link", { name: /i'?m an investor/i })).toBeVisible();
});

test("marketplace lists opportunities", async ({ page }) => {
  await page.goto("/marketplace");
  await expect(page.getByRole("heading", { name: /businesses/i })).toBeVisible();
  await expect(page.getByText(/opportunities/i).first()).toBeVisible();
});

test("opportunity detail loads with a match score", async ({ page }) => {
  await page.goto("/marketplace/sahara-solar-grid");
  await expect(page.getByText(/% match/i).first()).toBeVisible();
  await expect(page.getByText(/AI fit breakdown/i)).toBeVisible();
});

test("unknown route shows the branded 404", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-real-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();
});

test("match API returns ranked results", async ({ request }) => {
  const res = await request.get("/api/match?limit=5");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.results)).toBe(true);
  expect(body.results.length).toBeGreaterThan(0);
  expect(body.results[0]).toHaveProperty("score");
});
