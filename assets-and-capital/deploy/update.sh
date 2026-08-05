#!/usr/bin/env bash
# ============================================================
# Deploy the latest commit of the branch. Runs ON the VPS as the
# deploy user — GitHub Actions and deploy-from-here.sh both just
# ssh in and run this, so there is exactly one deploy code path
# and binaries (sharp, Prisma engines) are always built on the
# machine that runs them.
#
# Sequence: pull → npm ci → build → migrate → assemble release →
# swap symlink → restart → health-check → roll back on failure.
#
# The swap is atomic (ln -sfn) and old releases are kept, so a
# bad deploy is a one-command rollback:
#   ln -sfn /srv/ac/releases/<previous> /srv/ac/current && systemctl restart ac-app
# ============================================================
set -euo pipefail

AC=/srv/ac
BRANCH="${BRANCH:-claude/web-finance-software-planning-txpczi}"
APP="$AC/repo/assets-and-capital"
KEEP_RELEASES=5

say() { printf '\n\033[1m-- %s\033[0m\n' "$*"; }

say "Pulling $BRANCH"
git -C "$AC/repo" fetch origin "$BRANCH"
git -C "$AC/repo" reset --hard "origin/$BRANCH"
COMMIT="$(git -C "$AC/repo" rev-parse --short HEAD)"

say "Installing dependencies (commit $COMMIT)"
cd "$APP"
# Install BEFORE the production env is loaded. NODE_ENV=production makes npm
# omit devDependencies, and the build toolchain (Tailwind's PostCSS plugin,
# TypeScript) lives there — a production-only tree cannot build the app.
# postinstall runs `prisma generate`; the schema needs no database for that.
npm ci --no-audit --no-fund

# From here on the production environment is required: `prisma migrate deploy`
# needs the connection string, and the build is NOT env-free — Next statically
# collects /insights/[slug], which queries Postgres through Prisma. Locally the
# app dir's own .env masks that, which is how it slipped past the first deploy.
set -a; source "$AC/shared/.env"; set +a

say "Applying database migrations"
# Before the build (the build reads these tables — on a fresh database they
# would not exist yet) and before the swap (a failed migration must leave the
# currently-running release untouched). migrate deploy is additive-only and
# refuses destructive drift — the right failure mode for production.
npx prisma migrate deploy

say "Building"
NODE_OPTIONS=--max-old-space-size=2048 npm run build

say "Assembling release"
TS="$(date +%Y%m%d-%H%M%S)-$COMMIT"
REL="$AC/releases/$TS"
mkdir -p "$REL"
cp -a .next/standalone/. "$REL/"
mkdir -p "$REL/.next"
cp -a .next/static "$REL/.next/static"
cp -a public "$REL/public"

say "Switching over"
PREVIOUS="$(readlink -f "$AC/current" 2>/dev/null || true)"
ln -sfn "$REL" "$AC/current"
sudo -n systemctl restart ac-app 2>/dev/null || systemctl restart ac-app

say "Health check"
ok=""
for i in $(seq 1 20); do
  sleep 1
  if curl -fsS -o /dev/null http://127.0.0.1:3000/; then ok=1; break; fi
done

if [[ -z "$ok" ]]; then
  echo "✗ new release failed its health check" >&2
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    echo "  rolling back to $PREVIOUS" >&2
    ln -sfn "$PREVIOUS" "$AC/current"
    sudo -n systemctl restart ac-app 2>/dev/null || systemctl restart ac-app
  fi
  exit 1
fi

say "Pruning old releases (keep $KEEP_RELEASES)"
ls -1dt "$AC"/releases/* 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | while read -r old; do
  # Never delete the release currently being served, however the list sorts.
  [[ "$old" == "$(readlink -f "$AC/current")" ]] || rm -rf "$old"
done

say "✓ Deployed $COMMIT"
