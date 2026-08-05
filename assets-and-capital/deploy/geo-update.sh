#!/usr/bin/env bash
# Install / refresh the IP-to-country database used by analytics.
#
# DB-IP Lite, CC-BY-4.0, no licence key. Republished monthly, which is why it
# lives beside .env in the shared directory instead of in git — a 4MB binary
# that changes every month is exactly what a repo should not accumulate.
#
# City-level is optional and much larger (~60MB gzipped). Uncomment WANT_CITY
# to pull it; the resolver picks it up on the next restart and starts filling
# in city and region.
set -euo pipefail

GEO_DIR="${GEO_DB_DIR:-/srv/ac/shared/geo}"
WANT_CITY="${WANT_CITY:-0}"
MONTH="$(date -u +%Y-%m)"
PREV="$(date -u -d 'last month' +%Y-%m 2>/dev/null || date -u -v-1m +%Y-%m)"

mkdir -p "$GEO_DIR"

fetch() {
  local kind="$1" out="$2"
  for m in "$MONTH" "$PREV"; do
    local url="https://download.db-ip.com/free/dbip-${kind}-lite-${m}.mmdb.gz"
    if curl -fsSL --max-time 300 "$url" -o "${out}.gz" 2>/dev/null; then
      gunzip -f "${out}.gz"
      echo "-- ${kind}: $m ($(du -h "$out" | cut -f1))"
      return 0
    fi
  done
  echo "-- ${kind}: no build available for $MONTH or $PREV" >&2
  return 1
}

# Download beside the live file and swap, so a failed or partial download never
# replaces a working database.
fetch country "$GEO_DIR/.dbip-country.new" && mv -f "$GEO_DIR/.dbip-country.new" "$GEO_DIR/dbip-country.mmdb"
[ "$WANT_CITY" = "1" ] && fetch city "$GEO_DIR/.dbip-city.new" && mv -f "$GEO_DIR/.dbip-city.new" "$GEO_DIR/dbip-city.mmdb"

chown -R deploy:deploy "$GEO_DIR" 2>/dev/null || true
echo "-- geo databases in $GEO_DIR:"; ls -la "$GEO_DIR" | tail -n +2 | sed 's/^/   /'
