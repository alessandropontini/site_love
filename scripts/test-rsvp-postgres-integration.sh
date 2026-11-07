#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
  echo "TEST_DATABASE_URL is required for the isolated PostgreSQL integration test." >&2
  exit 2
fi

for command_name in psql createdb pg_dump pg_restore; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required for the PostgreSQL integration test." >&2
    exit 2
  fi
done

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/site-love-rsvp-pg-test.XXXXXX")"
BACKUP_DIR="$WORK_DIR/private-backups"
mkdir -m 700 "$BACKUP_DIR"
RESTORE_DATABASE="site_love_restore_${$}"
RESTORE_URL="${TEST_DATABASE_URL%/*}/$RESTORE_DATABASE"
cleanup() {
  dropdb --if-exists --dbname="$RESTORE_URL" >/dev/null 2>&1 || true
  rm -rf -- "$WORK_DIR"
}
trap cleanup EXIT

EVENT_ID="55555555-5555-4555-8555-555555555555"
SOURCE_ID="fictional-source"
EXTERNAL_HOUSEHOLD_ID="11111111-1111-4111-8111-111111111111"
HOUSEHOLD_ID="22222222-2222-4222-8222-222222222222"
GUEST_ID="33333333-3333-4333-8333-333333333333"
INVITEE_ID="44444444-4444-4444-8444-444444444444"
TOKEN_HASH="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -q -c 'CREATE ROLE site_love_sync' -c 'CREATE ROLE site_love_app'
for migration in "$ROOT_DIR"/db/migrations/*.sql; do
  psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$migration"
done

psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -q <<SQL
INSERT INTO rsvp.guest_sync_sources(source_id, mode)
VALUES ('$SOURCE_ID', 'household_uuid');
INSERT INTO rsvp.households(
  id, display_name, token_hash, status, invited_by, preferred_locale,
  response_version, allow_plus_one, revoked_at
) VALUES (
  '$HOUSEHOLD_ID', 'Fictional Household', NULL, 'disabled', 'groom', 'it', 0, false, NULL
);
INSERT INTO rsvp.invitees(id, household_id, display_name)
VALUES ('$INVITEE_ID', '$HOUSEHOLD_ID', 'Fictional Guest');
INSERT INTO rsvp.guest_sync_households(source_id, external_household_id, household_id)
VALUES ('$SOURCE_ID', '$EXTERNAL_HOUSEHOLD_ID', '$HOUSEHOLD_ID');
INSERT INTO rsvp.guest_sync_members(
  external_id, source_id, household_id, external_household_id, invitee_id, data
) VALUES (
  '$GUEST_ID', '$SOURCE_ID', '$HOUSEHOLD_ID', '$EXTERNAL_HOUSEHOLD_ID', '$INVITEE_ID',
  '{"externalId":"$GUEST_ID","kind":"named","name":"Fictional Guest","party":"Fictional Household","owner":"groom"}'::jsonb
);
SQL

activation_sql="BEGIN; SET ROLE site_love_sync; SELECT rsvp.activate_imported_household_invitation('$EVENT_ID', 'fictional-admin', '$SOURCE_ID', '$EXTERNAL_HOUSEHOLD_ID', '$HOUSEHOLD_ID', 0, '$TOKEN_HASH'); COMMIT;"
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -qAt -c "$activation_sql" >"$WORK_DIR/activation-a.json" &
activation_a_pid=$!
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -qAt -c "$activation_sql" >"$WORK_DIR/activation-b.json" &
activation_b_pid=$!
wait "$activation_a_pid"
wait "$activation_b_pid"

result_a="$(cat "$WORK_DIR/activation-a.json")"
result_b="$(cat "$WORK_DIR/activation-b.json")"
combined_results="$result_a $result_b"
false_count="$(grep -o '"replayed"[[:space:]]*:[[:space:]]*false' <<<"$combined_results" | wc -l | tr -d ' ')"
true_count="$(grep -o '"replayed"[[:space:]]*:[[:space:]]*true' <<<"$combined_results" | wc -l | tr -d ' ')"
if [[ "$false_count" != 1 || "$true_count" != 1 ]]; then
  echo "Concurrent activation did not yield exactly one commit and one replay." >&2
  exit 1
fi

state="$(psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -qAt -F '|' -c \
  "SELECT h.id, h.status, h.token_hash, i.id, m.external_id, m.invitee_id,\
   (SELECT count(*) FROM rsvp.imported_household_invitation_events)\
   FROM rsvp.households h\
   JOIN rsvp.invitees i ON i.household_id = h.id\
   JOIN rsvp.guest_sync_members m ON m.household_id = h.id\
   WHERE h.id = '$HOUSEHOLD_ID'")"
expected_state="$HOUSEHOLD_ID|active|$TOKEN_HASH|$INVITEE_ID|$GUEST_ID|$INVITEE_ID|1"
if [[ "$state" != "$expected_state" ]]; then
  echo "Household identity, mapping, token hash, or audit state changed unexpectedly." >&2
  exit 1
fi
if psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -qAt -c \
  "SELECT EXISTS (SELECT 1 FROM information_schema.columns\
   WHERE table_schema = 'rsvp' AND table_name = 'imported_household_invitation_events'\
   AND column_name = 'token_hash')" | grep -qx t; then
  echo "The activation journal must not contain a token hash column." >&2
  exit 1
fi

DATABASE_URL="$TEST_DATABASE_URL" npm --prefix "$ROOT_DIR" run backup:rsvp -- "$BACKUP_DIR" >/dev/null
backup_file="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'rsvp-*.dump' -print -quit)"
if [[ -z "$backup_file" || "$(stat -c '%a' "$backup_file")" != 600 ]]; then
  echo "The RSVP backup is missing or does not have private file permissions." >&2
  exit 1
fi

createdb --maintenance-db="$TEST_DATABASE_URL" "$RESTORE_DATABASE"
psql "$RESTORE_URL" -v ON_ERROR_STOP=1 -q -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto'
pg_restore --dbname="$RESTORE_URL" --no-owner --no-acl "$backup_file"
restored_state="$(psql "$RESTORE_URL" -v ON_ERROR_STOP=1 -qAt -F '|' -c \
  "SELECT h.id, h.status, h.token_hash, i.id, m.external_id, m.invitee_id,\
   (SELECT count(*) FROM rsvp.imported_household_invitation_events)\
   FROM rsvp.households h\
   JOIN rsvp.invitees i ON i.household_id = h.id\
   JOIN rsvp.guest_sync_members m ON m.household_id = h.id\
   WHERE h.id = '$HOUSEHOLD_ID'")"
if [[ "$restored_state" != "$expected_state" ]]; then
  echo "The restored RSVP schema does not match its synthetic source state." >&2
  exit 1
fi

echo "PASS: PostgreSQL migrations 001–015, two-client concurrent activation, RSVP backup and restore (synthetic fixtures)."
