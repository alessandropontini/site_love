#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="${1:-$REPO_ROOT/backups}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL non è impostata." >&2
  exit 2
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump non è installato. Installa il client PostgreSQL e riprova." >&2
  exit 2
fi

umask 077
mkdir -p -- "$OUTPUT_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_FILE="$OUTPUT_DIR/rsvp-$TIMESTAMP.dump"

pg_dump \
  --dbname="$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --schema=rsvp \
  --file="$OUTPUT_FILE"

chmod 600 "$OUTPUT_FILE"
echo "Backup RSVP creato: $OUTPUT_FILE"
