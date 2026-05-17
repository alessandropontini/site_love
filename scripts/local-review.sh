#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/multiagent-provider.sh"

require_git_root

REPORT_DIR="$(create_run_dir)"
PROVIDER="${MULTIAGENT_PROVIDER:-noop}"

write_context_files "$REPORT_DIR" "review"
run_validation_commands "$REPORT_DIR" || true

run_agent "$REPORT_DIR" "review-code" ".agent/prompts/review-code.md" "$REPORT_DIR/10_review-code.md"
run_agent "$REPORT_DIR" "review-qa-regression" ".agent/prompts/review-qa-regression.md" "$REPORT_DIR/11_review-qa-regression.md"

aggregate_reports_basic \
  "$REPORT_DIR" \
  "$REPORT_DIR/99_final-verdict.md" \
  "$REPORT_DIR/10_review-code.md" \
  "$REPORT_DIR/11_review-qa-regression.md"

echo "Provider: $PROVIDER"
echo "Report directory: $REPORT_DIR"
echo "Final verdict:"
sed -n 's/^- Verdict: //p' "$REPORT_DIR/99_final-verdict.md" | tail -n 1
