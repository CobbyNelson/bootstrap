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
# RESTORING (needs the private key, which does not live on this server):
#
#   rclone copy backup:ac-backups/db-2026-08-08.sql.gz.age .
#   age -d -i ~/ac-backup-key.txt db-2026-08-08.sql.gz.age | gunzip \
#     | docker exec -i ac-postgres psql -U ac assets_and_capital
#
# Lose that key and every backup is landfill. There is no recovery path and
# that is the point of the design.

set -euo pipefail

AC=/srv/ac
STAMP="$(date +%F)"
DEST="backup:ac-backups"
LOCAL="$AC/backups"

fail() { echo "backup: $*" >&2; exit 1; }

command -v rclone >/dev/null || fail "rclone is not installed"
rclone listremotes | grep -q '^backup:' \
  || fail "no rclone remote named 'backup' — see the header of this script"

# The backups leave this machine, so they are encrypted before they do.
#
# ASYMMETRIC on purpose. The server holds only the PUBLIC key, so it can create
# a backup it cannot itself read — somebody who roots this box gets tonight's
# database either way, but they do not get the archive of every previous night,
# and they cannot decrypt what is already in the cloud. A passphrase stored on
# the server would give none of that, because the thing that decrypts would be
# sitting next to the thing being decrypted.
#
# The private key belongs OFF this machine. If it is here, this is theatre.
command -v age >/dev/null || fail "age is not installed (apt-get install -y age)"
[[ -s "$AC/shared/backup-recipient.pub" ]] \
  || fail "no $AC/shared/backup-recipient.pub — generate a key with 'age-keygen', keep the private half off this server"
RECIPIENT="$(tr -d '[:space:]' < "$AC/shared/backup-recipient.pub")"
[[ "$RECIPIENT" == age1* ]] || fail "backup-recipient.pub does not look like an age public key"

# Anything written here contains the whole database. Not group- or
# world-readable, even for the minutes before it is uploaded and pruned.
umask 077

mkdir -p "$LOCAL"

echo "-- database dump"
# Piped straight into age: the plaintext dump is never a file on disk.
docker exec ac-postgres pg_dump -U ac assets_and_capital \
  | gzip | age -r "$RECIPIENT" > "$LOCAL/db-$STAMP.sql.gz.age"
[[ -s "$LOCAL/db-$STAMP.sql.gz.age" ]] || fail "database dump came out empty"

echo "-- media archive"
tar -cz -C "$AC/storage" media | age -r "$RECIPIENT" > "$LOCAL/media-$STAMP.tar.gz.age"

echo "-- upload"
# --retries: Mega's API drops connections under load more readily than S3-style
# stores, and a nightly job gets one chance — a transient 500 must not cost the
# day's backup. --transfers=1 keeps a single session, which Mega prefers.
RC_OPTS=(--no-traverse --retries 3 --retries-sleep 20s --transfers 1 --timeout 5m)
rclone copy "$LOCAL/db-$STAMP.sql.gz.age"    "$DEST/" "${RC_OPTS[@]}"
rclone copy "$LOCAL/media-$STAMP.tar.gz.age" "$DEST/" "${RC_OPTS[@]}"

echo "-- verify today's set is really in the cloud"
rclone lsf "$DEST" | grep -q "db-$STAMP.sql.gz.age"    || fail "db dump missing from remote after upload"
rclone lsf "$DEST" | grep -q "media-$STAMP.tar.gz.age" || fail "media archive missing from remote after upload"

echo "-- retention"
rclone delete "$DEST" --min-age 45d
ls -1t "$LOCAL"/db-*.sql.gz.age    2>/dev/null | tail -n +4 | xargs -r rm -f
ls -1t "$LOCAL"/media-*.tar.gz.age 2>/dev/null | tail -n +4 | xargs -r rm -f

echo "✓ backup $STAMP shipped ($(du -sh "$LOCAL/db-$STAMP.sql.gz.age" | cut -f1) db, $(du -sh "$LOCAL/media-$STAMP.tar.gz.age" | cut -f1) media)"
