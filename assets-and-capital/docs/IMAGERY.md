# Imagery

## What these images are

Art-directed **mood and design imagery**: architectural abstracts, editorial
still lifes, and sector mood shots in the brand palette (deep navy, vivid
crimson accent, cool neutrals). They illustrate sections of the site.

They are **not documentary**. None of them depicts a real business, person,
event or place belonging to Assets & Capital.

## Rules

1. **Never use these for a marketplace listing.** Listing cards represent real
   businesses. A synthetic "solar farm" photo on a real company's card would
   misrepresent that company. Listings keep their gradient/initial treatment
   until the business supplies its own asset.
2. **No identifiable faces.** People appear only as generic figures — from
   behind, in silhouette, or cropped below the face — and only where a human
   presence is generic (a forum audience, a handshake, a figure at a window).
   No image implies a specific individual endorses or is associated with A&C.
3. **No fabricated evidence.** These illustrate; they never stand in as proof
   of traction, clients or track record.
4. **Self-host.** Fetch once into `public/img` and commit. Do not hotlink the
   generator's CDN.

## The set

| File | Used for | Contains people |
|---|---|---|
| `hero-tower.png` | Home hero ambience | No |
| `cta-texture.png` | Dark CTA band background | No |
| `desk-report.png` | Insights / editorial covers | No |
| `forum.png` | Events, roadshows | Audience from behind, no faces |
| `solar-farm.png` | Energy & infrastructure sectors | No |
| `factory.png` | Industrials & manufacturing sectors | No |
| `skyline-figure.png` | Investor-facing pages | One figure, from behind |
| `handshake.png` | Partnerships, deal close | Hands/torsos only, no faces |

## Fetching them

```bash
bash scripts/fetch-imagery.sh
```

Generated with Higgsfield (`marketing_studio_image`, 16:9, 1k). Prompts are
recorded in the script's source history and in `lib/imagery.ts`.

## Adding more

Keep to the palette (navy base, one crimson accent, muted cool grade) and the
rules above. Register the file in `lib/imagery.ts` with meaningful `alt` text —
decorative backgrounds take `alt: ""` so screen readers skip them.
