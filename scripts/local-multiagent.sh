#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/multiagent-provider.sh"

require_git_root

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/local-multiagent.sh \"patch description\"" >&2
  exit 2
fi

REPORT_DIR="$(create_run_dir)"
PROVIDER="${MULTIAGENT_PROVIDER:-noop}"
REQUEST_FILE="$REPORT_DIR/patch-request.txt"

printf '%s\n' "$*" > "$REQUEST_FILE"
write_context_files "$REPORT_DIR" "multiagent" "$REQUEST_FILE"
run_validation_commands "$REPORT_DIR" || true

run_agent "$REPORT_DIR" "review-code-qa" ".agent/prompts/review-code-qa.md" "$REPORT_DIR/10_review-code-qa.md"

aggregate_reports_basic \
  "$REPORT_DIR" \
  "$REPORT_DIR/99_final-verdict.md" \
  "$REPORT_DIR/10_review-code-qa.md"

echo "Provider: $PROVIDER"
echo "Report directory: $REPORT_DIR"
echo "Implementation stays in the interactive Codex session; this command performs one separate read-only review."
echo "Final verdict:"
sed -n 's/^- Verdict: //p' "$REPORT_DIR/99_final-verdict.md" | tail -n 1
