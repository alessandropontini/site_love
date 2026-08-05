#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/lib/multiagent-provider.sh"

require_git_root

PROVIDER="${MULTIAGENT_PROVIDER:-noop}"
REQUEST_FILE="${REVIEW_REQUEST_FILE:-}"
EVIDENCE_FILE="${REVIEW_EVIDENCE_FILE:-}"
PROMPT_FILE="$REPO_ROOT/.agent/prompts/review-code-qa.md"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --request-file)
      [[ $# -ge 2 ]] || { echo "--request-file requires a path." >&2; exit 2; }
      REQUEST_FILE="$2"
      shift 2
      ;;
    --evidence-file)
      [[ $# -ge 2 ]] || { echo "--evidence-file requires a path." >&2; exit 2; }
      EVIDENCE_FILE="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: scripts/local-review.sh [--request-file path/to/request.md] [--evidence-file path/to/evidence.md]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ -n "$REQUEST_FILE" && ! -f "$REQUEST_FILE" ]]; then
  echo "Review request file not found: $REQUEST_FILE" >&2
  exit 2
fi
if [[ -n "$EVIDENCE_FILE" && ! -f "$EVIDENCE_FILE" ]]; then
  echo "Review evidence file not found: $EVIDENCE_FILE" >&2
  exit 2
fi
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Canonical review prompt not found: $PROMPT_FILE" >&2
  exit 2
fi

REPORT_DIR="$(create_run_dir)"
write_context_files "$REPORT_DIR" "review" "$REQUEST_FILE"
if [[ -n "$EVIDENCE_FILE" ]]; then
  cp "$EVIDENCE_FILE" "$REPORT_DIR/08_review_evidence.md"
fi
run_validation_commands "$REPORT_DIR" || true

run_agent "$REPORT_DIR" "review-code-qa" "$PROMPT_FILE" "$REPORT_DIR/10_review-code-qa.md"

aggregate_reports_basic \
  "$REPORT_DIR" \
  "$REPORT_DIR/99_final-verdict.md" \
  "$REPORT_DIR/10_review-code-qa.md"

echo "Provider: $PROVIDER"
echo "Report directory: $REPORT_DIR"
echo "Final verdict:"
sed -n 's/^- Verdict: //p' "$REPORT_DIR/99_final-verdict.md" | tail -n 1
