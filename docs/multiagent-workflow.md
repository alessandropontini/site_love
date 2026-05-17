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

## Phase 2: Real Provider Integration

A future phase may connect a real executor/reviewer provider such as `codex exec`, a local model CLI, Gemini CLI, or Ollama. That integration must write separate reports per agent and preserve the same verdict rules.

## Phase 3: Optional OpenClaw Layer

OpenClaw may be evaluated later as an optional orchestration layer. It must not become required unless explicitly approved, and it must not replace real separate reviewer output with simulated aggregation.

## Prohibited

- Do not reintroduce Ruflo as a required workflow tool.
- Do not present simulated multi-agent output as independent review.
- Do not add orchestration dependencies to `dependencies` or `devDependencies` without explicit approval.
- Do not require AI tooling for `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, or deployment.
