# Local Multi-Agent Patch Workflow

SITE LOVE uses a conservative patch workflow: small scoped changes, objective validation, independent review, and final human approval before merge.

## Goal

The goal is to prepare a local/freemium multi-agent workflow where implementation and review are traceable. The repository must not rely on simulated review output, and it must not reintroduce Ruflo as a required workflow tool.

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
- Required reviewer reports are real, separate, and present.
- No required reviewer returned `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`.
- The implementer did not approve their own patch.
- Final human review approves the merge.

If lint or build cannot run, or if they fail, the result must be documented and the patch cannot receive `PASS`.

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

Provider selection is controlled by:

```bash
MULTIAGENT_PROVIDER=noop
```

If `MULTIAGENT_PROVIDER` is unset, the workflow uses `noop`.

Supported provider names:

- `noop`: default safe provider. It does not call an LLM and always writes `Real execution: no` with `INFRASTRUCTURE BLOCKED`.
- `codex`: Codex CLI reviewer provider. Phase 2B runs reviewers through `codex exec` when the CLI is installed and configured.
- `gemini`: nominal hook for future Gemini CLI execution. The script checks for the `gemini` command, but Phase 2A does not assume a stable non-interactive invocation syntax. Until an approved command is wired, it remains `INFRASTRUCTURE BLOCKED`.
- `ollama`: experimental optional local model hook. It uses `MULTIAGENT_OLLAMA_MODEL` or defaults to `qwen2.5-coder:7b`, checks for the `ollama` command, and sends the agent prompt plus run context through `ollama run`. It is not the recommended primary provider on 8 GB Intel Macs.

Phase 2A keeps `local-review` conservative:

- It writes `00_context.md`, git status, full `git diff HEAD`, full `git diff --stat HEAD`, and validation output.
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

## Phase 2B: Codex Real Reviewer Execution

Phase 2B makes Codex the first real reviewer provider:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

The script:

- Captures context, git status, full `git diff HEAD`, full `git diff --stat HEAD`, and validation output.
- Builds a dedicated prompt for each minimum reviewer.
- Calls `codex exec` non-interactively in read-only sandbox mode for `review-code` and `review-qa-regression`.
- Saves separate stdout/stderr diagnostics per reviewer.
- Uses Codex's final-message output file as the agent report, avoiding CLI transcript noise in report validation.
- Validates each report before aggregation.
- Keeps aggregation deterministic in shell.

Supported Phase 2B variables:

- `MULTIAGENT_PROVIDER=codex`
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

For newly added files, prefer staging intended additions before review so `git diff HEAD` includes them as normal patch content. Remaining untracked text files are captured separately in `05_untracked_files.md`.

`noop` remains the default safe provider and can never approve. Gemini remains a nominal hook. Ollama remains experimental and optional; it is not the primary provider for this hardware profile.

Patch implementation automation is still disabled in Phase 2B. OpenClaw is excluded from this phase.

## Phase 2C: Additional Provider Integration

A future phase may connect additional providers, specialized reviewer selection, or executor automation. That integration must write separate reports per agent and preserve the same verdict rules.

## Phase 3: Optional OpenClaw Layer

OpenClaw may be evaluated later as an optional orchestration layer. It must not become required unless explicitly approved, and it must not replace real separate reviewer output with simulated aggregation.

## Prohibited

- Do not reintroduce Ruflo as a required workflow tool.
- Do not present simulated multi-agent output as independent review.
- Do not add orchestration dependencies to `dependencies` or `devDependencies` without explicit approval.
- Do not require AI tooling for `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, or deployment.
