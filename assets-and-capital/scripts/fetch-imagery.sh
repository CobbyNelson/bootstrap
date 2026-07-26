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

echo
echo "Done — $(ls public/img | wc -l) files in public/img."
echo "Optional: convert to webp to cut page weight, e.g."
echo "  for f in public/img/*.png; do cwebp -q 82 \"\$f\" -o \"\${f%.png}.webp\"; done"
