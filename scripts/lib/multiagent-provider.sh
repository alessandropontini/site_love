#!/usr/bin/env bash
set -euo pipefail

ALLOWED_VERDICTS_REGEX='^(APPROVED|APPROVED WITH NOTES|CHANGES REQUESTED|BLOCKED|INFRASTRUCTURE BLOCKED)$'

require_git_root() {
  local root

  if ! root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Run this script from inside a git repository." >&2
    return 1
  fi

  if [[ "$(pwd -P)" != "$root" ]]; then
    echo "Run this script from the git repository root: $root" >&2
    return 1
  fi
}

create_run_dir() {
  local timestamp
  timestamp="$(date -u +"%Y%m%dT%H%M%SZ")"
  RUN_DIR=".agent/reports/${timestamp}-$$"
  mkdir -p "$RUN_DIR"
  printf '%s\n' "$RUN_DIR"
}

sanitize_env_note() {
  cat <<'NOTE'
Environment note: this workflow intentionally does not record full environment variables, provider credentials, tokens, or secrets.
NOTE
}

write_context_files() {
  local run_dir="$1"
  local mode="${2:-review}"
  local request_file="${3:-}"

  {
    echo "# Multi-Agent Run Context"
    echo
    echo "- Mode: $mode"
    echo "- Provider: ${MULTIAGENT_PROVIDER:-noop}"
    echo "- Created at UTC: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "- Repository: $(basename "$(git rev-parse --show-toplevel)")"
    echo
    sanitize_env_note
    if [[ -n "$request_file" && -f "$request_file" ]]; then
      echo
      echo "## Patch Request"
      cat "$request_file"
    fi
  } > "$run_dir/00_context.md"

  git status --short > "$run_dir/01_git_status.txt"
  git diff > "$run_dir/02_git_diff.patch"
  git diff --stat > "$run_dir/03_git_diff_stat.txt"
}

run_validation_commands() {
  local run_dir="$1"
  local status=0

  {
    echo "# Validation"
    echo
    echo "## git diff --check"
    if git diff --check; then
      echo "Result: pass"
    else
      echo "Result: fail"
      status=1
    fi
    echo
    echo "## npm run lint"
    if npm run lint; then
      echo "Result: pass"
    else
      echo "Result: fail"
      status=1
    fi
    echo
    echo "## npm run build"
    if npm run build; then
      echo "Result: pass"
    else
      echo "Result: fail"
      status=1
    fi
  } > "$run_dir/04_validation.md" 2>&1

  return "$status"
}

provider_model() {
  local provider="$1"

  case "$provider" in
    ollama)
      printf '%s\n' "${MULTIAGENT_OLLAMA_MODEL:-qwen2.5-coder:7b}"
      ;;
    codex | gemini | noop)
      printf '%s\n' "n/a"
      ;;
    *)
      printf '%s\n' "unknown"
      ;;
  esac
}

write_infrastructure_blocked_report() {
  local output_file="$1"
  local agent="$2"
  local provider="$3"
  local model="$4"
  local reason="$5"
  local real_execution="${6:-no}"

  cat > "$output_file" <<EOF
# Agent Report

- Agent: $agent
- Provider: $provider
- Model: $model
- Real execution: $real_execution
- Input files: 00_context.md, 01_git_status.txt, 02_git_diff.patch, 03_git_diff_stat.txt, 04_validation.md
- Verdict: INFRASTRUCTURE BLOCKED
- Summary: The workflow could not produce a valid independent reviewer report.
- Findings:
  - $reason
- Required changes:
  - Configure a real provider and rerun the workflow.
- Evidence:
  - $reason
EOF
}

build_agent_prompt() {
  local run_dir="$1"
  local agent="$2"
  local prompt_file="$3"

  {
    echo "# SITE LOVE Agent Execution"
    echo
    echo "You must produce a report in the required Agent Report format."
    echo "The report must include exactly one valid Verdict line using: APPROVED, APPROVED WITH NOTES, CHANGES REQUESTED, BLOCKED, or INFRASTRUCTURE BLOCKED."
    echo "Use 'Real execution: yes' only if you are actually reviewing the supplied inputs as this agent."
    echo
    echo "## Agent Prompt"
    cat "$prompt_file"
    echo
    echo "## Run Context"
    cat "$run_dir/00_context.md"
    echo
    echo "## Git Status"
    cat "$run_dir/01_git_status.txt"
    echo
    echo "## Git Diff Stat"
    cat "$run_dir/03_git_diff_stat.txt"
    echo
    echo "## Git Diff"
    cat "$run_dir/02_git_diff.patch"
    if [[ -f "$run_dir/04_validation.md" ]]; then
      echo
      echo "## Validation Output"
      cat "$run_dir/04_validation.md"
    fi
    echo
    echo "## Required Report Format"
    cat <<EOF
# Agent Report

- Agent: $agent
- Provider:
- Model:
- Real execution: yes
- Input files:
- Verdict:
- Summary:
- Findings:
- Required changes:
- Evidence:
EOF
  }
}

extract_verdict() {
  local report_file="$1"
  sed -n 's/^- Verdict:[[:space:]]*//p' "$report_file" | tail -n 1
}

is_real_execution() {
  local report_file="$1"
  grep -Eq '^- Real execution:[[:space:]]*yes[[:space:]]*$' "$report_file"
}

validate_agent_report() {
  local report_file="$1"
  local verdict

  [[ -s "$report_file" ]] || return 1
  grep -q '^- Verdict:' "$report_file" || return 1

  verdict="$(extract_verdict "$report_file")"
  [[ "$verdict" =~ $ALLOWED_VERDICTS_REGEX ]] || return 1
}

run_noop_agent() {
  local run_dir="$1"
  local agent="$2"
  local _prompt_file="$3"
  local output_file="$4"

  write_infrastructure_blocked_report "$output_file" "$agent" "noop" "n/a" "real provider not configured" "no"
}

run_codex_agent() {
  local run_dir="$1"
  local agent="$2"
  local _prompt_file="$3"
  local output_file="$4"

  if ! command -v codex >/dev/null 2>&1; then
    write_infrastructure_blocked_report "$output_file" "$agent" "codex" "n/a" "codex CLI not found" "no"
    return 0
  fi

  write_infrastructure_blocked_report "$output_file" "$agent" "codex" "n/a" "codex CLI found, but Phase 2A does not assume a stable non-interactive invocation syntax; TODO: wire an approved codex exec command" "no"
}

run_gemini_agent() {
  local run_dir="$1"
  local agent="$2"
  local _prompt_file="$3"
  local output_file="$4"

  if ! command -v gemini >/dev/null 2>&1; then
    write_infrastructure_blocked_report "$output_file" "$agent" "gemini" "n/a" "gemini CLI not found" "no"
    return 0
  fi

  write_infrastructure_blocked_report "$output_file" "$agent" "gemini" "n/a" "gemini CLI found, but Phase 2A does not assume a stable non-interactive invocation syntax; TODO: wire an approved gemini command" "no"
}

run_ollama_agent() {
  local run_dir="$1"
  local agent="$2"
  local prompt_file="$3"
  local output_file="$4"
  local model="${MULTIAGENT_OLLAMA_MODEL:-qwen2.5-coder:7b}"
  local prompt_tmp raw_tmp

  if ! command -v ollama >/dev/null 2>&1; then
    write_infrastructure_blocked_report "$output_file" "$agent" "ollama" "$model" "ollama CLI not found" "no"
    return 0
  fi

  ollama list > "$run_dir/ollama-list.txt" 2>&1 || true

  prompt_tmp="$run_dir/${agent}-prompt.txt"
  raw_tmp="$run_dir/${agent}-raw-output.md"
  build_agent_prompt "$run_dir" "$agent" "$prompt_file" > "$prompt_tmp"

  if ! ollama run "$model" < "$prompt_tmp" > "$raw_tmp" 2>&1; then
    write_infrastructure_blocked_report "$output_file" "$agent" "ollama" "$model" "ollama command failed; see ${agent}-raw-output.md" "no"
    return 0
  fi

  if [[ ! -s "$raw_tmp" ]]; then
    write_infrastructure_blocked_report "$output_file" "$agent" "ollama" "$model" "ollama returned empty output" "no"
    return 0
  fi

  cp "$raw_tmp" "$output_file"

  if ! validate_agent_report "$output_file" || ! is_real_execution "$output_file"; then
    write_infrastructure_blocked_report "$output_file" "$agent" "ollama" "$model" "ollama output did not match the required report format or did not mark Real execution: yes; raw output saved to ${agent}-raw-output.md" "no"
  fi
}

run_agent() {
  local run_dir="$1"
  local agent="$2"
  local prompt_file="$3"
  local output_file="$4"
  local provider="${MULTIAGENT_PROVIDER:-noop}"

  case "$provider" in
    noop)
      run_noop_agent "$run_dir" "$agent" "$prompt_file" "$output_file"
      ;;
    codex)
      run_codex_agent "$run_dir" "$agent" "$prompt_file" "$output_file"
      ;;
    gemini)
      run_gemini_agent "$run_dir" "$agent" "$prompt_file" "$output_file"
      ;;
    ollama)
      run_ollama_agent "$run_dir" "$agent" "$prompt_file" "$output_file"
      ;;
    *)
      write_infrastructure_blocked_report "$output_file" "$agent" "$provider" "unknown" "unsupported MULTIAGENT_PROVIDER: $provider" "no"
      ;;
  esac

  if ! validate_agent_report "$output_file"; then
    write_infrastructure_blocked_report "$output_file" "$agent" "$provider" "$(provider_model "$provider")" "agent report is missing, empty, or has an invalid verdict" "no"
  fi
}

aggregate_reports_basic() {
  local run_dir="$1"
  local final_file="$2"
  shift 2
  local reports=("$@")
  local final_verdict="APPROVED"
  local report verdict real
  local missing=()
  local rows=()

  for report in "${reports[@]}"; do
    if [[ ! -s "$report" ]]; then
      missing+=("$report")
      final_verdict="INFRASTRUCTURE BLOCKED"
      continue
    fi

    if ! validate_agent_report "$report"; then
      rows+=("$(basename "$report") | invalid | no")
      final_verdict="INFRASTRUCTURE BLOCKED"
      continue
    fi

    verdict="$(extract_verdict "$report")"
    if is_real_execution "$report"; then
      real="yes"
    else
      real="no"
      final_verdict="INFRASTRUCTURE BLOCKED"
    fi
    rows+=("$(basename "$report") | $verdict | $real")

    if [[ "$final_verdict" == "INFRASTRUCTURE BLOCKED" ]]; then
      continue
    fi

    case "$verdict" in
      INFRASTRUCTURE\ BLOCKED)
        final_verdict="INFRASTRUCTURE BLOCKED"
        ;;
      BLOCKED)
        final_verdict="BLOCKED"
        ;;
      CHANGES\ REQUESTED)
        if [[ "$final_verdict" != "BLOCKED" ]]; then
          final_verdict="CHANGES REQUESTED"
        fi
        ;;
      APPROVED\ WITH\ NOTES)
        if [[ "$final_verdict" == "APPROVED" ]]; then
          final_verdict="APPROVED WITH NOTES"
        fi
        ;;
    esac
  done

  if [[ ! -f "$run_dir/02_git_diff.patch" || ! -f "$run_dir/01_git_status.txt" || ! -f "$run_dir/04_validation.md" ]]; then
    final_verdict="INFRASTRUCTURE BLOCKED"
  fi

  {
    echo "# Final Verdict"
    echo
    echo "- Aggregator: deterministic shell"
    echo "- Provider: ${MULTIAGENT_PROVIDER:-noop}"
    echo "- Verdict: $final_verdict"
    echo "- Mergeable: $(if [[ "$final_verdict" == "APPROVED" || "$final_verdict" == "APPROVED WITH NOTES" ]]; then echo "requires final human approval"; else echo "no"; fi)"
    echo
    echo "## Required Report Status"
    echo
    echo "| Report | Verdict | Real execution |"
    echo "| --- | --- | --- |"
    for row in "${rows[@]}"; do
      echo "| $row |"
    done
    if ((${#missing[@]} > 0)); then
      for report in "${missing[@]}"; do
        echo "| $(basename "$report") | missing | no |"
      done
    fi
    echo
    echo "## Blocking Rules"
    echo
    echo "- Missing required reports, missing diff/status/validation, invalid reports, or Real execution: no produce INFRASTRUCTURE BLOCKED."
    echo "- Any reviewer verdict of CHANGES REQUESTED, BLOCKED, or INFRASTRUCTURE BLOCKED makes the patch non-mergeable."
    echo "- Final human approval is still required before merge."
  } > "$final_file"
}
