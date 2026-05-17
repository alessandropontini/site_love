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

for reviewer in code qa-regression frontend-architect ux-a11y performance git-workflow aggregator; do
  cat > "$REPORT_DIR/review-$reviewer.md" <<EOF
# ${reviewer} Review Placeholder

Real independent reviewer execution is not active in Phase 1.

This placeholder is not an approval and must not be treated as a simulated review.

Verdict:
INFRASTRUCTURE BLOCKED
EOF
done

cat > "$REPORT_DIR/final-verdict.md" <<'EOF'
# Final Verdict

Real, separate multi-agent review reports are not available in Phase 1.

INFRASTRUCTURE BLOCKED
EOF

echo "Prepared review placeholders in $REPORT_DIR"
echo "No review was approved. Verdict: INFRASTRUCTURE BLOCKED"
