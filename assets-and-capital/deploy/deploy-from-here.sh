#!/usr/bin/env bash
# Deploy from this machine: push the branch, then run the SAME update script
# the GitHub workflow runs. Use when you want to ship without waiting on CI,
# or if Actions is ever down.
#
#   VPS_HOST=1.2.3.4 bash deploy/deploy-from-here.sh
#
# Expects your SSH key to be accepted for deploy@VPS_HOST (setup-vps.sh copies
# root's authorized key to the deploy user).
set -euo pipefail

VPS_HOST="${VPS_HOST:?Set VPS_HOST=<server ip>}"
BRANCH="claude/web-finance-software-planning-txpczi"

cd "$(dirname "$0")/../.."   # repo root

if [[ -n "$(git status --porcelain)" ]]; then
  echo "✗ Uncommitted changes — the VPS deploys from GitHub, so commit and" >&2
  echo "  push first (or stash). Nothing was deployed." >&2
  exit 1
fi

echo "-- pushing $BRANCH"
git push origin "$BRANCH"

echo "-- deploying on $VPS_HOST"
ssh -o StrictHostKeyChecking=accept-new "deploy@$VPS_HOST" \
  'bash /srv/ac/repo/assets-and-capital/deploy/update.sh'
