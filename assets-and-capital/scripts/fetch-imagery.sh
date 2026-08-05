#!/usr/bin/env bash
# Downloads the generated mood/design imagery into public/img.
#
# Run this once from the app directory (assets-and-capital):
#   bash scripts/fetch-imagery.sh
# then commit the files in public/img.
#
# Why a script: these were generated with Higgsfield and live on its CDN, which
# the build sandbox cannot reach. Fetch them once and self-host — do not
# hotlink the CDN from the app.

set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/img

BASE="https://d8j0ntlcm91z4.cloudfront.net/user_3H0zvt34phzSlwPWcbBDchd2EoA"

fetch() { # <filename> <remote>
  echo "→ $1"
  curl -fsSL "$BASE/$2" -o "public/img/$1"
}

fetch hero-tower.png     hf_20260726_224328_323df0f3-0846-4ea0-83ae-e050d6c1f9de.png
fetch cta-texture.png    hf_20260726_224330_aa7fba79-d4d0-41c0-be0e-0a314790093a.png
fetch desk-report.png    hf_20260726_224337_8f2d705e-b974-4ef1-b6b2-1f70303fbeb8.png
fetch forum.png          hf_20260726_224338_6d596313-b989-409d-bd5c-610676a2c497.png
fetch solar-farm.png     hf_20260726_224506_38eb672b-1763-49d7-99c2-1d7ed01787d2.png
fetch factory.png        hf_20260726_224507_b4a418ad-7c2c-4536-83e3-15afad532567.png
fetch skyline-figure.png hf_20260726_224513_33c94367-7692-4ff7-8648-85a1fc954d4d.png
fetch handshake.png      hf_20260726_224515_673cecf5-f876-4c71-9a67-2e898b84a66f.png

# Editorial covers, keyed to article type in lib/imagery.ts (ARTICLE_COVERS).
fetch cover-market-intelligence.png hf_20260804_180835_5f64c706-779c-465a-826b-f69e2b74bd7f.png
fetch cover-country-report.png      hf_20260804_180835_89c8377d-269a-4d94-abf5-09a6db495f5a.png
fetch cover-investment-guide.png    hf_20260804_180835_5eb2d3e8-d99f-487e-9ed1-30752266ec60.png
fetch cover-interview.png           hf_20260804_180835_b3f296f9-41b2-49ce-8cc0-96eddfbab27b.png

# Sector imagery for listing cards, mapped by SECTOR_IMAGERY in lib/imagery.ts.
fetch sector-fintech.png           hf_20260804_182138_fad7e46f-8dbe-4389-963f-46a7969472a8.png
fetch sector-digital-health.png    hf_20260804_182138_4d7ed1f0-f6bb-4ed0-95c9-7c3e4ac51fc1.png
fetch sector-healthcare.png        hf_20260804_182138_b53d2174-6367-45ac-bec8-7e73cbe1daee.png
fetch sector-logistics.png         hf_20260804_182138_06a7ebf1-f3d4-4b1f-b868-2dcf98c93403.png
fetch sector-real-estate.png       hf_20260804_182138_04723268-e714-4e5c-bf45-e6d3949b43cb.png
fetch sector-natural-resources.png hf_20260804_182138_974119a4-279a-4c08-92e9-1adf148ac0c1.png
fetch sector-infrastructure.png    hf_20260804_182138_2dfcad61-acb6-4881-bba1-b5c8bf894a39.png
fetch sector-hospitality.png       hf_20260804_182138_8a180270-9697-4047-8aab-344a924a442f.png
fetch sector-food-beverage.png     hf_20260804_182138_4525d496-8f2e-4cac-82f4-10ad4d19dc69.png
fetch sector-education.png         hf_20260804_182138_a3764b69-cd13-4d62-b731-c92a1356b74b.png
fetch sector-agriculture.png       hf_20260804_182138_d9b027c5-713c-4b17-b03d-166355f9261b.png
fetch sector-wind.png              hf_20260804_182609_06b76267-2603-4523-a671-59dae5f6ea24.png

echo
echo "Done — $(ls public/img | wc -l) files in public/img."
echo "Optional: convert to webp to cut page weight, e.g."
echo "  for f in public/img/*.png; do cwebp -q 82 \"\$f\" -o \"\${f%.png}.webp\"; done"
