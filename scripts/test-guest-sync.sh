#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
SYNC_TEST_BUILD="$(mktemp -d)"
trap 'rm -rf "$SYNC_TEST_BUILD"' EXIT
export SYNC_TEST_BUILD
export NODE_PATH="$PWD/node_modules"
./node_modules/.bin/tsc --ignoreConfig --types node --target es2022 --lib esnext,dom --module commonjs --moduleResolution node --ignoreDeprecations 6.0 --esModuleInterop --skipLibCheck --outDir "$SYNC_TEST_BUILD" lib/guest-sync/model.ts lib/guest-sync/presentation.ts lib/guest-sync/receipt.ts lib/guest-sync/workflow.ts lib/guest-sync/google.ts
./node_modules/.bin/tsc --ignoreConfig --types node --target es2022 --lib esnext,dom --module commonjs --moduleResolution node --ignoreDeprecations 6.0 --esModuleInterop --skipLibCheck --rootDir lib --outDir "$SYNC_TEST_BUILD" lib/rsvp/imported-household-activation.ts
./node_modules/.bin/tsc --ignoreConfig --types node --target es2022 --module commonjs --skipLibCheck --outDir "$SYNC_TEST_BUILD" lib/admin/allowlist.ts
./node_modules/.bin/tsc --ignoreConfig --types node --target es2022 --lib esnext,dom --module commonjs --moduleResolution node --ignoreDeprecations 6.0 --esModuleInterop --skipLibCheck --rootDir lib --outDir "$SYNC_TEST_BUILD" lib/rsvp/imported-household-activation-preview.ts
node --test tests/guest-sync/*.test.cjs tests/rsvp/*.test.cjs
