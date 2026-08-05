#!/usr/bin/env bash
# ============================================================
# Nightly backup: database dump + uploaded media, shipped to a
# cloud remote via rclone. Run by ac-backup.timer at 03:15.
#
# The remote must be named "backup" — created once, interactively:
#
#   Mega (simplest — username/password, no browser):
#     rclone config create backup mega user you@example.com pass 'YOUR-PASS'
#
#   Google Drive (needs a one-time browser authorisation):
#     rclone config          # n) new remote → name: backup → drive
#     # on a headless VPS choose "n" for auto-config and paste the
#     # code from `rclone authorize drive` run on your own machine
#
# Retention: 45 days in the cloud, 3 most-recent sets locally.
# Restore procedure lives in DEPLOY-VPS.md — a backup that has
# never been restored is a hope, not a backup.
# ============================================================
set -euo pipefail

AC=/srv/ac
STAMP="$(date +%F)"
DEST="backup:ac-backups"
LOCAL="$AC/backups"

fail() { echo "backup: $*" >&2; exit 1; }

command -v rclone >/dev/null || fail "rclone is not installed"
rclone listremotes | grep -q '^backup:' \
  || fail "no rclone remote named 'backup' — see the header of this script"

mkdir -p "$LOCAL"

echo "-- database dump"
docker exec ac-postgres pg_dump -U ac assets_and_capital \
  | gzip > "$LOCAL/db-$STAMP.sql.gz"
[[ -s "$LOCAL/db-$STAMP.sql.gz" ]] || fail "database dump came out empty"

echo "-- media archive"
tar -czf "$LOCAL/media-$STAMP.tar.gz" -C "$AC/storage" media

echo "-- upload"
# --retries: Mega's API drops connections under load more readily than S3-style
# stores, and a nightly job gets one chance — a transient 500 must not cost the
# day's backup. --transfers=1 keeps a single session, which Mega prefers.
RC_OPTS=(--no-traverse --retries 3 --retries-sleep 20s --transfers 1 --timeout 5m)
rclone copy "$LOCAL/db-$STAMP.sql.gz"    "$DEST/" "${RC_OPTS[@]}"
rclone copy "$LOCAL/media-$STAMP.tar.gz" "$DEST/" "${RC_OPTS[@]}"

echo "-- verify today's set is really in the cloud"
rclone lsf "$DEST" | grep -q "db-$STAMP.sql.gz"    || fail "db dump missing from remote after upload"
rclone lsf "$DEST" | grep -q "media-$STAMP.tar.gz" || fail "media archive missing from remote after upload"

echo "-- retention"
rclone delete "$DEST" --min-age 45d
ls -1t "$LOCAL"/db-*.sql.gz    2>/dev/null | tail -n +4 | xargs -r rm -f
ls -1t "$LOCAL"/media-*.tar.gz 2>/dev/null | tail -n +4 | xargs -r rm -f

echo "✓ backup $STAMP shipped ($(du -sh "$LOCAL/db-$STAMP.sql.gz" | cut -f1) db, $(du -sh "$LOCAL/media-$STAMP.tar.gz" | cut -f1) media)"
