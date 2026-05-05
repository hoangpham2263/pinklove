#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker/compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-app}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="${BACKUP_NAME:-${PROJECT_NAME}-${TIMESTAMP}}"
WORK_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

compose() {
  docker compose -f "$ROOT_DIR/$COMPOSE_FILE" --project-directory "$ROOT_DIR" "$@"
}

mkdir -p "$BACKUP_DIR"

echo "Creating PostgreSQL dump..."
compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$WORK_DIR/database.dump"

echo "Creating uploads archive..."
compose exec -T --user root web sh -c 'mkdir -p /app/public/uploads && tar -czf - -C /app/public uploads' > "$WORK_DIR/uploads.tar.gz"

DATABASE_SIZE="$(wc -c < "$WORK_DIR/database.dump" | tr -d ' ')"
UPLOADS_SIZE="$(wc -c < "$WORK_DIR/uploads.tar.gz" | tr -d ' ')"

cat > "$WORK_DIR/manifest.json" <<EOF
{
  "app": "pinklove",
  "backupVersion": 1,
  "createdAt": "$TIMESTAMP",
  "composeFile": "$COMPOSE_FILE",
  "projectName": "$PROJECT_NAME",
  "database": {
    "format": "pg_dump custom",
    "file": "database.dump",
    "sizeBytes": $DATABASE_SIZE
  },
  "uploads": {
    "file": "uploads.tar.gz",
    "sizeBytes": $UPLOADS_SIZE
  }
}
EOF

echo "Packaging backup..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$WORK_DIR" manifest.json database.dump uploads.tar.gz

sha256sum "$BACKUP_DIR/$BACKUP_NAME.tar.gz" > "$BACKUP_DIR/$BACKUP_NAME.tar.gz.sha256"

echo "Backup created:"
echo "  $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "  $BACKUP_DIR/$BACKUP_NAME.tar.gz.sha256"
