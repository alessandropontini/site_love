#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROVIDER="${MULTIAGENT_PROVIDER:-noop}"
COMMAND=""

usage() {
  cat <<'USAGE'
Usage:
  ./scripts/crewai-orchestrate.sh [--help]
  ./scripts/crewai-orchestrate.sh status
  ./scripts/crewai-orchestrate.sh smoke
  ./scripts/crewai-orchestrate.sh explain
  ./scripts/crewai-orchestrate.sh review

Commands:
  status   Show branch, git status, provider, and required file checks.
  smoke    Run non-destructive CrewAI scaffold checks.
  explain  Explain lanes, roles, and safety rules.
  review   Delegate real review to ./scripts/local-review.sh.

Notes:
  MULTIAGENT_PROVIDER defaults to noop when unset.
  CrewAI is future orchestration infrastructure only.
  Real review remains Codex/local-review.sh and .agent/reports/.
  This wrapper never commits, merges, pushes, or invents verdicts.
USAGE
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

parse_args() {
  if [[ "$#" -eq 0 ]]; then
    usage
    exit 0
  fi

  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      --help | -h)
        usage
        exit 0
        ;;
      status | smoke | explain | review)
        if [[ -n "$COMMAND" ]]; then
          die "Only one command can be supplied."
        fi
        COMMAND="$1"
        ;;
      *)
        die "Unknown argument: $1"
        ;;
    esac
    shift
  done

  [[ -n "$COMMAND" ]] || die "Missing command. Use --help for usage."
}

require_git_root() {
  local root
  if ! root="$(git -C "$REPO_ROOT" rev-parse --show-toplevel 2>/dev/null)"; then
    die "Run this script from inside a git repository."
  fi
  [[ "$root" == "$REPO_ROOT" ]] || die "Script path did not resolve to the git repository root."
  cd "$REPO_ROOT"
}

current_branch() {
  local branch
  branch="$(git branch --show-current)"
  if [[ -z "$branch" ]]; then
    branch="(detached HEAD)"
  fi
  printf '%s\n' "$branch"
}

refuse_prod() {
  local branch="$1"
  [[ "$branch" != "prod" ]] || die "Refusing to run on protected branch 'prod'."
}

git_status_short() {
  git status --short --untracked-files=all
}

print_repo_state() {
  local branch="$1"
  local status
  status="$(git_status_short)"

  printf 'Branch: %s\n' "$branch"
  printf 'Provider: %s\n' "$PROVIDER"
  printf 'Git status:\n'
  if [[ -n "$status" ]]; then
    printf '%s\n' "$status"
  else
    printf '  clean\n'
  fi
}

require_file() {
  local path="$1"
  [[ -f "$path" ]] || die "Required file is missing: $path"
}

require_executable() {
  local path="$1"
  [[ -f "$path" ]] || die "Required script is missing: $path"
  [[ -x "$path" ]] || die "Required script is not executable: $path"
}

python_bin() {
  if command -v python3 >/dev/null 2>&1; then
    printf '%s\n' "python3"
    return 0
  fi
  if command -v python >/dev/null 2>&1; then
    printf '%s\n' "python"
    return 0
  fi
  return 1
}

check_crewai_package() {
  local py="$1"
  if "$py" - <<'PY' >/dev/null 2>&1
import importlib.util
raise SystemExit(0 if importlib.util.find_spec("crewai") else 1)
PY
  then
    printf 'CrewAI package: installed\n'
  else
    printf 'CrewAI package: not installed; scaffold checks can still run, but CrewAI will not execute site work.\n'
  fi
}

check_required_files() {
  require_file "orchestration/crewai_site_love.py"
  require_file "orchestration/agents.yaml"
  require_file "orchestration/tasks.yaml"
  require_executable "scripts/local-review.sh"
  require_executable "scripts/test-multiagent-workflow.sh"
  require_file ".agent/prompts/review-code.md"
  require_file ".agent/prompts/review-qa-regression.md"
  require_file ".agent/reports/.gitkeep"
}

latest_report_dir() {
  find .agent/reports -mindepth 1 -maxdepth 1 -type d -print 2>/dev/null | sort -r | head -n 1 || true
}

print_latest_verdict() {
  local run_dir
  run_dir="$(latest_report_dir)"

  if [[ -z "$run_dir" ]]; then
    printf 'Latest report directory: not found\n'
    return 0
  fi

  printf 'Latest report directory: %s\n' "$run_dir"
  if [[ -f "$run_dir/99_final-verdict.md" ]]; then
    printf '\n--- %s/99_final-verdict.md ---\n' "$run_dir"
    cat "$run_dir/99_final-verdict.md"
  else
    printf 'Final verdict file: not found\n'
  fi
}

run_python_scaffold() {
  local command="$1"
  local py

  if ! py="$(python_bin)"; then
    die "Python 3 or python is required for the CrewAI scaffold."
  fi

  check_crewai_package "$py"
  "$py" ./orchestration/crewai_site_love.py "$command"
}

run_status() {
  local branch="$1"
  print_repo_state "$branch"
  check_required_files
  run_python_scaffold status
}

run_smoke() {
  local branch="$1"
  print_repo_state "$branch"
  check_required_files
  run_python_scaffold smoke
}

run_explain() {
  local branch="$1"
  print_repo_state "$branch"
  check_required_files
  run_python_scaffold explain
}

run_review() {
  local branch="$1"
  local exit_code

  print_repo_state "$branch"
  check_required_files
  printf '\nDelegating real review to scripts/local-review.sh...\n'

  set +e
  ./scripts/local-review.sh
  exit_code=$?
  set -e

  print_latest_verdict
  return "$exit_code"
}

main() {
  local branch

  parse_args "$@"
  require_git_root
  branch="$(current_branch)"
  refuse_prod "$branch"

  case "$COMMAND" in
    status)
      run_status "$branch"
      ;;
    smoke)
      run_smoke "$branch"
      ;;
    explain)
      run_explain "$branch"
      ;;
    review)
      run_review "$branch"
      ;;
    *)
      die "Unsupported command: $COMMAND"
      ;;
  esac
}

main "$@"
