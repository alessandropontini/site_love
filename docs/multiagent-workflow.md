# Lean Codex Patch Review Workflow

SITE LOVE uses one operational AI tool: Codex. Codex may implement a scoped patch in the interactive session and then run one combined Code + QA review through a fresh read-only `codex exec` process.

The implementation response is never review evidence. Independence comes from a separate execution with a clean reviewer prompt and captured repository evidence, not from asking one response to imitate multiple agents.

## Release Decision

- Codex is the only active developer and review provider.
- `scripts/local-review.sh` is the canonical review entrypoint.
- One `review-code-qa` report replaces the former Code Review and QA / Regression calls.
- The combined reviewer also applies architecture, UX/accessibility, performance, and Git/workflow checks when relevant to touched files.
- The deterministic shell aggregator validates the report and computes the final verdict.
- A human still approves every merge.
- No workflow command commits, merges, or pushes.
- CrewAI and OpenClaw are inactive experiments, not part of the release path.

This reduces reviewer invocations from two to one and avoids repeating the same diff and validation context twice.

## Required Flow

1. Work on a `feature/*` branch.
2. Implement the requested patch in the interactive Codex session.
3. Run `git diff --check`, `npm run lint`, and `npm run build`.
4. Put the original request and acceptance criteria in a local Markdown file.
5. Launch one independent read-only review.
6. Read the generated report and deterministic verdict.
7. Require human approval before commit, merge, or push decisions.

Example:

```bash
git diff --check
npm run lint
npm run build
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
RUN_DIR="$(ls -td .agent/reports/* | head -1)"
cat "$RUN_DIR/10_review-code-qa.md"
cat "$RUN_DIR/99_final-verdict.md"
```

`MULTIAGENT_PROVIDER` is retained as a compatibility environment variable. `codex` is the only provider accepted as real release evidence. `noop` is only for workflow smoke tests.

## Request Context

The request file should contain:

- The requested outcome.
- Allowed and prohibited scope.
- Acceptance criteria.
- Required validation.
- Explicit Git constraints.

`local-review.sh` copies this content into `00_context.md`, so the reviewer receives the original intent instead of trying to infer it from the diff. `REVIEW_REQUEST_FILE=/path/to/file.md` is equivalent to `--request-file`.

Use `--evidence-file` only after creating a supplemental Markdown file for binary-asset inspection, local endpoint checks, screenshots, or other evidence that a Git text diff cannot contain:

```bash
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh \
  --request-file /tmp/site-love-review-request.md \
  --evidence-file /tmp/site-love-review-evidence.md
```

The evidence file is copied to `08_review_evidence.md` and included verbatim in the read-only reviewer prompt. `REVIEW_EVIDENCE_FILE` is the environment-variable equivalent. Omit the flag for ordinary text-only patches.

## Review Scope

The script chooses one of three modes:

- `working-tree`: staged, unstaged, and relevant untracked changes when the tree is dirty.
- `committed-range`: `HEAD~1..HEAD` when the tree is clean.
- `explicit-range`: the range supplied through both `REVIEW_BASE` and `REVIEW_HEAD`.

For a multi-commit patch:

```bash
REVIEW_BASE=system \
REVIEW_HEAD=HEAD \
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

An invalid range, empty diff, missing request where intent cannot be evaluated, or missing validation must block approval.

## Report Contract

Each run is stored under `.agent/reports/<run-id>/` and includes:

- `00_context.md`
- `01_git_status.txt`
- `02_git_diff.patch`
- `03_git_diff_stat.txt`
- `04_validation.md`
- `06_review_scope.md`
- `07_touched_files.txt`
- `08_review_evidence.md` when supplied
- `10_review-code-qa.md`
- `99_final-verdict.md`

A real reviewer report must contain `Provider: codex`, `Real execution: yes`, and exactly one allowed verdict:

- `PASS`
- `PASS WITH NOTES`
- `CHANGES REQUESTED`
- `BLOCKED`
- `INFRASTRUCTURE BLOCKED`

Missing, empty, malformed, non-real, or `noop` output deterministically becomes `INFRASTRUCTURE BLOCKED`.
The aggregator also binds validation to the configured execution runner: a non-Codex run cannot pass by writing `Provider: codex` inside its own report.

## Merge Conditions

A patch can proceed to human merge review only when:

- The intended diff is complete and non-empty.
- Required validations passed.
- The combined reviewer report is real and valid.
- The reviewer returned `PASS` or `PASS WITH NOTES`.
- Every note is resolved or explicitly accepted.
- Human approval is recorded.

`PASS` never performs or authorizes an automatic merge. `CHANGES REQUESTED`, `BLOCKED`, and `INFRASTRUCTURE BLOCKED` mean no merge.

## Smoke Test

```bash
./scripts/test-multiagent-workflow.sh
```

The smoke suite uses `noop` in a temporary detached worktree. Its nested reviews must return `INFRASTRUCTURE BLOCKED`; this verifies range selection, request/evidence propagation, report generation, timeout cleanup, Codex-only provider enforcement, and deterministic blocking without spending model tokens.

## Compatibility Commands

`scripts/local-multiagent.sh "patch description"` remains as a compatibility entrypoint. It now performs the same single combined review and does not implement a patch.

`scripts/crewai-orchestrate.sh review` and the OpenClaw wrapper may still delegate to `local-review.sh`, but neither orchestrator is required or accepted as separate review evidence.

## Prohibited

- Treating the implementation response as its own approval.
- Simulating several reviewers inside one response.
- Marking `noop` as real review.
- Auto-commit, auto-merge, auto-push, or direct feature-to-`prod` release.
- Adding AI orchestration packages to app dependencies.
- Requiring AI tools for runtime, lint, build, start, or deployment.
