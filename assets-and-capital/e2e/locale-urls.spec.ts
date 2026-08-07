import { test, expect } from "@playwright/test";

/**
 * English is the bare domain; the other languages are subfolders.
 *
 * This shape has been got wrong twice in opposite directions — first English
 * was unprefixed but the rewrite that made it work could not survive the
 * production proxy, then every locale was prefixed and the bare domain
 * redirected. These assertions pin the shape so the next person changing
 * locale routing finds out here rather than in production.
 */

test("the bare domain serves English without redirecting", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  // Not just the status: a redirect chain ending in 200 would also pass that.
  expect(new URL(page.url()).pathname).toBe("/");
});

test("English pages are unprefixed", async ({ request }) => {
  for (const path of ["/pricing", "/about", "/faq", "/services/roadshows"]) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), `${path} should be served, not redirected`).toBe(200);
  }
});

test("the /en prefix redirects home permanently", async ({ request }) => {
  for (const [from, to] of [["/en", "/"], ["/en/pricing", "/pricing"]]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), `${from} should 308`).toBe(308);
    expect(new URL(res.headers()["location"], "http://x").pathname).toBe(to);
  }
});

test("the other languages keep their subfolder and their language", async ({ page }) => {
  for (const [path, lang] of [["/fr", "fr"], ["/es", "es"], ["/ar", "ar"]]) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(path);
    // The real lang/dir live on a wrapper, not <html> — see [locale]/layout.tsx.
    await expect(page.locator(`div[lang="${lang}"]`).first()).toBeAttached();
  }
  await expect(page.locator('div[dir="rtl"]').first()).toBeAttached();
});

test("the canonical URL is the address the visitor used", async ({ request }) => {
  // A Link header, not a tag: reading the path in generateMetadata would opt
  // every page out of prerendering. Prerendered and dynamic pages are both
  // checked because the old relative canonical was correct only for dynamic.
  for (const [path, want] of [
    ["/about", "/about"],                       // prerendered
    ["/marketplace?sector=FinTech", "/marketplace"], // dynamic, and drops the query
    ["/fr/about", "/fr/about"],
  ]) {
    const res = await request.get(path);
    const link = res.headers()["link"] ?? "";
    expect(link, `${path} canonical`).toContain(`<https://assetsandcapitalltd.com${want}>; rel="canonical"`);
  }
});

test("routes outside app/[locale] are left alone by the rewrite", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/login"]) {
    expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(200);
  }
});

test("a page whose name starts with a reserved word is not swallowed", async ({ request }) => {
  // /energy and /apiary would both be excluded by a careless (?!en|api).
  // They 404 because no such page exists — the point is that they reach the
  // router as themselves rather than being skipped by the rewrite.
  for (const path of ["/energy", "/apiary"]) {
    expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
  }
});

/**
 * A sitemap is a claim about what exists.
 *
 * It listed eight article URLs read from a hardcoded array while the article
 * page read the database, so on a database nobody had imported into, every one
 * of those eight returned 404 — and only a live check would say so, because
 * both halves are individually fine.
 */
test("every URL in the sitemap actually resolves", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(/^https:\/\/[^/]+/, "") || "/");

  expect(paths.length, "sitemap should not be empty").toBeGreaterThan(10);

  const broken: string[] = [];
  for (const p of paths) {
    const res = await request.get(p, { maxRedirects: 0 });
    if (res.status() !== 200) broken.push(`${p} -> ${res.status()}`);
  }
  expect(broken, "sitemap URLs that do not return 200").toEqual([]);
});
