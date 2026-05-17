#!/usr/bin/env bash
set -euo pipefail

ALLOWED_VERDICTS_REGEX='^(PASS|PASS WITH NOTES|CHANGES REQUESTED|BLOCKED|INFRASTRUCTURE BLOCKED)$'
DEFAULT_MAX_DIFF_CHARS=60000
DEFAULT_AGENT_TIMEOUT_SECONDS=180

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
  local untracked_files

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

  git status --short --untracked-files=all | grep -v '^?? \.agent/reports/' > "$run_dir/01_git_status.txt" || true
  git diff HEAD > "$run_dir/02_git_diff.patch"
  git diff --stat HEAD > "$run_dir/03_git_diff_stat.txt"

  untracked_files="$(git ls-files --others --exclude-standard | grep -v '^.agent/reports/' || true)"
  if [[ -n "$untracked_files" ]]; then
    {
      echo "# Untracked Files Context"
      echo
      echo "Generated report directories under .agent/reports/ are intentionally excluded."
      echo
      while IFS= read -r file; do
        [[ -n "$file" ]] || continue
        if [[ "$file" == .env || "$file" == .env.* ]]; then
          echo "## $file"
          echo
          echo "[SKIPPED: environment file contents are never captured.]"
          echo
          continue
        fi
        if [[ ! -f "$file" ]]; then
          continue
        fi
        echo "## $file"
        echo
        if LC_ALL=C grep -Iq . "$file"; then
          echo '```'
          truncate_file_for_prompt "$file" 20000
          echo '```'
        else
          echo "[SKIPPED: binary or non-text file.]"
        fi
        echo
      done <<< "$untracked_files"
    } > "$run_dir/05_untracked_files.md"
  fi
}

truncate_file_for_prompt() {
  local input_file="$1"
  local max_chars="${2:-$DEFAULT_MAX_DIFF_CHARS}"

  if [[ ! -f "$input_file" ]]; then
    return 0
  fi

  local char_count
  char_count="$(wc -c < "$input_file" | tr -d ' ')"
  if [[ "$char_count" -le "$max_chars" ]]; then
    cat "$input_file"
  else
    head -c "$max_chars" "$input_file"
    echo
    echo
    echo "[TRUNCATED: original file had $char_count bytes; prompt included first $max_chars bytes.]"
  fi
}

run_validation_commands() {
  local run_dir="$1"
  local status=0

  {
    echo "# Validation"
    echo
    echo "## git diff --check"
    if git diff --check && git diff --cached --check; then
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
    codex)
      printf '%s\n' "${MULTIAGENT_CODEX_MODEL:-codex-config-default}"
      ;;
    ollama)
      printf '%s\n' "${MULTIAGENT_OLLAMA_MODEL:-qwen2.5-coder:7b}"
      ;;
    gemini | noop)
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
- Input files: 00_context.md, 01_git_status.txt, 02_git_diff.patch, 03_git_diff_stat.txt, 04_validation.md, 05_untracked_files.md if present
- Verdict: INFRASTRUCTURE BLOCKED

## Summary

The workflow could not produce a valid independent reviewer report.

## Findings

- $reason

## Required changes

- Configure a real provider and rerun the workflow.

## Evidence

- $reason
EOF
}

build_agent_prompt() {
  local run_dir="$1"
  local agent="$2"
  local prompt_file="$3"
  local provider="${4:-${MULTIAGENT_PROVIDER:-noop}}"
  local model="${5:-$(provider_model "$provider")}"
  local max_diff_chars="${MULTIAGENT_MAX_DIFF_CHARS:-$DEFAULT_MAX_DIFF_CHARS}"

  {
    echo "# SITE LOVE Agent Execution"
    echo
    echo "You are running as a real independent reviewer for SITE LOVE."
    echo "Review only the supplied context. Do not edit files. Do not approve unless the supplied diff, status, and validation support approval."
    echo "Return only the markdown report. Do not wrap it in code fences. Do not include analysis before or after the report."
    echo "Your first line must be exactly: # Agent Report"
    echo "The report must include exactly one valid Verdict line using: PASS, PASS WITH NOTES, CHANGES REQUESTED, BLOCKED, or INFRASTRUCTURE BLOCKED."
    echo "Do not use APPROVED or APPROVED WITH NOTES; those are obsolete verdict labels for this workflow."
    echo "Do not put a bare verdict on the final line. The verdict must appear only as '- Verdict: <allowed verdict>'."
    echo "Use 'Real execution: yes' because you are actually reviewing the supplied inputs as this agent."
    echo "If required inputs are missing, unclear, truncated in a way that prevents review, or validation is missing/failing, use INFRASTRUCTURE BLOCKED or CHANGES REQUESTED as appropriate."
    echo
    echo "## Agent Prompt"
    cat "$prompt_file"
    echo
    echo "The required report format at the end of this prompt supersedes any older output format described in the agent prompt above."
    echo "You must include the exact markdown headings: ## Summary, ## Findings, ## Required changes, and ## Evidence."
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
    truncate_file_for_prompt "$run_dir/02_git_diff.patch" "$max_diff_chars"
    if [[ -f "$run_dir/04_validation.md" ]]; then
      echo
      echo "## Validation Output"
      cat "$run_dir/04_validation.md"
    fi
    if [[ -f "$run_dir/05_untracked_files.md" ]]; then
      echo
      echo "## Untracked Files Context"
      cat "$run_dir/05_untracked_files.md"
    fi
    echo
    echo "## Required Report Format"
    echo
    echo "Copy this template exactly. Replace only the text after '- Verdict:' and the body text under each required section."
    cat <<EOF
# Agent Report

- Agent: $agent
- Provider: $provider
- Model: $model
- Real execution: yes
- Input files: 00_context.md, 01_git_status.txt, 02_git_diff.patch, 03_git_diff_stat.txt, 04_validation.md, 05_untracked_files.md if present
- Verdict: PASS | PASS WITH NOTES | CHANGES REQUESTED | BLOCKED | INFRASTRUCTURE BLOCKED

## Summary

## Findings

## Required changes

## Evidence
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
  local verdict_count

  [[ -s "$report_file" ]] || return 1
  head -n 1 "$report_file" | grep -qx '# Agent Report' || return 1
  grep -q '^- Agent:[[:space:]]*[^[:space:]]' "$report_file" || return 1
  grep -q '^- Provider:[[:space:]]*[^[:space:]]' "$report_file" || return 1
  grep -q '^- Model:[[:space:]]*[^[:space:]]' "$report_file" || return 1
  grep -Eq '^- Real execution:[[:space:]]*(yes|no)[[:space:]]*$' "$report_file" || return 1
  grep -q '^- Input files:[[:space:]]*[^[:space:]]' "$report_file" || return 1
  grep -q '^- Verdict:[[:space:]]*[^[:space:]]' "$report_file" || return 1
  verdict_count="$(grep -Ec '^- Verdict:' "$report_file" || true)"
  [[ "$verdict_count" -eq 1 ]] || return 1
  grep -q '^## Summary[[:space:]]*$' "$report_file" || return 1
  grep -q '^## Findings[[:space:]]*$' "$report_file" || return 1
  grep -q '^## Required changes[[:space:]]*$' "$report_file" || return 1
  grep -q '^## Evidence[[:space:]]*$' "$report_file" || return 1

  verdict="$(extract_verdict "$report_file")"
  [[ "$verdict" =~ $ALLOWED_VERDICTS_REGEX ]] || return 1
}

agent_report_validation_errors() {
  local report_file="$1"
  local verdict verdict_count errors=""

  if [[ ! -s "$report_file" ]]; then
    printf '%s\n' "report file is missing or empty"
    return 0
  fi

  head -n 1 "$report_file" | grep -qx '# Agent Report' || errors="${errors}; first line is not exactly '# Agent Report'"
  grep -q '^- Agent:[[:space:]]*[^[:space:]]' "$report_file" || errors="${errors}; missing non-empty '- Agent:' field"
  grep -q '^- Provider:[[:space:]]*[^[:space:]]' "$report_file" || errors="${errors}; missing non-empty '- Provider:' field"
  grep -q '^- Model:[[:space:]]*[^[:space:]]' "$report_file" || errors="${errors}; missing non-empty '- Model:' field"
  grep -Eq '^- Real execution:[[:space:]]*(yes|no)[[:space:]]*$' "$report_file" || errors="${errors}; missing '- Real execution: yes|no' field"
  grep -q '^- Input files:[[:space:]]*[^[:space:]]' "$report_file" || errors="${errors}; missing non-empty '- Input files:' field"
  grep -q '^- Verdict:[[:space:]]*[^[:space:]]' "$report_file" || errors="${errors}; missing non-empty '- Verdict:' field"
  verdict_count="$(grep -Ec '^- Verdict:' "$report_file" || true)"
  [[ "$verdict_count" -eq 1 ]] || errors="${errors}; expected exactly one '- Verdict:' field, found $verdict_count"
  grep -q '^## Summary[[:space:]]*$' "$report_file" || errors="${errors}; missing '## Summary' section"
  grep -q '^## Findings[[:space:]]*$' "$report_file" || errors="${errors}; missing '## Findings' section"
  grep -q '^## Required changes[[:space:]]*$' "$report_file" || errors="${errors}; missing '## Required changes' section"
  grep -q '^## Evidence[[:space:]]*$' "$report_file" || errors="${errors}; missing '## Evidence' section"

  verdict="$(extract_verdict "$report_file")"
  if [[ -n "$verdict" && ! "$verdict" =~ $ALLOWED_VERDICTS_REGEX ]]; then
    errors="${errors}; invalid verdict '$verdict' (allowed: PASS, PASS WITH NOTES, CHANGES REQUESTED, BLOCKED, INFRASTRUCTURE BLOCKED)"
  fi

  if [[ -z "$errors" ]]; then
    printf '%s\n' "unknown validation failure"
  else
    printf '%s\n' "${errors#; }"
  fi
}

validate_real_agent_report() {
  local report_file="$1"

  validate_agent_report "$report_file" || return 1
  is_real_execution "$report_file" || return 1
}

run_command_with_timeout() {
  local timeout_seconds="$1"
  local stdout_file="$2"
  local stderr_file="$3"
  local diag_file="$4"
  local stdin_file="$5"
  shift 5
  local timeout_bin=""
  local command_pid exit_code elapsed

  if command -v timeout >/dev/null 2>&1; then
    timeout_bin="timeout"
  elif command -v gtimeout >/dev/null 2>&1; then
    timeout_bin="gtimeout"
  fi

  if [[ -n "$timeout_bin" ]]; then
    if "$timeout_bin" "$timeout_seconds" "$@" < "$stdin_file" > "$stdout_file" 2> "$stderr_file"; then
      return 0
    fi
    return $?
  fi

  {
    echo
    echo "External timeout command not available; using portable bash timeout."
  } >> "$diag_file"

  "$@" < "$stdin_file" > "$stdout_file" 2> "$stderr_file" &
  command_pid=$!
  elapsed=0

  while kill -0 "$command_pid" 2>/dev/null; do
    if [[ "$elapsed" -ge "$timeout_seconds" ]]; then
      echo "Command timed out after ${timeout_seconds}s; terminating process ${command_pid}." >> "$diag_file"
      kill "$command_pid" 2>/dev/null || true

      local grace_elapsed=0
      while kill -0 "$command_pid" 2>/dev/null && [[ "$grace_elapsed" -lt 2 ]]; do
        sleep 1
        grace_elapsed=$((grace_elapsed + 1))
      done

      if kill -0 "$command_pid" 2>/dev/null; then
        kill -9 "$command_pid" 2>/dev/null || true
        sleep 1
      fi

      if kill -0 "$command_pid" 2>/dev/null; then
        echo "Process ${command_pid} did not exit after SIGKILL; returning timeout without blocking." >> "$diag_file"
      else
        set +e
        wait "$command_pid" 2>/dev/null
        set -e
      fi
      return 124
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  set +e
  wait "$command_pid"
  exit_code=$?
  set -e

  return "$exit_code"
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
  local prompt_file="$3"
  local output_file="$4"
  local model
  local prompt_tmp raw_tmp transcript_tmp stderr_tmp diag_tmp exit_tmp validation_reason
  local timeout_seconds="${MULTIAGENT_AGENT_TIMEOUT_SECONDS:-$DEFAULT_AGENT_TIMEOUT_SECONDS}"
  local exit_code=0
  local -a codex_cmd

  if ! command -v codex >/dev/null 2>&1; then
    write_infrastructure_blocked_report "$output_file" "$agent" "codex" "n/a" "codex CLI not found" "no"
    return 0
  fi

  model="$(provider_model codex)"
  prompt_tmp="$run_dir/${agent}-codex-prompt.md"
  raw_tmp="$run_dir/${agent}-codex-stdout.md"
  transcript_tmp="$run_dir/${agent}-codex-transcript.txt"
  stderr_tmp="$run_dir/${agent}-codex-stderr.md"
  diag_tmp="$run_dir/${agent}-codex-diagnostics.md"
  exit_tmp="$run_dir/${agent}-codex-exit-code.txt"

  build_agent_prompt "$run_dir" "$agent" "$prompt_file" "codex" "$model" > "$prompt_tmp"
  : > "$raw_tmp"

  codex_cmd=(codex exec --color never --sandbox read-only --output-last-message "$raw_tmp")
  if [[ -n "${MULTIAGENT_CODEX_ARGS:-}" ]]; then
    # shellcheck disable=SC2206
    codex_cmd+=(${MULTIAGENT_CODEX_ARGS})
  fi
  codex_cmd+=("-")

  {
    echo "# Codex Diagnostics"
    echo
    echo "- Agent: $agent"
    echo "- Provider: codex"
    echo "- Model: $model"
    echo "- Timeout seconds: $timeout_seconds"
    echo "- Prompt file: $(basename "$prompt_tmp")"
    echo "- Output last message file: $(basename "$raw_tmp")"
    echo "- Transcript file: $(basename "$transcript_tmp")"
    echo "- Stderr file: $(basename "$stderr_tmp")"
    echo "- Environment: full environment intentionally not recorded."
  } > "$diag_tmp"

  if run_command_with_timeout "$timeout_seconds" "$transcript_tmp" "$stderr_tmp" "$diag_tmp" "$prompt_tmp" "${codex_cmd[@]}"; then
    exit_code=0
  else
    exit_code=$?
  fi
  printf '%s\n' "$exit_code" > "$exit_tmp"

  if [[ "$exit_code" -ne 0 ]]; then
    write_infrastructure_blocked_report "$output_file" "$agent" "codex" "$model" "codex exec failed with exit code $exit_code; raw output saved to $(basename "$raw_tmp"); raw stderr saved to $(basename "$stderr_tmp"); see $(basename "$diag_tmp")" "no"
    return 0
  fi

  if [[ ! -s "$raw_tmp" ]]; then
    write_infrastructure_blocked_report "$output_file" "$agent" "codex" "$model" "codex exec returned empty output" "no"
    return 0
  fi

  cp "$raw_tmp" "$output_file"

  if ! validate_real_agent_report "$output_file"; then
    validation_reason="$(agent_report_validation_errors "$output_file")"
    if validate_agent_report "$output_file" && ! is_real_execution "$output_file"; then
      validation_reason="report did not contain 'Real execution: yes'"
    fi
    write_infrastructure_blocked_report "$output_file" "$agent" "codex" "$model" "codex output was invalid: ${validation_reason}; raw output saved to $(basename "$raw_tmp"); raw stderr saved to $(basename "$stderr_tmp")" "no"
  fi
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

  if ! validate_real_agent_report "$output_file"; then
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
  local final_verdict="PASS"
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
      PASS\ WITH\ NOTES)
        if [[ "$final_verdict" == "PASS" ]]; then
          final_verdict="PASS WITH NOTES"
        fi
        ;;
    esac
  done

  if [[ ! -f "$run_dir/00_context.md" || ! -f "$run_dir/01_git_status.txt" || ! -f "$run_dir/02_git_diff.patch" || ! -f "$run_dir/03_git_diff_stat.txt" || ! -f "$run_dir/04_validation.md" ]]; then
    final_verdict="INFRASTRUCTURE BLOCKED"
  fi

  if [[ -f "$run_dir/04_validation.md" ]] && grep -q 'Result: fail' "$run_dir/04_validation.md"; then
    final_verdict="INFRASTRUCTURE BLOCKED"
  fi

  {
    echo "# Final Verdict"
    echo
    echo "- Aggregator: deterministic shell"
    echo "- Provider: ${MULTIAGENT_PROVIDER:-noop}"
    echo "- Verdict: $final_verdict"
    echo "- Mergeable: $(if [[ "$final_verdict" == "PASS" || "$final_verdict" == "PASS WITH NOTES" ]]; then echo "requires final human approval"; else echo "no"; fi)"
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
