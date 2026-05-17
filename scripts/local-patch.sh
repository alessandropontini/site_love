#!/usr/bin/env bash
set -euo pipefail

if ! ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "Run this script from inside a git repository." >&2
  exit 1
fi

if [[ "$(pwd -P)" != "$ROOT" ]]; then
  echo "Run this script from the git repository root: $ROOT" >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/local-patch.sh \"patch description\"" >&2
  exit 2
fi

TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
REPORT_DIR=".agent/reports/$TIMESTAMP"
mkdir -p "$REPORT_DIR"

printf '%s\n' "$*" > "$REPORT_DIR/patch-request.txt"
git status --short > "$REPORT_DIR/git-status-before.txt"

cat > "$REPORT_DIR/implementer-placeholder.md" <<'EOF'
# Implementer Placeholder

Automatic patch implementation is not active in Phase 1.

No application code was modified by this script. A future phase may connect a real executor such as `codex exec` or another approved provider and write a real implementer report here.
EOF

echo "Saved patch request in $REPORT_DIR"
echo "Automatic implementation is not active in Phase 1."
echo "No application code was modified by this script."
