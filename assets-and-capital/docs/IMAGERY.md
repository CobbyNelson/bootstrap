# Imagery

## What these images are

Art-directed **mood and design imagery**: architectural abstracts, editorial
still lifes, and sector mood shots in the brand palette (deep navy, vivid
crimson accent, cool neutrals). They illustrate sections of the site.

They are **not documentary**. None of them depicts a real business, person,
event or place belonging to Assets & Capital.

## Rules

1. **Listing imagery is keyed by SECTOR, never by company.** *(Revised — this
   rule previously banned imagery on listings outright.)*

   The original concern stands and is the reason for the constraint: a synthetic
   "solar farm" photo presented as a real company's asset misrepresents that
   company. What makes sector imagery acceptable is that it never makes a claim
   about a specific business:

   - `SECTOR_IMAGERY` in `lib/imagery.ts` maps **sector → image**. Nothing is
     generated from, or chosen by, a company name.
   - Alt text names the **sector**, never the business — "Renewable energy
     sector imagery", not "Sahara Solar Grid's plant".
   - `Opportunity.image` always wins, so a business's own asset replaces the
     stand-in the moment it exists. This is the escape hatch the old rule
     described, now an actual field.
   - A sector with no entry falls back to the gradient-and-initials treatment.

   **Still forbidden:** generating an image from a company's name, description
   or claimed assets, and presenting any generated image as documentary proof of
   a real facility, product or track record.

   Where one sector spans visibly different assets, override per listing rather
   than widening the sector image — see `Coastal Wind Partners`, which sets
   `image` because the Renewable Energy default is a solar farm.
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

### Editorial covers

Keyed to an article's `type` by `ARTICLE_COVERS` in `lib/imagery.ts`, so one image
serves a whole category and a new article of an existing type needs no new asset.
A type with no entry falls back to the gradient the card already draws.

| File | Article type | Contains people |
|---|---|---|
| `cover-market-intelligence.png` | Market Intelligence | No |
| `cover-country-report.png` | Country Report | No |
| `cover-investment-guide.png` | Investment Guide · For Businesses | No |
| `cover-interview.png` | Interview | No — two empty chairs |
| `desk-report.png` *(reused)* | White Paper · Deal Structuring | No |
| `handshake.png` *(reused)* | Case Study | Hands/torsos only |
| `solar-farm.png` *(reused)* | ESG | No |

Nothing readable appears in any of them: the charts, maps and pages are all shot at
a depth of field that keeps figures illegible, which is rule 3 above — they
illustrate an article, they never stand in as its evidence.

### Sector imagery

Mapped by `SECTOR_IMAGERY` in `lib/imagery.ts` and resolved through
`listingImage(o)`, which prefers a listing's own `image` before falling back here.

| File | Sector | Contains people |
|---|---|---|
| `solar-farm.png` *(reused)* | Renewable Energy | No |
| `sector-wind.png` | *(per-listing override — Coastal Wind Partners)* | No |
| `sector-fintech.png` | FinTech | No |
| `sector-digital-health.png` | Digital Health | No |
| `sector-healthcare.png` | Healthcare | No |
| `sector-logistics.png` | Transport & Logistics | No |
| `sector-real-estate.png` | Real Estate | No |
| `sector-natural-resources.png` | Natural Resources | No |
| `sector-infrastructure.png` | Infrastructure | No |
| `sector-hospitality.png` | Hospitality | No |
| `sector-food-beverage.png` | Food & Beverage | No |
| `sector-education.png` | Education | No |
| `sector-agriculture.png` | Agriculture | No |

None of them contains a person, a readable sign, a legible label or a company
marking — a deliberate constraint, since anything identifiable would start to
look like a claim about a specific business.

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
