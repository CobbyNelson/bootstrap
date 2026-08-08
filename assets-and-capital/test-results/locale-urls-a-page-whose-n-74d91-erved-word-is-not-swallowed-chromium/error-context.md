# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: locale-urls.spec.ts >> a page whose name starts with a reserved word is not swallowed
- Location: e2e/locale-urls.spec.ts:67:5

# Error details

```
Error: /energy

expect(received).toBe(expected) // Object.is equality

Expected: 404
Received: 307
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * English is the bare domain; the other languages are subfolders.
  5   |  *
  6   |  * This shape has been got wrong twice in opposite directions — first English
  7   |  * was unprefixed but the rewrite that made it work could not survive the
  8   |  * production proxy, then every locale was prefixed and the bare domain
  9   |  * redirected. These assertions pin the shape so the next person changing
  10  |  * locale routing finds out here rather than in production.
  11  |  */
  12  | 
  13  | test("the bare domain serves English without redirecting", async ({ page }) => {
  14  |   const res = await page.goto("/");
  15  |   expect(res?.status()).toBe(200);
  16  |   // Not just the status: a redirect chain ending in 200 would also pass that.
  17  |   expect(new URL(page.url()).pathname).toBe("/");
  18  | });
  19  | 
  20  | test("English pages are unprefixed", async ({ request }) => {
  21  |   for (const path of ["/pricing", "/about", "/faq", "/services/roadshows"]) {
  22  |     const res = await request.get(path, { maxRedirects: 0 });
  23  |     expect(res.status(), `${path} should be served, not redirected`).toBe(200);
  24  |   }
  25  | });
  26  | 
  27  | test("the /en prefix redirects home permanently", async ({ request }) => {
  28  |   for (const [from, to] of [["/en", "/"], ["/en/pricing", "/pricing"]]) {
  29  |     const res = await request.get(from, { maxRedirects: 0 });
  30  |     expect(res.status(), `${from} should 308`).toBe(308);
  31  |     expect(new URL(res.headers()["location"], "http://x").pathname).toBe(to);
  32  |   }
  33  | });
  34  | 
  35  | test("the other languages keep their subfolder and their language", async ({ page }) => {
  36  |   for (const [path, lang] of [["/fr", "fr"], ["/es", "es"], ["/ar", "ar"]]) {
  37  |     const res = await page.goto(path);
  38  |     expect(res?.status()).toBe(200);
  39  |     expect(new URL(page.url()).pathname).toBe(path);
  40  |     // The real lang/dir live on a wrapper, not <html> — see [locale]/layout.tsx.
  41  |     await expect(page.locator(`div[lang="${lang}"]`).first()).toBeAttached();
  42  |   }
  43  |   await expect(page.locator('div[dir="rtl"]').first()).toBeAttached();
  44  | });
  45  | 
  46  | test("the canonical URL is the address the visitor used", async ({ request }) => {
  47  |   // A Link header, not a tag: reading the path in generateMetadata would opt
  48  |   // every page out of prerendering. Prerendered and dynamic pages are both
  49  |   // checked because the old relative canonical was correct only for dynamic.
  50  |   for (const [path, want] of [
  51  |     ["/about", "/about"],                       // prerendered
  52  |     ["/marketplace?sector=FinTech", "/marketplace"], // dynamic, and drops the query
  53  |     ["/fr/about", "/fr/about"],
  54  |   ]) {
  55  |     const res = await request.get(path);
  56  |     const link = res.headers()["link"] ?? "";
  57  |     expect(link, `${path} canonical`).toContain(`<https://assetsandcapitalltd.com${want}>; rel="canonical"`);
  58  |   }
  59  | });
  60  | 
  61  | test("routes outside app/[locale] are left alone by the rewrite", async ({ request }) => {
  62  |   for (const path of ["/robots.txt", "/sitemap.xml", "/login"]) {
  63  |     expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(200);
  64  |   }
  65  | });
  66  | 
  67  | test("a page whose name starts with a reserved word is not swallowed", async ({ request }) => {
  68  |   // /energy and /apiary would both be excluded by a careless (?!en|api).
  69  |   // They 404 because no such page exists — the point is that they reach the
  70  |   // router as themselves rather than being skipped by the rewrite.
  71  |   for (const path of ["/energy", "/apiary"]) {
> 72  |     expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
      |                                                                           ^ Error: /energy
  73  |   }
  74  | });
  75  | 
  76  | /**
  77  |  * A sitemap is a claim about what exists.
  78  |  *
  79  |  * It listed eight article URLs read from a hardcoded array while the article
  80  |  * page read the database, so on a database nobody had imported into, every one
  81  |  * of those eight returned 404 — and only a live check would say so, because
  82  |  * both halves are individually fine.
  83  |  */
  84  | test("every URL in the sitemap actually resolves", async ({ request }) => {
  85  |   const xml = await (await request.get("/sitemap.xml")).text();
  86  |   const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  87  |     .map((m) => m[1].replace(/^https:\/\/[^/]+/, "") || "/");
  88  | 
  89  |   expect(paths.length, "sitemap should not be empty").toBeGreaterThan(10);
  90  | 
  91  |   const broken: string[] = [];
  92  |   for (const p of paths) {
  93  |     const res = await request.get(p, { maxRedirects: 0 });
  94  |     if (res.status() !== 200) broken.push(`${p} -> ${res.status()}`);
  95  |   }
  96  |   expect(broken, "sitemap URLs that do not return 200").toEqual([]);
  97  | });
  98  | 
  99  | /**
  100 |  * Every language version of a page must be listed, and every entry must carry
  101 |  * the whole alternates set including a pointer back at itself — Google ignores
  102 |  * an hreflang cluster that is not reciprocal rather than half-applying it.
  103 |  */
  104 | test("the sitemap lists all four languages with reciprocal alternates", async ({ request }) => {
  105 |   const xml = await (await request.get("/sitemap.xml")).text();
  106 | 
  107 |   // <url> blocks, so each entry's alternates stay attached to their own loc.
  108 |   const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  109 |   expect(blocks.length).toBeGreaterThan(40);
  110 | 
  111 |   const locs = blocks.map((b) => (b.match(/<loc>([^<]+)<\/loc>/) ?? [])[1] ?? "");
  112 |   for (const path of ["/about", "/pricing", "/marketplace"]) {
  113 |     for (const prefix of ["", "/fr", "/es", "/ar"]) {
  114 |       expect(locs, `${prefix}${path} should be in the sitemap`)
  115 |         .toContain(`https://assetsandcapitalltd.com${prefix}${path}`);
  116 |     }
  117 |   }
  118 | 
  119 |   const about = blocks.find((b) => b.includes("<loc>https://assetsandcapitalltd.com/about</loc>"))!;
  120 |   for (const [lang, href] of [
  121 |     ["en", "https://assetsandcapitalltd.com/about"],   // self-reference
  122 |     ["fr", "https://assetsandcapitalltd.com/fr/about"],
  123 |     ["es", "https://assetsandcapitalltd.com/es/about"],
  124 |     ["ar", "https://assetsandcapitalltd.com/ar/about"],
  125 |     ["x-default", "https://assetsandcapitalltd.com/about"],
  126 |   ]) {
  127 |     expect(about, `/about alternate ${lang}`).toContain(`hreflang="${lang}" href="${href}"`);
  128 |   }
  129 | 
  130 |   // The home page must not gain a trailing slash here when the canonical header
  131 |   // and the hreflang tags both emit it without one.
  132 |   expect(locs).toContain("https://assetsandcapitalltd.com");
  133 |   expect(locs).not.toContain("https://assetsandcapitalltd.com/");
  134 | 
  135 |   // Articles are English-only: the /fr URL renders the English article, because
  136 |   // article bodies have never been through translation the way page copy has.
  137 |   // Claiming otherwise is the one thing hreflang exists to prevent.
  138 |   const articleLocs = locs.filter((l) => l.includes("/insights/"));
  139 |   const translatedArticleClaims = articleLocs.filter((l) => /\/(fr|es|ar)\/insights\//.test(l));
  140 |   expect(translatedArticleClaims, "articles must not claim translated versions").toEqual([]);
  141 |   for (const block of blocks) {
  142 |     if (/<loc>[^<]*\/insights\/[^<]+<\/loc>/.test(block)) {
  143 |       expect(block, "an article entry must carry no hreflang alternates").not.toContain("hreflang");
  144 |     }
  145 |   }
  146 | });
  147 | 
```