#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

blocked_vars=(
  DATABASE_URL
  GUEST_SYNC_DATABASE_URL
  GUEST_SYNC_SPREADSHEET_ID
  GUEST_SYNC_GOOGLE_CLIENT_EMAIL
  GUEST_SYNC_GOOGLE_PRIVATE_KEY
  CLERK_SECRET_KEY
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  RSVP_ADMIN_EMAILS
  TURNSTILE_SECRET_KEY
  RSVP_EMAIL_ENABLED
  RESEND_API_KEY
)
for name in "${blocked_vars[@]}"; do
  if [[ -n "${!name:-}" ]]; then
    printf 'Refusing sandbox run: %s is set. Unset live-service configuration first.\n' "$name" >&2
    exit 2
  fi
done

if [[ -z "${PGLITE_TEST_MODULE:-}" ]]; then
  PGLITE_TEST_MODULE="$(node -e 'process.stdout.write(require.resolve("@electric-sql/pglite"))' 2>/dev/null || true)"
fi
if [[ -z "$PGLITE_TEST_MODULE" || ! -f "$PGLITE_TEST_MODULE" ]]; then
  echo 'PGlite is required. Set PGLITE_TEST_MODULE to a local PGlite entrypoint.' >&2
  exit 2
fi

BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT
export SYNC_TEST_BUILD="$BUILD_DIR"
export PGLITE_TEST_MODULE
export NODE_PATH="$PWD/node_modules${NODE_PATH:+:$NODE_PATH}"

./node_modules/.bin/tsc --ignoreConfig --types node --target es2022 --lib esnext,dom \
  --module commonjs --moduleResolution node --ignoreDeprecations 6.0 \
  --esModuleInterop --skipLibCheck --rootDir lib --outDir "$BUILD_DIR" \
  lib/guest-sync/model.ts \
  lib/rsvp/token.ts \
  lib/rsvp/imported-household-activation.ts \
  lib/rsvp/imported-household-activation-receipt.ts \
  lib/rsvp/imported-household-activation-workflow.ts \
  lib/rsvp/imported-household-activation-admin-actions.ts

node --test tests/rsvp/imported-household-activation-e2e.test.cjs
