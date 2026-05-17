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

- `APPROVED`
- `APPROVED WITH NOTES`
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

If lint or build cannot run, or if they fail, the result must be documented and the patch cannot receive a clean approval.

## Infrastructure Blocked

`INFRASTRUCTURE BLOCKED` means the workflow infrastructure is not capable of producing a real approval. Use it when:

- Real independent agent reports are missing.
- A placeholder or simulated review is present instead of a real report.
- The diff is unavailable.
- Lint/build output is unavailable.
- Required reviewer coverage is missing.

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
- `codex`: nominal hook for future Codex CLI execution. The script checks for the `codex` command, but Phase 2A does not assume a stable non-interactive invocation syntax. Until an approved command is wired, it remains `INFRASTRUCTURE BLOCKED`.
- `gemini`: nominal hook for future Gemini CLI execution. The script checks for the `gemini` command, but Phase 2A does not assume a stable non-interactive invocation syntax. Until an approved command is wired, it remains `INFRASTRUCTURE BLOCKED`.
- `ollama`: optional local model hook. It uses `MULTIAGENT_OLLAMA_MODEL` or defaults to `qwen2.5-coder:7b`, checks for the `ollama` command, and sends the agent prompt plus run context through `ollama run`.

Phase 2A keeps `local-review` conservative:

- It writes `00_context.md`, git status, git diff, git diff stat, and validation output.
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
- Summary:
- Findings:
- Required changes:
- Evidence:
```

The deterministic aggregator treats a report as real only when it exists, is non-empty, contains a valid `Verdict:`, and says `Real execution: yes`. `Real execution: no` always blocks approval.

Expect `INFRASTRUCTURE BLOCKED` when:

- The provider is `noop`.
- A provider CLI is missing.
- A provider hook is not yet wired to a confirmed non-interactive command.
- A provider command fails or returns empty output.
- A provider returns output that does not match the report format.
- Required reports, diff/status files, or validation output are missing.

## Phase 2B: Real Provider Integration

A future phase may connect a real executor/reviewer provider such as `codex exec`, a local model CLI, Gemini CLI, or Ollama. That integration must write separate reports per agent and preserve the same verdict rules.

## Phase 3: Optional OpenClaw Layer

OpenClaw may be evaluated later as an optional orchestration layer. It must not become required unless explicitly approved, and it must not replace real separate reviewer output with simulated aggregation.

## Prohibited

- Do not reintroduce Ruflo as a required workflow tool.
- Do not present simulated multi-agent output as independent review.
- Do not add orchestration dependencies to `dependencies` or `devDependencies` without explicit approval.
- Do not require AI tooling for `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, or deployment.
