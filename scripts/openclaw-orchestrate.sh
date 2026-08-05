#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "Run this script from inside the SITE LOVE git repository." >&2
  exit 1
fi

if ! command -v openclaw >/dev/null 2>&1; then
  cat <<'EOF'
OpenClaw not available.

This experimental wrapper did not run orchestration because the `openclaw` command was not found.
No files were changed, no branch was pushed, and no merge was attempted.

Fallback command:
  MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md

Infrastructure smoke command:
  MULTIAGENT_PROVIDER=noop ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md

See docs/openclaw-orchestration.md for the SITE LOVE OpenClaw spike contract.
EOF
  exit 127
fi

cat <<'EOF'
OpenClaw command detected.

SITE LOVE has not yet verified a stable non-interactive OpenClaw CLI invocation.
This wrapper is intentionally a safe placeholder: it does not invent commands, auto-merge, push, or modify remote branches.

Use the validated Codex-backed workflow until an OpenClaw command is explicitly wired and reviewed:
  MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md

Expected report directory:
  .agent/reports/<run-id>/
EOF
