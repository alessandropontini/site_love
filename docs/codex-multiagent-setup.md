# Codex Multi-Agent Setup

## Prerequisites

- Codex CLI installed on the developer machine.
- Codex CLI authenticated and configured by the user.
- SITE LOVE repository opened from the git root.

Do not add Codex CLI to this project's `dependencies` or `devDependencies`.

OpenClaw is optional experimental orchestration only. It may coordinate Codex-backed review commands during the Phase 5 spike, but valid review evidence still comes from `scripts/local-review.sh` with `MULTIAGENT_PROVIDER=codex`, separate reports, and `Real execution: yes`. See `docs/openclaw-orchestration.md`.

CrewAI is being prepared as future orchestration infrastructure for SITE LOVE. Codex remains the tool that reads and edits files, runs repository commands, updates documentation, prepares scoped patches, launches validation, manages the repo workflow, and produces implementation and validation summaries. CrewAI may later coordinate implementation and review lanes, but a valid real review still requires Codex-backed reports with `Real execution: yes`. The executor boundary is documented in `.agent/contracts/crewai-codex-executor-contract.md`. See `docs/crewai-orchestration.md`.

For local CrewAI smoke checks, use the isolated repository venv when present. The local CrewAI environment lives at `.venv-crewai`, uses Python 3.11.9, and has CrewAI 1.9.3 installed. Do not use the global `python3` for CrewAI work; it may be a newer incompatible Python such as 3.14.x.

```bash
source .venv-crewai/bin/activate
python --version
crewai --version
```

The venv is not a runtime dependency for the Next.js app and is ignored by Git.

CrewAI is not the mandatory review engine yet. It is preparatory infrastructure for future specialized-agent orchestration, with separate implementation and review roles such as:

- Implementer agent
- Frontend Architect Reviewer
- Code Reviewer
- UX / Accessibility Reviewer
- Performance Reviewer
- QA / Regression Reviewer
- Git / Workflow Reviewer

CrewAI may generate an Executor Request for Codex, and Codex may return an Executor Response. This is a contract only; no automatic CrewAI-to-Codex execution bridge is active.

The non-negotiable rules remain:

- The implementer cannot approve its own patch.
- Review must be real, or the result must be `BLOCKED` or `INFRASTRUCTURE BLOCKED`.
- Simulated review must never be declared as real review evidence.
- No auto-merge.
- Final human approval is mandatory.
- The branch flow is `feature/* -> system -> prod`.

## Local Review

```bash
npm run lint
npm run build
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
RUN_DIR="$(ls -td .agent/reports/* | head -1)"
cat "$RUN_DIR/99_final-verdict.md"
```

Recommended bridge through the CrewAI scaffold wrapper:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/crewai-orchestrate.sh review
```

Direct review remains valid:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

Review scope selection is automatic:

- If both `REVIEW_BASE` and `REVIEW_HEAD` are set, the script reviews that explicit Git range.
- If no explicit range is set and the working tree has staged or unstaged changes, the script reviews the working tree.
- If no explicit range is set and the working tree is clean, the script reviews the last committed patch with `HEAD~1..HEAD`.

Use explicit range review when the patch has already been committed or spans multiple commits:

```bash
REVIEW_BASE=HEAD~2 REVIEW_HEAD=HEAD MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

If the range is invalid or the selected diff is empty, the workflow deterministically returns `INFRASTRUCTURE BLOCKED`.

The script runs the minimum independent reviewers through `codex exec`:

- `review-code`
- `review-qa-regression`

Each reviewer runs in read-only sandbox mode and must write a separate final report with `Real execution: yes` and a valid `Verdict:`.

A valid review requires `Provider: codex` and `Real execution: yes` in each required reviewer report. `noop` output is never valid review evidence.

Accepted verdicts are:

- `PASS`
- `PASS WITH NOTES`
- `CHANGES REQUESTED`
- `BLOCKED`
- `INFRASTRUCTURE BLOCKED`

## Noop Smoke Tests

```bash
./scripts/test-multiagent-workflow.sh
```

`noop` never approves. It is useful only for checking report generation, review-mode detection, and deterministic aggregation.

The expected final verdict for `noop` is `INFRASTRUCTURE BLOCKED` because every generated reviewer report has `Real execution: no`.

The smoke script uses a temporary detached Git worktree and runs `local-review` with `MULTIAGENT_PROVIDER=noop` for `explicit-range`, `committed-range`, and `working-tree` scenarios. Its expected verdicts are `INFRASTRUCTURE BLOCKED`, because `noop` is intentionally non-real. This checks workflow context, non-empty diffs, scope metadata, and aggregator blocking behavior; it does not replace a real Codex review.

When the smoke script is present and executable, `local-review` also records its output in `04_validation.md`. Nested smoke runs set `MULTIAGENT_SKIP_WORKFLOW_SMOKE=1` to avoid recursive validation.

## Optional Variables

- `MULTIAGENT_PROVIDER=codex`
- `REVIEW_BASE` and `REVIEW_HEAD` for explicit Git range review.
- `MULTIAGENT_AGENT_TIMEOUT_SECONDS=300`
- `MULTIAGENT_MAX_DIFF_CHARS=60000`
- `MULTIAGENT_CODEX_BIN` to select an explicit Codex CLI executable.
- `MULTIAGENT_CODEX_ARGS` for explicit extra `codex exec` arguments when the local CLI supports them.
- `MULTIAGENT_CODEX_MODEL` is recorded as intent only unless the user also passes a supported model flag through `MULTIAGENT_CODEX_ARGS`.

On macOS the workflow prefers the CLI bundled with `Codex.app`, then the local Codex app-server CLI under `.codex/plugins/.plugin-appserver/`, before falling back to a potentially stale global npm wrapper. Other systems resolve `codex` from `PATH`. Set `MULTIAGENT_CODEX_BIN` when a different authenticated installation is required:

```bash
MULTIAGENT_CODEX_BIN=/absolute/path/to/codex \
MULTIAGENT_PROVIDER=codex \
./scripts/local-review.sh
```

The timeout supervisor starts every reviewer in an isolated process group. At `MULTIAGENT_AGENT_TIMEOUT_SECONDS` it terminates the complete group, including Node wrappers and native Codex child processes, and returns exit code `124`. This prevents timed-out reviewers from surviving as orphan processes and blocking later runs.

Before running the full workflow, a quick CLI sanity check is:

```bash
CODEX_BIN="${MULTIAGENT_CODEX_BIN:-/Applications/Codex.app/Contents/Resources/codex}"
printf "Rispondi solo con OK. Non modificare file.\n" | "$CODEX_BIN" exec -
```

## Optional OpenClaw Spike

OpenClaw can be checked through the safe wrapper:

```bash
./scripts/openclaw-orchestrate.sh
```

If `openclaw` is not installed, the wrapper exits with a controlled message and points back to:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

The wrapper is experimental. It does not auto-merge, push, create real review reports by itself, or declare a patch mergeable.

## Notes

- Invalid, empty, missing, or non-real reports produce `INFRASTRUCTURE BLOCKED`.
- Reports without `Real execution: yes` produce `INFRASTRUCTURE BLOCKED`.
- Missing context files, invalid review scope, or empty diffs produce `INFRASTRUCTURE BLOCKED`.
- `PASS` and `PASS WITH NOTES` still require final human approval before merge.
- `PASS WITH NOTES` requires the notes to be resolved or explicitly accepted before merge.
- `CHANGES REQUESTED`, `BLOCKED`, and `INFRASTRUCTURE BLOCKED` mean no merge.
- Invalid Codex output is not repaired. The wrapper writes a deterministic fallback report and keeps raw diagnostics in `.agent/reports/<run-id>/`.
- Codex raw files are named `<agent>-codex-stdout.md`, `<agent>-codex-stderr.md`, `<agent>-codex-transcript.txt`, `<agent>-codex-diagnostics.md`, and `<agent>-codex-exit-code.txt`.
- The aggregator remains deterministic shell logic, not an LLM.
- Final human approval is still required before merge.
- Patch implementation automation is not enabled.
- OpenClaw orchestration is optional and experimental in Phase 5; Codex remains the active real provider.
