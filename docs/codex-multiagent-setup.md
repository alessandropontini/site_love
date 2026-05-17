# Codex Multi-Agent Setup

## Prerequisites

- Codex CLI installed on the developer machine.
- Codex CLI authenticated and configured by the user.
- SITE LOVE repository opened from the git root.

Do not add Codex CLI to this project's `dependencies` or `devDependencies`.

## Local Review

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

Accepted verdicts are:

- `PASS`
- `PASS WITH NOTES`
- `CHANGES REQUESTED`
- `BLOCKED`
- `INFRASTRUCTURE BLOCKED`

## Noop Safe Test

```bash
MULTIAGENT_PROVIDER=noop ./scripts/local-review.sh
```

`noop` never approves. It is useful for checking report generation and deterministic aggregation.

The expected final verdict for `noop` is `INFRASTRUCTURE BLOCKED` because every generated reviewer report has `Real execution: no`.

## Optional Variables

- `MULTIAGENT_PROVIDER=codex`
- `REVIEW_BASE` and `REVIEW_HEAD` for explicit Git range review.
- `MULTIAGENT_AGENT_TIMEOUT_SECONDS=180`
- `MULTIAGENT_MAX_DIFF_CHARS=60000`
- `MULTIAGENT_CODEX_ARGS` for explicit extra `codex exec` arguments when the local CLI supports them.
- `MULTIAGENT_CODEX_MODEL` is recorded as intent only unless the user also passes a supported model flag through `MULTIAGENT_CODEX_ARGS`.

If `timeout` or `gtimeout` is available, the script uses it. Otherwise it uses a portable bash timeout fallback that starts `codex exec` in the background, monitors it, terminates it after `MULTIAGENT_AGENT_TIMEOUT_SECONDS`, and returns exit code `124` on timeout.

Before running the full workflow, a quick CLI sanity check is:

```bash
printf "Rispondi solo con OK. Non modificare file.\n" | codex exec -
```

## Notes

- Invalid, empty, missing, or non-real reports produce `INFRASTRUCTURE BLOCKED`.
- Reports without `Real execution: yes` produce `INFRASTRUCTURE BLOCKED`.
- Missing context files, invalid review scope, or empty diffs produce `INFRASTRUCTURE BLOCKED`.
- Invalid Codex output is not repaired. The wrapper writes a deterministic fallback report and keeps raw diagnostics in `.agent/reports/<run-id>/`.
- Codex raw files are named `<agent>-codex-stdout.md`, `<agent>-codex-stderr.md`, `<agent>-codex-transcript.txt`, `<agent>-codex-diagnostics.md`, and `<agent>-codex-exit-code.txt`.
- The aggregator remains deterministic shell logic, not an LLM.
- Final human approval is still required before merge.
- Patch implementation automation is not enabled in Phase 2B.
- OpenClaw is not active in this phase.
