#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/multiagent-provider.sh"

require_git_root

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/local-patch.sh \"patch description\"" >&2
  exit 2
fi

REPORT_DIR="$(create_run_dir)"
PROVIDER="${MULTIAGENT_PROVIDER:-noop}"
REQUEST_FILE="$REPORT_DIR/patch-request.txt"

printf '%s\n' "$*" > "$REQUEST_FILE"
write_context_files "$REPORT_DIR" "patch" "$REQUEST_FILE"

write_infrastructure_blocked_report \
  "$REPORT_DIR/09_implementer.md" \
  "patch-implementer" \
  "$PROVIDER" \
  "$(provider_model "$PROVIDER")" \
  "automatic patch implementation is not active in Phase 2B" \
  "no"

cat > "$REPORT_DIR/99_final-verdict.md" <<EOF
# Final Verdict

- Aggregator: deterministic shell
- Provider: $PROVIDER
- Verdict: INFRASTRUCTURE BLOCKED
- Mergeable: no

Patch automation is not active in Phase 2B. No application code was modified by this script.
EOF

echo "Provider: $PROVIDER"
echo "Report directory: $REPORT_DIR"
echo "Automatic implementation is not active in Phase 2B."
echo "No application code was modified by this script."
