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

TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
REPORT_DIR=".agent/reports/$TIMESTAMP"
mkdir -p "$REPORT_DIR"

git status --short > "$REPORT_DIR/git-status.txt"
git diff --stat > "$REPORT_DIR/git-diff-stat.txt"
git diff > "$REPORT_DIR/git-diff.patch"

cat > "$REPORT_DIR/README.md" <<'EOF'
# Local Multi-Agent Run Context

This Phase 1 script prepares report context only. It does not execute real agent providers, does not approve patches, and does not simulate multi-agent review.

Future integration points:

- `codex exec` for executor or reviewer sessions.
- A local or freemium provider CLI.
- Gemini CLI where approved by the project owner.
- Ollama when configured in a later phase.
- OpenClaw as an optional orchestration layer in a later phase.

Until real independent agents write separate reports, the correct workflow verdict is `INFRASTRUCTURE BLOCKED`.
EOF

echo "Prepared local multi-agent report context in $REPORT_DIR"
echo "Phase 1 does not run real agent providers yet."
echo "Verdict remains INFRASTRUCTURE BLOCKED until real, separate reviewer reports exist."
