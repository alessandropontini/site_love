# Local Multi-Agent Patch Workflow

SITE LOVE uses a conservative patch workflow: small scoped changes, objective validation, independent review, and final human approval before merge.

## Goal

The goal is to prepare a local/freemium multi-agent workflow where implementation and review are traceable. The repository must not rely on simulated review output, and it must not reintroduce Ruflo as a required workflow tool.

OpenClaw is evaluated in Phase 5 as an optional orchestration layer above the existing workflow. It can coordinate reviewer roles and documented commands, but Codex remains the active real provider and this document remains the merge policy source of truth.

## Implementer vs Reviewer

The implementer applies the requested patch and writes an implementer report. The implementer cannot approve the patch.

Reviewers are independent agents with separate prompts and separate report files. A combined response that pretends to be multiple reviewers is not acceptable.

## Minimum Required Reviewers

Every patch requires at least:

- Code Review Agent.
- QA / Regression Agent.

## Additional Required Reviewers

Use additional reviewers when the patch touches their area:

- Frontend Architect Agent for React, Next.js routing, state, components, scrollytelling, or architecture.
- UX / Accessibility Agent for UI, copy, interactions, mobile, focus, keyboard, semantics, or ARIA.
- Performance Agent for rendering, animation, scroll, bundle, images, or performance-sensitive paths.
- Git / Workflow Reviewer for scripts, CI, operational docs, package files, AI workflow, or `AGENTS.md`.

## Allowed Verdicts

Each reviewer and the aggregator must end with exactly one verdict:

- `PASS`
- `PASS WITH NOTES`
- `CHANGES REQUESTED`
- `BLOCKED`
- `INFRASTRUCTURE BLOCKED`

## Merge Conditions

A patch is mergeable only when:

- The diff is available.
- Required validation was run: `git diff --check`, `npm run lint`, and `npm run build`.
- Required reviewer reports are real, separate, present, and generated with `Provider: codex` plus `Real execution: yes`.
- No required reviewer returned `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`.
- Any `PASS WITH NOTES` findings were resolved or explicitly accepted.
- The implementer did not approve their own patch.
- Final human review approves the merge.

`PASS` and `PASS WITH NOTES` do not authorize automatic merge. If lint or build cannot run, or if they fail, the result must be documented and the patch cannot receive `PASS`.

## Infrastructure Blocked

`INFRASTRUCTURE BLOCKED` means the workflow infrastructure is not capable of producing a real approval. Use it when:

- Real independent agent reports are missing.
- A placeholder or simulated review is present instead of a real report.
- The diff is unavailable.
- Lint/build output is unavailable.
- Required reviewer coverage is missing.
- A reviewer report is missing required fields, uses an invalid verdict, or omits `Real execution: yes`.

This verdict is not a code-quality judgment. It means the patch is not mergeable through the multi-agent workflow yet.

## Phase 1: Current State

Phase 1 is infrastructure/documentation only. It adds:

- Separate agent prompt files in `.agent/prompts/`.
- Report storage under `.agent/reports/`.
- Safe placeholder scripts in `scripts/`.
- Policy documentation for independent review and verdict handling.

Phase 1 does not execute real providers, does not configure Ollama, does not implement OpenClaw, and does not approve patches.

## Phase 2A: Provider Execution Hooks

Phase 2A adds a small provider abstraction for real reviewer execution hooks without adding npm or Python dependencies.

Provider selection is controlled by `MULTIAGENT_PROVIDER`. If it is unset, the workflow uses `noop` and cannot approve.

Supported provider names:

- `noop`: smoke-test provider only. It does not call an LLM and always writes `Real execution: no` with `INFRASTRUCTURE BLOCKED`; it must never count as review.
- `codex`: only active real reviewer provider. It runs reviewers through `codex exec` when the CLI is installed and configured.
- `gemini`: nominal hook for future Gemini CLI execution. The script checks for the `gemini` command, but Phase 2A does not assume a stable non-interactive invocation syntax. Until an approved command is wired, it remains `INFRASTRUCTURE BLOCKED`.
- `ollama`: experimental optional local model hook. It uses `MULTIAGENT_OLLAMA_MODEL` or defaults to `qwen2.5-coder:7b`, checks for the `ollama` command, and sends the agent prompt plus run context through `ollama run`. It is not the recommended primary provider on 8 GB Intel Macs.

Phase 2A keeps `local-review` conservative:

- It writes `00_context.md`, git status, review scope, touched files, full diff, diff stat, and validation output.
- It runs the minimum required reviewers: Code Review and QA / Regression.
- It saves separate reports as `10_review-code.md` and `11_review-qa-regression.md`.
- It writes `99_final-verdict.md` using deterministic shell aggregation.
- It does not run OpenClaw.
- It does not install dependencies.
- It does not expose full environment variables or secrets in reports.

Every agent report must include:

```markdown
# Agent Report

- Agent:
- Provider:
- Model:
- Real execution: yes/no
- Input files:
- Verdict:

## Summary

## Findings

## Required changes

## Evidence
```

The deterministic aggregator treats a report as real only when it exists, is non-empty, contains a valid `Verdict:`, and says `Real execution: yes`. `Real execution: no` always blocks approval.

Expect `INFRASTRUCTURE BLOCKED` when:

- The provider is `noop`.
- A provider CLI is missing.
- A provider hook is not yet wired to a confirmed non-interactive command.
- A provider command fails or returns empty output.
- A provider returns output that does not match the report format.
- Required reports, diff/status files, or validation output are missing.
- The selected review scope is invalid or produces an empty diff.

## Phase 2B: Codex Real Reviewer Execution

Phase 2B makes Codex the first real reviewer provider:

```bash
npm run lint
npm run build
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
RUN_DIR="$(ls -td .agent/reports/* | head -1)"
cat "$RUN_DIR/99_final-verdict.md"
```

The script:

- Captures context, git status, review scope, touched files, full diff, diff stat, and validation output.
- Builds a dedicated prompt for each minimum reviewer.
- Calls `codex exec` non-interactively in read-only sandbox mode for `review-code` and `review-qa-regression`.
- Saves separate stdout/stderr diagnostics per reviewer.
- Uses Codex's final-message output file as the agent report, avoiding CLI transcript noise in report validation.
- Validates each report before aggregation.
- Keeps aggregation deterministic in shell.

`local-review` supports three review modes:

- `working-tree`: used when `REVIEW_BASE` and `REVIEW_HEAD` are unset and the working tree has staged or unstaged changes. The context captures `git status --short`, staged and unstaged tracked diffs, relevant untracked text files, diff stat, and touched files.
- `committed-range`: used when `REVIEW_BASE` and `REVIEW_HEAD` are unset and the working tree is clean. The context falls back to `HEAD~1..HEAD` and captures `git diff --stat HEAD~1 HEAD`, `git diff HEAD~1 HEAD`, and `git diff --name-only HEAD~1 HEAD`.
- `explicit-range`: used when both `REVIEW_BASE` and `REVIEW_HEAD` are set. The context captures `git diff --stat "$REVIEW_BASE" "$REVIEW_HEAD"`, `git diff "$REVIEW_BASE" "$REVIEW_HEAD"`, and `git diff --name-only "$REVIEW_BASE" "$REVIEW_HEAD"`.

Use explicit ranges when the patch has already been committed and spans more than the last commit:

```bash
REVIEW_BASE=HEAD~2 REVIEW_HEAD=HEAD MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

If only one of `REVIEW_BASE` or `REVIEW_HEAD` is set, the range does not resolve, or the selected diff is empty, the workflow records the scope failure and the deterministic final verdict is `INFRASTRUCTURE BLOCKED`.

Supported Phase 2B variables:

- `MULTIAGENT_PROVIDER=codex`
- `REVIEW_BASE` and `REVIEW_HEAD` for explicit committed-range review.
- `MULTIAGENT_AGENT_TIMEOUT_SECONDS=180`
- `MULTIAGENT_MAX_DIFF_CHARS=60000`
- `MULTIAGENT_CODEX_ARGS` for explicit extra `codex exec` arguments supported by the local CLI.
- `MULTIAGENT_CODEX_MODEL` for report metadata; pass a model flag via `MULTIAGENT_CODEX_ARGS` only when the local CLI supports it.

The script uses `timeout` or `gtimeout` when available. If neither command is available, it uses a portable bash timeout fallback that starts the provider process in the background, monitors it, terminates it after `MULTIAGENT_AGENT_TIMEOUT_SECONDS`, and returns exit code `124` on timeout.

Codex reports are accepted only when they contain:

- `# Agent Report`
- `- Agent: <agent-name>`
- `- Provider: codex`
- `- Model: <model-or-codex-config-default>`
- `- Real execution: yes`
- `- Input files: ...`
- `- Verdict:` with `PASS`, `PASS WITH NOTES`, `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`
- `## Summary`
- `## Findings`
- `## Required changes`
- `## Evidence`

If Codex is missing, not configured, fails, returns empty output, times out, returns `Real execution: no`, or returns an invalid report, that reviewer report is replaced with `INFRASTRUCTURE BLOCKED`. The fallback report must explain the exact validation failure and point to raw files in the same run directory.

For Codex runs, raw diagnostics live under `.agent/reports/<run-id>/`:

- `<agent>-codex-stdout.md`: Codex final-message output used as the raw reviewer report.
- `<agent>-codex-stderr.md`: raw stderr from `codex exec`.
- `<agent>-codex-transcript.txt`: CLI stdout transcript.
- `<agent>-codex-diagnostics.md`: command metadata without secrets.
- `<agent>-codex-exit-code.txt`: process exit code.

For newly added files in working-tree mode, prefer staging intended additions before review so they appear as normal patch content. Remaining untracked text files are still captured separately in `05_untracked_files.md`, included in touched files, and represented in the generated diff context when safe.

`noop` remains the default safe provider and can never approve. Gemini remains a nominal hook. Ollama remains experimental and optional; it is not the primary provider for this hardware profile.

Patch implementation automation is still disabled in Phase 2B. OpenClaw is excluded from this phase.

## Phase 2C: Local Workflow Smoke Tests

Phase 2C adds a repeatable local smoke/regression check for the shell workflow:

```bash
./scripts/test-multiagent-workflow.sh
```

The smoke script creates a temporary detached Git worktree from `HEAD` and runs `local-review` with `MULTIAGENT_PROVIDER=noop`. It does not push, merge, use secrets, delete existing `.agent/reports` directories, or modify application code.

The smoke coverage checks:

- `explicit-range` with `REVIEW_BASE=HEAD~1 REVIEW_HEAD=HEAD`.
- `committed-range` fallback with a clean temporary worktree.
- `working-tree` detection using a temporary untracked fixture under `.agent/tmp/` inside the temporary worktree.
- Non-empty diff and diff stat files.
- Valid review scope metadata.
- Deterministic `INFRASTRUCTURE BLOCKED` final verdicts for `noop`, because `noop` reports `Real execution: no`.

`INFRASTRUCTURE BLOCKED` is the expected smoke-test verdict for `noop`; it proves the validator and aggregator still reject non-real reviewer output. These smoke tests do not replace a real Codex review with `MULTIAGENT_PROVIDER=codex`.

When `scripts/test-multiagent-workflow.sh` is present and executable, `local-review` includes it in `04_validation.md` after `npm run build`. The smoke script sets `MULTIAGENT_SKIP_WORKFLOW_SMOKE=1` for its nested `local-review` runs so validation output records the smoke coverage without recursive smoke execution.

## Phase 5: OpenClaw Orchestration Spike

Phase 5 documents and safely scaffolds OpenClaw as an optional orchestrator above Codex. The scope is workflow documentation, `.openclaw/` templates, and a safe wrapper script. It does not refactor application code, change React components, add dependencies, push, merge, or make OpenClaw mandatory.

OpenClaw's role is orchestration:

- Coordinate the approved reviewer roles.
- Use the same prompt mapping described in `.openclaw/agents.md`.
- Preserve `scripts/local-review.sh` as the validated execution and aggregation path.
- Preserve report output under `.agent/reports/<run-id>/`.
- Fall back to Codex-backed local review when OpenClaw is unavailable or not yet wired.

Codex's role remains real execution/provider:

- Valid reviewer reports require `Provider: codex`.
- Valid reviewer reports require `Real execution: yes`.
- Missing, invalid, simulated, or non-real reports produce `INFRASTRUCTURE BLOCKED`.

Spike command:

```bash
./scripts/openclaw-orchestrate.sh
```

Validated fallback command:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

Infrastructure smoke command:

```bash
MULTIAGENT_PROVIDER=noop ./scripts/local-review.sh
```

Success criterion: OpenClaw usage is documented, the wrapper fails safely when the CLI is unavailable or not wired, and the existing Codex report contract remains unchanged.

Blocking criterion: OpenClaw output is simulated, validation is skipped, `.agent/reports/<run-id>/` is not preserved, real Codex-backed reviewer execution is missing, or any required report is invalid. The correct verdict is then `BLOCKED` or `INFRASTRUCTURE BLOCKED`.

Next step after the spike: verify a concrete non-interactive OpenClaw CLI invocation before wiring it to execute the fallback workflow. Until then, OpenClaw remains optional and experimental. See `docs/openclaw-orchestration.md`.

## Future Provider Integration

A future phase may connect additional providers, specialized reviewer selection, OpenClaw orchestration, or executor automation. That integration must write separate reports per agent and preserve the same verdict rules.

## Prohibited

- Do not reintroduce Ruflo as a required workflow tool.
- Do not present simulated multi-agent output as independent review.
- Do not add orchestration dependencies to `dependencies` or `devDependencies` without explicit approval.
- Do not require AI tooling for `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, or deployment.
