# Codex Review Setup

## Prerequisites

- Run commands from the repository root.
- Use a `feature/*` branch for patch work.
- Install and authenticate Codex CLI outside this project.
- Do not add Codex or orchestration tools to `package.json`.

The workflow searches for Codex in this order:

1. `MULTIAGENT_CODEX_BIN`
2. `/Applications/Codex.app/Contents/Resources/codex`
3. `~/.codex/plugins/.plugin-appserver/codex`
4. `codex` on `PATH`

## One-Reviewer Command

Create a request file outside the repository so reports receive the real goal and acceptance criteria:

```bash
cat > /tmp/site-love-review-request.md <<'EOF'
# Request

Describe the patch.

## Acceptance

- State the required behavior.
- State prohibited changes.
- Require lint and build.
EOF
```

Run:

```bash
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

The command performs validation once and launches one fresh read-only Codex process named `review-code-qa`. It does not commit, merge, push, or edit application files.

For a binary or environment-sensitive patch, create a supplemental evidence file before passing it:

```bash
printf '%s\n' \
  '# Supplemental evidence' \
  '- Record binary inspection, endpoint checks, or screenshot paths here.' \
  > /tmp/site-love-review-evidence.md

MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh \
  --request-file /tmp/site-love-review-request.md \
  --evidence-file /tmp/site-love-review-evidence.md
```

Omit `--evidence-file` when no supplemental evidence is needed.

Inspect the result:

```bash
RUN_DIR="$(ls -td .agent/reports/* | head -1)"
cat "$RUN_DIR/10_review-code-qa.md"
cat "$RUN_DIR/99_final-verdict.md"
```

## Explicit Commit Range

Use a range when the patch is already committed or spans several commits:

```bash
REVIEW_BASE=system \
REVIEW_HEAD=HEAD \
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

Both range variables are required. Invalid or empty ranges return `INFRASTRUCTURE BLOCKED`.

## Optional Variables

- `REVIEW_REQUEST_FILE`: request path alternative to `--request-file`.
- `REVIEW_EVIDENCE_FILE`: supplemental evidence path alternative to `--evidence-file`.
- `REVIEW_BASE`, `REVIEW_HEAD`: explicit committed range.
- `MULTIAGENT_CODEX_BIN`: explicit Codex executable.
- `MULTIAGENT_AGENT_TIMEOUT_SECONDS`: reviewer timeout, default `300`.
- `MULTIAGENT_MAX_DIFF_CHARS`: prompt diff limit, default `60000`.
- `MULTIAGENT_CODEX_ARGS`: additional supported `codex exec` arguments.
- `MULTIAGENT_CODEX_MODEL`: model label recorded in the report.

## Smoke Test

```bash
./scripts/test-multiagent-workflow.sh
```

The smoke suite uses `noop`, creates temporary worktrees, and must end in `PASS` for the suite while each nested review remains `INFRASTRUCTURE BLOCKED`. No model call is made.

## Validity Rules

A release review is valid only when the combined report contains:

- `Provider: codex`
- `Real execution: yes`
- A valid structured verdict

Reports from any provider other than `codex` fail the real-provider gate even if they claim `Real execution: yes` or spoof `Provider: codex`; aggregation checks the configured runner as well as report metadata.

The deterministic aggregator blocks invalid output instead of repairing or upgrading it. Raw Codex stdout, stderr, transcript, diagnostics, and exit code remain in the run directory for troubleshooting.

## Troubleshooting

Use an explicit binary when the global wrapper is stale or unresponsive:

```bash
MULTIAGENT_CODEX_BIN="$HOME/.codex/plugins/.plugin-appserver/codex" \
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

If authentication, quota, timeout, context, diff, lint, or build evidence is unavailable, keep the resulting `INFRASTRUCTURE BLOCKED` verdict. Never replace it manually with `PASS`.
