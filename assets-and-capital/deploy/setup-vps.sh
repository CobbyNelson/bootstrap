#!/usr/bin/env bash
# ============================================================
# One-time VPS bootstrap for Assets & Capital.
#
#   Ubuntu 24.04 (Hostinger KVM), run as root:
#
#     DOMAIN=app.example.com bash setup-vps.sh
#
# Idempotent where it matters — safe to re-run after a partial
# failure. Everything the running site needs afterwards lives
# under /srv/ac; deploys never touch the rest of the box.
#
# What it sets up:
#   • 2G swap, unattended security upgrades, ufw (SSH/80/443), fail2ban
#   • Node 22 (NodeSource), Docker (Postgres only), Caddy (auto-TLS), rclone
#   • deploy user, /srv/ac layout, generated secrets in shared/.env
#   • Postgres 16 in Docker bound to 127.0.0.1:5433
#   • systemd: ac-app.service + daily ac-backup.timer
#   • clone of the repo and the FIRST release (build happens here)
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN, e.g. DOMAIN=app.example.com bash setup-vps.sh}"
REPO_URL="${REPO_URL:-https://github.com/CobbyNelson/bootstrap.git}"
BRANCH="${BRANCH:-claude/web-finance-software-planning-txpczi}"
APP_SUBDIR="assets-and-capital"

AC=/srv/ac
APP_DIR="$AC/repo/$APP_SUBDIR"

step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }

step "Base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ca-certificates gnupg ufw fail2ban rclone unattended-upgrades

step "Swap (2G — build headroom; skipped if present)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

step "Firewall + fail2ban"
ufw allow OpenSSH >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable
systemctl enable --now fail2ban

step "Node 22"
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

step "Docker (for Postgres only)"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

step "Caddy"
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

step "deploy user + directory layout"
id deploy &>/dev/null || adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
mkdir -p "$AC"/{releases,shared,storage/media,backups,repo}
# Root's authorized key (added via the Hostinger panel) also lets the deploy
# user in — GitHub Actions and deploy-from-here.sh connect as deploy, not root.
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
if [[ -f /root/.ssh/authorized_keys ]]; then
  install -m 600 -o deploy -g deploy /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
fi

step "Scoped sudo for deploys (restart the app unit, nothing else)"
cat > /etc/sudoers.d/ac-deploy <<'EOF'
deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart ac-app, /usr/bin/systemctl status ac-app
EOF
chmod 440 /etc/sudoers.d/ac-deploy

step "Clone repo"
if [[ ! -d "$AC/repo/.git" ]]; then
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$AC/repo"
else
  git -C "$AC/repo" fetch origin "$BRANCH" && git -C "$AC/repo" checkout "$BRANCH"
fi

step "Secrets (generated once, never overwritten)"
ENV_FILE="$AC/shared/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  DB_PASS="$(openssl rand -hex 24)"
  AUTH="$(openssl rand -base64 48 | tr -d '\n')"
  cat > "$ENV_FILE" <<EOF
# Production environment — generated $(date -u +%F) by setup-vps.sh.
# Rotating AUTH_SECRET signs everyone out; rotating the DB password also
# requires updating the postgres container's env and restarting it.
NODE_ENV=production
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_PRISMA_URL=postgresql://ac:$DB_PASS@127.0.0.1:5433/assets_and_capital
POSTGRES_URL_NON_POOLING=postgresql://ac:$DB_PASS@127.0.0.1:5433/assets_and_capital
AUTH_SECRET=$AUTH
MEDIA_DIR=$AC/storage/media
NEXT_PUBLIC_PAYMENTS_TEST_MODE=true
EOF
  chmod 640 "$ENV_FILE"
fi
chown -R deploy:deploy "$AC"

step "Postgres 16 (Docker, localhost only)"
install -o deploy -g deploy "$APP_DIR/deploy/docker-compose.prod.yml" "$AC/docker-compose.yml"
( cd "$AC" && docker compose --env-file "$ENV_FILE" up -d )

step "Caddy vhost"
sed "s/__DOMAIN__/$DOMAIN/g" "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

step "systemd units"
install "$APP_DIR/deploy/ac-app.service"    /etc/systemd/system/ac-app.service
install "$APP_DIR/deploy/ac-backup.service" /etc/systemd/system/ac-backup.service
install "$APP_DIR/deploy/ac-backup.timer"   /etc/systemd/system/ac-backup.timer
systemctl daemon-reload
systemctl enable ac-app.service ac-backup.timer
systemctl start ac-backup.timer

step "First build + release (a few minutes)"
sudo -u deploy bash "$APP_DIR/deploy/update.sh"

step "Done"
cat <<EOF

  Site:      https://$DOMAIN   (once DNS points here — Caddy fetches TLS itself)
  App:       systemctl status ac-app
  Backups:   systemctl list-timers ac-backup.timer
             ⚠ still needs an rclone remote named "backup" — see DEPLOY-VPS.md
  Update:    sudo -u deploy /srv/ac/repo/$APP_SUBDIR/deploy/update.sh
EOF
