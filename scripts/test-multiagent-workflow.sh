#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TMP_PARENT=""
WORKTREE=""

PASS_EXPLICIT="PENDING"
PASS_COMMITTED="PENDING"
PASS_WORKING_TREE="PENDING"
PASS_TIMEOUT_CLEANUP="PENDING"
PASS_PROVIDER_GATE="PENDING"

log() {
  printf '%s\n' "$*" >&2
}

fail() {
  local message="$1"
  local run_dir="${2:-}"

  printf 'ERROR: %s\n' "$message" >&2
  if [[ -n "$run_dir" ]]; then
    printf 'Report directory: %s\n' "$run_dir" >&2
    if [[ -f "$run_dir/99_final-verdict.md" ]]; then
      printf '\n--- 99_final-verdict.md ---\n' >&2
      sed -n '1,120p' "$run_dir/99_final-verdict.md" >&2
    fi
  fi
  exit 1
}

cleanup() {
  if [[ -n "$WORKTREE" && -d "$WORKTREE" ]]; then
    git -C "$REPO_ROOT" worktree remove --force "$WORKTREE" >/dev/null 2>&1 || true
  fi
  if [[ -n "$TMP_PARENT" && -d "$TMP_PARENT" ]]; then
    rm -rf "$TMP_PARENT"
  fi
}

trap cleanup EXIT

require_git_root() {
  local root
  root="$(git -C "$REPO_ROOT" rev-parse --show-toplevel)"
  if [[ "$root" != "$REPO_ROOT" ]]; then
    fail "Script path did not resolve to the git repository root."
  fi
}

create_clean_worktree() {
  TMP_PARENT="$(mktemp -d "${TMPDIR:-/tmp}/site-love-multiagent-smoke.XXXXXX")"
  WORKTREE="$TMP_PARENT/worktree"
  git -C "$REPO_ROOT" worktree add --detach "$WORKTREE" HEAD >/dev/null
}

smoke_timeout_cleanup() {
  local fixture_dir child_pid exit_code child_alive

  log "==> timeout process-group cleanup smoke"
  fixture_dir="$TMP_PARENT/timeout-cleanup"
  mkdir -p "$fixture_dir"
  : > "$fixture_dir/stdin"
  : > "$fixture_dir/diagnostics"

  # shellcheck source=scripts/lib/multiagent-provider.sh
  source "$REPO_ROOT/scripts/lib/multiagent-provider.sh"
  if run_command_with_timeout \
    1 \
    "$fixture_dir/stdout" \
    "$fixture_dir/stderr" \
    "$fixture_dir/diagnostics" \
    "$fixture_dir/stdin" \
    bash -c 'sleep 30 & echo $! > "$1/child.pid"; wait' _ "$fixture_dir"; then
    exit_code=0
  else
    exit_code=$?
  fi

  [[ "$exit_code" -eq 124 ]] || fail "Expected timeout exit code 124, got $exit_code."
  [[ -s "$fixture_dir/child.pid" ]] || fail "Timeout fixture did not record its child PID."
  child_pid="$(cat "$fixture_dir/child.pid")"
  sleep 1
  if kill -0 "$child_pid" 2>/dev/null; then
    child_alive="yes"
  else
    child_alive="no"
  fi
  [[ "$child_alive" == "no" ]] || fail "Timed-out child process $child_pid survived cleanup."
  assert_contains "$fixture_dir" "diagnostics" "terminating process group"
  PASS_TIMEOUT_CLEANUP="PASS"
}

write_provider_fixture() {
  local output_file="$1"
  local provider="$2"

  {
    echo "# Agent Report"
    echo
    echo "- Agent: review-code-qa"
    echo "- Provider: $provider"
    echo "- Model: smoke"
    echo "- Real execution: yes"
    echo "- Input files: smoke"
    echo "- Verdict: PASS"
    echo
    echo "## Summary"
    echo
    echo "Smoke fixture."
    echo
    echo "## Findings"
    echo
    echo "None."
    echo
    echo "## Required changes"
    echo
    echo "None."
    echo
    echo "## Evidence"
    echo
    echo "Smoke fixture."
  } > "$output_file"
}

smoke_provider_gate() {
  local fixture_dir codex_report other_report spoof_report aggregate_dir final_file

  log "==> codex-only provider gate smoke"
  fixture_dir="$TMP_PARENT/provider-gate"
  mkdir -p "$fixture_dir"
  codex_report="$fixture_dir/codex.md"
  other_report="$fixture_dir/other.md"
  spoof_report="$fixture_dir/spoof.md"

  write_provider_fixture "$codex_report" "codex"
  write_provider_fixture "$other_report" "ollama"
  write_provider_fixture "$spoof_report" "codex"

  validate_real_agent_report "$codex_report" "codex" || fail "Codex report was rejected by the real-provider gate."
  if validate_real_agent_report "$other_report" "ollama"; then
    fail "A non-Codex report passed the real-provider gate."
  fi
  if validate_real_agent_report "$spoof_report" "ollama"; then
    fail "A non-Codex runner passed by declaring Provider: codex."
  fi

  aggregate_dir="$fixture_dir/aggregate"
  final_file="$aggregate_dir/99_final-verdict.md"
  mkdir -p "$aggregate_dir"
  printf 'context\n' > "$aggregate_dir/00_context.md"
  printf 'status\n' > "$aggregate_dir/01_git_status.txt"
  printf 'diff\n' > "$aggregate_dir/02_git_diff.patch"
  printf 'stat\n' > "$aggregate_dir/03_git_diff_stat.txt"
  printf 'Result: pass\n' > "$aggregate_dir/04_validation.md"
  printf '%s\n' '- Scope result: pass' > "$aggregate_dir/06_review_scope.md"
  printf 'file\n' > "$aggregate_dir/07_touched_files.txt"
  MULTIAGENT_PROVIDER=ollama aggregate_reports_basic "$aggregate_dir" "$final_file" "$spoof_report"
  assert_final_verdict "$aggregate_dir" "INFRASTRUCTURE BLOCKED"
  PASS_PROVIDER_GATE="PASS"
}

latest_report_dir() {
  local run_dir
  run_dir="$(find "$WORKTREE/.agent/reports" -mindepth 1 -maxdepth 1 -type d -print 2>/dev/null | sort -r | head -n 1 || true)"
  [[ -n "$run_dir" ]] || fail "No report directory was created."
  printf '%s\n' "$run_dir"
}

assert_file_exists() {
  local run_dir="$1"
  local rel_path="$2"
  [[ -f "$run_dir/$rel_path" ]] || fail "Missing expected file: $rel_path" "$run_dir"
}

assert_file_nonempty() {
  local run_dir="$1"
  local rel_path="$2"
  assert_file_exists "$run_dir" "$rel_path"
  [[ -s "$run_dir/$rel_path" ]] || fail "Expected non-empty file: $rel_path" "$run_dir"
}

assert_contains() {
  local run_dir="$1"
  local rel_path="$2"
  local pattern="$3"
  assert_file_exists "$run_dir" "$rel_path"
  grep -Fq -- "$pattern" "$run_dir/$rel_path" || fail "Expected '$rel_path' to contain: $pattern" "$run_dir"
}

assert_final_verdict() {
  local run_dir="$1"
  local expected="$2"
  local actual

  assert_file_exists "$run_dir" "99_final-verdict.md"
  actual="$(sed -n 's/^- Verdict: //p' "$run_dir/99_final-verdict.md" | tail -n 1)"
  [[ "$actual" == "$expected" ]] || fail "Expected final verdict '$expected', got '${actual:-missing}'." "$run_dir"
}

run_local_review() {
  local label="$1"
  shift

  log "==> $label"
  if ! (cd "$WORKTREE" && "$@") >&2; then
    fail "$label command failed."
  fi
  latest_report_dir
}

assert_common_noop_report() {
  local run_dir="$1"
  local expected_mode="$2"

  assert_file_exists "$run_dir" "00_context.md"
  assert_file_nonempty "$run_dir" "02_git_diff.patch"
  assert_file_nonempty "$run_dir" "03_git_diff_stat.txt"
  assert_file_exists "$run_dir" "06_review_scope.md"
  assert_file_nonempty "$run_dir" "07_touched_files.txt"
  assert_contains "$run_dir" "00_context.md" "- Review mode: $expected_mode"
  assert_contains "$run_dir" "06_review_scope.md" "- Review mode: $expected_mode"
  assert_contains "$run_dir" "06_review_scope.md" "- Scope result: pass"
  assert_final_verdict "$run_dir" "INFRASTRUCTURE BLOCKED"
  assert_contains "$run_dir" "10_review-code-qa.md" "- Real execution: no"
}

smoke_explicit_range() {
  local run_dir request_file evidence_file

  request_file="$TMP_PARENT/review-request.md"
  evidence_file="$TMP_PARENT/review-evidence.md"
  printf 'Acceptance: preserve the requested patch scope.\n' > "$request_file"
  printf 'Evidence: deterministic fixture.\n' > "$evidence_file"

  run_dir="$(run_local_review \
    "explicit-range smoke" \
    env REVIEW_BASE=HEAD~1 REVIEW_HEAD=HEAD MULTIAGENT_PROVIDER=noop MULTIAGENT_SKIP_WORKFLOW_SMOKE=1 "$REPO_ROOT/scripts/local-review.sh" --request-file "$request_file" --evidence-file "$evidence_file")"

  assert_common_noop_report "$run_dir" "explicit-range"
  assert_contains "$run_dir" "06_review_scope.md" "- Review base: HEAD~1"
  assert_contains "$run_dir" "06_review_scope.md" "- Review head: HEAD"
  assert_contains "$run_dir" "00_context.md" "Acceptance: preserve the requested patch scope."
  assert_contains "$run_dir" "08_review_evidence.md" "Evidence: deterministic fixture."
  PASS_EXPLICIT="PASS"
}

smoke_committed_range() {
  local run_dir status_output

  status_output="$(cd "$WORKTREE" && git status --short --untracked-files=all | grep -v '^?? \.agent/reports/' || true)"
  if [[ -n "$status_output" ]]; then
    PASS_COMMITTED="SKIPPED: worktree is not clean"
    log "==> committed-range smoke skipped: worktree is not clean"
    return 0
  fi

  run_dir="$(run_local_review \
    "committed-range smoke" \
    env MULTIAGENT_PROVIDER=noop MULTIAGENT_SKIP_WORKFLOW_SMOKE=1 "$REPO_ROOT/scripts/local-review.sh")"

  assert_common_noop_report "$run_dir" "committed-range"
  assert_contains "$run_dir" "06_review_scope.md" "- Review base: HEAD~1"
  assert_contains "$run_dir" "06_review_scope.md" "- Review head: HEAD"
  PASS_COMMITTED="PASS"
}

smoke_working_tree() {
  local run_dir fixture

  fixture=".agent/tmp/multiagent-smoke-fixture.txt"
  mkdir -p "$WORKTREE/.agent/tmp"
  printf 'temporary multi-agent workflow smoke fixture\n' > "$WORKTREE/$fixture"

  run_dir="$(run_local_review \
    "working-tree smoke" \
    env MULTIAGENT_PROVIDER=noop MULTIAGENT_SKIP_WORKFLOW_SMOKE=1 "$REPO_ROOT/scripts/local-review.sh")"

  assert_common_noop_report "$run_dir" "working-tree"
  assert_contains "$run_dir" "07_touched_files.txt" "$fixture"
  assert_contains "$run_dir" "05_untracked_files.md" "$fixture"

  rm -f "$WORKTREE/$fixture"
  rmdir "$WORKTREE/.agent/tmp" 2>/dev/null || true
  PASS_WORKING_TREE="PASS"
}

main() {
  require_git_root
  create_clean_worktree

  log "Using temporary worktree: $WORKTREE"
  smoke_timeout_cleanup
  smoke_provider_gate
  smoke_explicit_range
  smoke_committed_range
  smoke_working_tree

  log
  log "Smoke summary:"
  log "- explicit-range: $PASS_EXPLICIT"
  log "- committed-range: $PASS_COMMITTED"
  log "- working-tree: $PASS_WORKING_TREE"
  log "- timeout cleanup: $PASS_TIMEOUT_CLEANUP"
  log "- codex-only provider gate: $PASS_PROVIDER_GATE"
  log "- final status: PASS"
}

main "$@"
