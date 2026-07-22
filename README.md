# Novaturient Advisory — website (Phase 1)

A modern, minimal one-page site for **Novaturient Advisory**, built as a fully
self-contained static site — no build step, no external requests (fonts are
self-hosted, all artwork is inline SVG).

> **no·va·tu·ri·ent** *(adj.)* — desiring or seeking powerful change in one's
> life, business, or situation.

## Brand system

| Token | Value | Use |
|---|---|---|
| Navy `#0C2C55` / `#123C74` | primary | hero, panels, footer, logo tile |
| Signal red `#E2231A` | accent | logo diagonal, CTAs, ticks, arrows |
| Ivory `#F6F4EF` / sand `#EAE2D3` | ground | section backgrounds, tiles |

Type: **Space Grotesk** (display) · **Inter** (text) · **Instrument Serif** (italic accents).

## Structure

```
index.html          the whole site (semantic, one page)
site/css/main.css   design system + responsive + reduced-motion rules
site/js/main.js     scroll reveals, counters, quotes, menu, form
site/fonts/         self-hosted woff2 (latin subsets)
site/img/           favicon
```

## Run locally

Any static server works:

```
python3 -m http.server 8000
# open http://localhost:8000
```

## Before going live

- **Stats band** (`index.html`, "STATS" section): replace the placeholder
  figures with real numbers.
- **Contact form**: currently opens a pre-filled email draft to
  `hello@novaturientadvisory.com`. Point it at a real endpoint (Formspree,
  Basin, or your backend) in `site/js/main.js`, and update the email address.
- **Testimonials**: swap the placeholder quotes for real client quotes.
- **LinkedIn links**: replace `href="#"` with the company profile URL.

Legacy Bootstrap 2.x documentation files from the original fork remain in the
repository but are no longer linked from the homepage.
