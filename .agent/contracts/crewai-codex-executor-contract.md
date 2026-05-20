# CrewAI + Codex Executor Contract

## 1. Purpose

This contract defines the safe boundary between CrewAI and Codex for SITE LOVE workflow experiments.

- CrewAI coordinates roles, task order, and request preparation.
- Codex executes repository work such as reading files, applying scoped patches, running commands, and preparing evidence.
- Policy scripts validate contracts, reports, canonical verdicts, diff evidence, lint, build, and review status.
- Human approval remains required for merge and promotion decisions.

CrewAI is a candidate orchestrator. Codex remains the operational executor. This contract does not connect CrewAI to the merge gate and does not authorize CrewAI to modify the repository directly.

## 2. Layer Boundaries

### CrewAI may

- Coordinate implementation, review, and aggregation lanes.
- Read stable workflow documentation and task definitions.
- Generate an Executor Request for Codex.
- Summarize non-authoritative orchestration output.
- Point to existing validation and review commands.
- Store orchestration reports under `.agent/reports/<timestamp>/` when a script explicitly does so.

### CrewAI must not

- Modify repository files directly.
- Run patch, commit, push, merge, force-push, or branch-delete operations.
- Replace `scripts/local-review.sh`.
- Become the only source of merge truth.
- Mark simulated output as real execution or real review.
- Bypass policy scripts, report validation, lint, build, or human approval.
- Edit secrets, environment files, deployment files, app runtime code, or package files.

### Codex may

- Read repository context and inspect files.
- Propose a patch plan.
- Apply a scoped patch after an explicit task grants repository writes.
- Run allowed validation commands.
- Summarize diffs and command results.
- Generate implementation, validation, and executor response reports.
- Perform Git operations only when the task explicitly allows them.

### Codex must not without explicit consent

- Change scope beyond the request.
- Modify protected files or directories.
- Edit secrets, credentials, `.env`, `.env.*`, or deployment-specific files.
- Install global dependencies.
- Change `package.json` or `package-lock.json`.
- Commit, push, merge, delete branches, or force push.
- Self-approve its own implementation as an independent review.
- Declare simulated, dry-run, or example output as real review evidence.

### Human responsibility

- Approve merge and promotion decisions.
- Accept or reject `PASS WITH NOTES` findings.
- Decide whether future CrewAI integration can advance toward the merge gate.
- Approve risky changes, package changes, production changes, and protected path edits.

## 3. Allowed CrewAI Requests To Codex

CrewAI may ask Codex to:

- Read repository context.
- Inspect specific files.
- Summarize existing documentation.
- Propose a patch plan.
- Apply a scoped patch only after the task explicitly allows repository writes.
- Run validation commands such as `git diff --check`, `npm run lint`, and `npm run build`.
- Run `scripts/local-review.sh` only when the request explicitly asks for real Codex-backed review and required environment is available.
- Summarize `git diff`, `git diff --stat`, and changed files.
- Generate an Executor Response.
- Generate or store reports under `.agent/reports/<timestamp>/` when requested.

## 4. Forbidden CrewAI Requests To Codex

CrewAI must not ask Codex to:

- Commit.
- Push.
- Merge.
- Delete branches.
- Force push.
- Modify `prod`.
- Bypass validation.
- Self-approve an implementation.
- Mark simulated review as real.
- Edit secrets, credentials, `.env`, or `.env.*`.
- Install global dependencies.
- Change `package.json` or `package-lock.json` without explicit human approval.
- Modify application code outside the allowed scope.
- Replace `scripts/local-review.sh`.
- Wire CrewAI into the merge gate without a separate reviewed project decision.

## 5. Executor Request Format

CrewAI-to-Codex requests must use a stable markdown format:

```markdown
## Executor Request

- Request ID:
- Requested by agent:
- Intended executor: Codex
- Scope:
- Files allowed:
- Files forbidden:
- Commands allowed:
- Commands forbidden:
- Repo writes allowed: yes/no
- Git operations allowed: yes/no
- Expected output:
- Safety notes:
```

Every request must state whether repository writes and Git operations are allowed. If either field is omitted, the safe default is `no`.

## 6. Executor Response Format

Codex-to-CrewAI responses must use a stable markdown format:

```markdown
## Executor Response

- Request ID:
- Executor:
- Actions performed:
- Files changed:
- Commands run:
- Validation results:
- Diff summary:
- Errors:
- Follow-up needed:
- Safe to proceed: yes/no
```

The response must separate actual execution from plan-only, dry-run, or example output.

## 7. Review Separation

- The implementer cannot approve their own patch.
- Reviewer reports must be independent and separate.
- The aggregator summarizes reports and canonical verdicts, but it does not replace human approval.
- CrewAI orchestration output is not valid review evidence unless it preserves real Codex-backed reviewer execution and the existing report contract.
- A real review requires reports with `Provider: codex`, `Real execution: yes`, and a valid verdict.

## 8. Report Requirements

Reports belong under:

```text
.agent/reports/<timestamp>/
```

Canonical verdicts are:

- `PASS`
- `PASS WITH NOTES`
- `CHANGES REQUESTED`
- `BLOCKED`
- `INFRASTRUCTURE BLOCKED`

Required evidence includes:

- Request or review scope.
- Files inspected or changed.
- Commands run.
- Validation output or documented validation limitation.
- Diff or statement that no diff exists.
- Provider identity for real reviewer reports.
- `Real execution: yes/no`.
- Final verdict using the canonical set.

`Real execution: yes` may only be used when the executor or reviewer actually ran. Dry-run, example, simulated, placeholder, or deterministic contract-only output must use `Real execution: no` unless the report is specifically about real CrewAI dry-run execution and not real code review.

## 9. Failure Modes

Use `BLOCKED` when:

- The task cannot proceed safely without human input.
- Required approvals are missing.
- The requested operation conflicts with this contract.
- The branch, scope, or environment makes safe execution impossible.

Use `INFRASTRUCTURE BLOCKED` when:

- Required tooling is unavailable.
- Real reviewer reports are missing, invalid, empty, or simulated.
- Required validation output is missing.
- The diff is unavailable or the review scope is empty.
- Report fields are missing or use invalid verdicts.
- CrewAI, Codex, or wrapper infrastructure cannot produce auditable evidence.

Use `CHANGES REQUESTED` when:

- Real review or validation identifies a concrete issue in the patch.
- The implementation violates documented workflow or project constraints.
- Required behavior, tests, accessibility, build, or documentation expectations are not met.

## 10. Merge Policy

- CrewAI cannot merge.
- CrewAI cannot approve merge.
- Codex must not merge unless a separate explicit Git task grants that operation and human approval is recorded.
- `prod` always requires final human approval before promotion.
- Branch flow is:

```text
feature/* -> system -> prod
```

No part of this contract authorizes auto-merge, force push, direct `prod` work, deletion of protected branches, or bypassing `scripts/local-review.sh` for real review evidence.
