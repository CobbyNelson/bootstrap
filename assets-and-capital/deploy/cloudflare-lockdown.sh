#!/usr/bin/env bash
# Close the origin to everything except Cloudflare.
#
#   bash deploy/cloudflare-lockdown.sh
#
# RUN THIS ONLY AFTER the site is proxied (orange cloud) and confirmed working
# through Cloudflare. Running it first locks you out of your own website.
#
# Why it is not optional: a CDN in front of a server that still answers the
# whole internet directly is a suggestion, not a control. Anyone who learns
# 72.61.201.177 — and it is in DNS history, certificate logs and old scans —
# connects straight past the WAF, the rate limiting and the bot rules. Every
# protection Cloudflare offers is bypassed by one line of curl.
#
# It also gates TRUST_CLOUDFLARE. lib/client-ip.ts only believes the
# CF-Connecting-IP header once the origin cannot be reached directly, because
# until then anybody can set that header themselves.
#
# SSH is deliberately left open on 22. Locking that to Cloudflare would be
# nonsense — Cloudflare does not proxy SSH on the free plan — and it is how you
# get back in when something here goes wrong.
set -euo pipefail

fail() { echo "lockdown: $*" >&2; exit 1; }

command -v ufw >/dev/null || fail "ufw is not installed (apt-get install -y ufw)"

echo "-- fetching Cloudflare's current ranges"
# From Cloudflare, every time, rather than a copy pasted into this file. The
# list changes, and a stale copy silently blackholes real visitors.
V4=$(curl -fsS --max-time 20 https://www.cloudflare.com/ips-v4) || fail "could not fetch ips-v4"
V6=$(curl -fsS --max-time 20 https://www.cloudflare.com/ips-v6) || fail "could not fetch ips-v6"
[[ $(echo "$V4" | wc -l) -ge 5 ]] || fail "ips-v4 looks truncated — refusing to apply"

echo "-- allowing SSH before anything else"
ufw allow 22/tcp >/dev/null

echo "-- allowing Cloudflare on 80 and 443"
while read -r cidr; do
  [[ -z "$cidr" ]] && continue
  ufw allow from "$cidr" to any port 80  proto tcp >/dev/null
  ufw allow from "$cidr" to any port 443 proto tcp >/dev/null
done <<< "$V4
$V6"

echo "-- denying 80 and 443 to everyone else"
ufw --force delete allow 80/tcp  >/dev/null 2>&1 || true
ufw --force delete allow 443/tcp >/dev/null 2>&1 || true
ufw deny 80/tcp  >/dev/null
ufw deny 443/tcp >/dev/null

ufw --force enable >/dev/null
echo "-- rules now:"
ufw status numbered | head -20

cat <<'NOTE'

Two things left, and they are not optional:

  1. Add TRUST_CLOUDFLARE=true to /srv/ac/shared/.env and restart ac-app.
     Until then the rate limiters key on X-Forwarded-For, whose first entry
     Cloudflare does not control — an attacker can set it and rotate it freely.

  2. Check the site still loads through Cloudflare, from a browser, now.
     If it does not, `ufw disable` over SSH puts everything back.
NOTE
