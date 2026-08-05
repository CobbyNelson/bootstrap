# VPS deployment runbook — Hostinger KVM 2

Everything the site needs lives under `/srv/ac`; deploys are atomic symlink
swaps with automatic rollback; updates arrive by `git push` (GitHub Actions)
or one command from your machine. Backups ship nightly to Google Drive or
Mega via rclone.

> The old `DEPLOY.md` at the app root describes the Vercel path and is
> superseded by this document for the VPS.

## Layout on the server

```
/srv/ac
├── current      → symlink to the live release
├── releases/    timestamped standalone builds (last 5 kept)
├── repo/        clone of the branch (build workspace)
├── shared/.env  secrets — generated once, never in git
├── storage/     uploaded media (MEDIA_DIR) — survives every deploy
├── backups/     last 3 local backup sets
└── pgdata/      Postgres volume (Docker, bound to 127.0.0.1:5433)
```

## One-time setup

1. **DNS first**: point an A record of your chosen domain at the VPS IP.
   Caddy gets its TLS certificate automatically the moment this resolves.
2. In the Hostinger panel, add your SSH **public key** for root, then:

```bash
ssh root@YOUR_VPS_IP
curl -fsSL https://raw.githubusercontent.com/CobbyNelson/bootstrap/claude/web-finance-software-planning-txpczi/assets-and-capital/deploy/setup-vps.sh -o setup-vps.sh
DOMAIN=app.yourdomain.com bash setup-vps.sh
```

~10 minutes: hardens the box (ufw, fail2ban, swap, unattended upgrades),
installs Node 22 / Docker / Caddy / rclone, creates the `deploy` user,
generates secrets, starts Postgres, builds and serves the first release.

3. **Auto-deploy**: in the GitHub repo → Settings → Secrets → Actions, add
   - `VPS_HOST` — the server IP
   - `VPS_SSH_KEY` — the PRIVATE key matching the public key from step 2

   Every push to the branch that touches `assets-and-capital/` now deploys
   itself. (The bootstrap fork carries upstream workflows; disable them under
   Actions if their runs bother you — they're unrelated to deploys.)

4. **Backups remote** (once, on the VPS as the deploy user):

   *Mega — simplest, no browser:*
   ```bash
   sudo -u deploy rclone config create backup mega user you@example.com pass 'YOUR-MEGA-PASSWORD'
   ```

   *Google Drive — one browser hop:* run `rclone authorize "drive"` on your
   own computer, then on the VPS `sudo -u deploy rclone config`, new remote
   named `backup`, type `drive`, answer **n** to auto-config and paste the
   token from your machine.

   Then prove the pipeline end to end:
   ```bash
   systemctl start ac-backup && journalctl -u ac-backup -n 20
   ```

## Deploying

| How | Command |
|---|---|
| Automatic | `git push` the branch — Actions does the rest |
| From your machine | `VPS_HOST=1.2.3.4 bash assets-and-capital/deploy/deploy-from-here.sh` |
| On the server | `sudo -u deploy bash /srv/ac/repo/assets-and-capital/deploy/update.sh` |

All three run the same script: pull → `npm ci` → build → `prisma migrate
deploy` → new release dir → symlink swap → restart → health check. A failed
health check rolls back to the previous release by itself.

**Manual rollback**:
```bash
ls -1t /srv/ac/releases          # pick the one before the bad deploy
ln -sfn /srv/ac/releases/<that> /srv/ac/current && sudo systemctl restart ac-app
```

## Restoring a backup

A backup that has never been restored is a hope, not a backup — rehearse this
once after setup.

```bash
rclone lsf backup:ac-backups                     # choose a date
rclone copy backup:ac-backups/db-DATE.sql.gz /tmp/
rclone copy backup:ac-backups/media-DATE.tar.gz /tmp/

# database (destructive — replaces current data)
gunzip -c /tmp/db-DATE.sql.gz | docker exec -i ac-postgres psql -U ac -d assets_and_capital

# media
tar -xzf /tmp/media-DATE.tar.gz -C /srv/ac/storage
sudo systemctl restart ac-app
```

## Day-2 operations

```bash
systemctl status ac-app                  # is it up
journalctl -u ac-app -f                  # live app logs
journalctl -u ac-backup -n 30            # last backup run
systemctl list-timers ac-backup.timer    # next backup time
docker exec -it ac-postgres psql -U ac assets_and_capital
```

Secrets live in `/srv/ac/shared/.env`. Going live with payments later =
set the real `PAYSTACK_SECRET_KEY` there, flip
`NEXT_PUBLIC_PAYMENTS_TEST_MODE=false`, redeploy.

## Deliberate choices (so future-you doesn't relitigate them)

- **Build on the VPS**, not in CI: one code path for all deploy routes, and
  sharp/Prisma native binaries always match the machine executing them. Cost:
  ~1 min of CPU per deploy on an 8GB box — acceptable.
- **Postgres in Docker, app on the host**: the compose file pins the exact
  image the dev environment uses; the app itself is a single static `node
  server.js` that systemd supervises better than a container would.
- **Migrations run before the swap**: `prisma migrate deploy` is additive and
  refuses drift, so schema and old code coexist during the seconds between
  migrate and restart; a migration failure aborts the deploy with the old
  release still serving.
- **`.env` is generated on the server and never in git** — the repo is public.
