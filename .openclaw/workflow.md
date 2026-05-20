# OpenClaw Workflow Template

OpenClaw orchestration for SITE LOVE is experimental and must remain subordinate to the validated local workflow.

## Required Behavior

- Work from a `feature/*` branch.
- Preserve the branch flow `feature/* -> system -> prod`.
- Do not push, merge, or modify remote branches.
- Do not auto-merge.
- Do not require OpenClaw for app runtime or deployment.
- Use Codex as the active real provider for valid reviewer reports.
- Preserve `.agent/reports/<run-id>/` output.
- Treat missing, simulated, invalid, or `Real execution: no` reports as `INFRASTRUCTURE BLOCKED`.

## Fallback Command

```bash
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

## Smoke Command

```bash
MULTIAGENT_PROVIDER=noop ./scripts/local-review.sh
```

The smoke command is not review evidence. Its expected final verdict is `INFRASTRUCTURE BLOCKED`.

## Required Validation

```bash
git diff --check
npm run lint
npm run build
```

Run `./scripts/test-multiagent-workflow.sh` when it is present and executable.
