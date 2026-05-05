#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker/compose.prod.yml}"
BACKUP_FILE="${1:-}"
YES="${YES:-}"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

compose() {
  docker compose -f "$ROOT_DIR/$COMPOSE_FILE" --project-directory "$ROOT_DIR" "$@"
}

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 path/to/backup.tar.gz" >&2
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

echo "Extracting backup..."
tar -xzf "$BACKUP_FILE" -C "$WORK_DIR"

if [ ! -f "$WORK_DIR/database.dump" ] || [ ! -f "$WORK_DIR/uploads.tar.gz" ]; then
  echo "Invalid backup package. Expected database.dump and uploads.tar.gz." >&2
  exit 1
fi

if [ -f "$WORK_DIR/manifest.json" ]; then
  echo "Manifest:"
  sed -n '1,120p' "$WORK_DIR/manifest.json"
fi

if [ "$YES" != "1" ]; then
  echo
  echo "This will replace the current PostgreSQL database and /app/public/uploads volume."
  printf "Type RESTORE to continue: "
  read -r CONFIRM
  if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Restore cancelled."
    exit 1
  fi
fi

echo "Stopping web service to avoid writes during restore..."
compose stop web

echo "Restoring PostgreSQL dump..."
cat "$WORK_DIR/database.dump" | compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner'

echo "Restoring uploads..."
cat "$WORK_DIR/uploads.tar.gz" | compose run --rm --no-deps -T --user root web sh -c 'rm -rf /app/public/uploads && mkdir -p /app/public && tar -xzf - -C /app/public && chown -R nextjs:nodejs /app/public/uploads'

echo "Starting web service..."
compose up -d web

echo "Restore completed."
