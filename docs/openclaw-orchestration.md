# OpenClaw Orchestration Spike

OpenClaw is evaluated in SITE LOVE as an optional orchestration layer above the existing local multi-agent workflow. In this project, orchestration means selecting and coordinating specialized review agents, then handing execution back to the validated local scripts and provider contract.

OpenClaw does not replace Codex. Codex remains the only active real review provider because `scripts/local-review.sh` already validates real reviewer output through `codex exec`, stores reports in `.agent/reports/<run-id>/`, and blocks missing, simulated, invalid, or non-real reports. OpenClaw may help route work, document agent selection, and launch the existing workflow, but it must not invent reviewer output or bypass deterministic aggregation.

## Roles

- OpenClaw: optional experimental orchestrator for local workflow coordination.
- Codex: active real executor/provider for reviewer reports when `MULTIAGENT_PROVIDER=codex` is used.
- `scripts/local-review.sh`: source of truth for local review execution, validation capture, report format checks, and final deterministic verdict.
- Human reviewer: final approval authority before any merge.

## Coordinated Agents

OpenClaw should coordinate the same project-approved reviewer roles:

- Frontend Architect
- Code Review
- UX / Accessibility
- Performance
- QA / Regression
- Git / Workflow Reviewer

The minimum required review remains Code Review plus QA / Regression. Add specialized reviewers when the patch touches React/Next architecture, UX/accessibility, performance-sensitive behavior, scripts, CI, package files, AI workflow docs, or `AGENTS.md`.

## What OpenClaw Can Do

- Read `.openclaw/` templates to understand project workflow expectations.
- Select relevant reviewer roles for a patch.
- Launch or point to the existing Codex-backed review command.
- Preserve `.agent/reports/<run-id>/` as the report destination.
- Surface final verdicts from `99_final-verdict.md`.
- Help maintain the feature branch flow: `feature/* -> system -> prod`.

## What OpenClaw Cannot Do

- It cannot replace Codex as the active real provider.
- It cannot approve its own orchestration output as independent review.
- It cannot mark `noop` output as mergeable.
- It cannot auto-merge, push, or modify remote branches.
- It cannot skip `git diff --check`, `npm run lint`, or `npm run build`.
- It cannot create simulated multi-agent reports.
- It cannot make OpenClaw, Codex, or any AI tool required for app runtime, lint, build, start, or deployment.

## Local Spike Commands

Run the safe wrapper from the repository root:

```bash
./scripts/openclaw-orchestrate.sh
```

If the `openclaw` command is unavailable, the wrapper exits in a controlled way and suggests the validated fallback:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

For infrastructure smoke coverage only:

```bash
MULTIAGENT_PROVIDER=noop ./scripts/local-review.sh
```

`noop` reports `Real execution: no`; its expected final verdict is `INFRASTRUCTURE BLOCKED`. It is useful for testing workflow plumbing, never for approving a patch.

For real local review, run:

```bash
git diff --check
npm run lint
npm run build
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
RUN_DIR="$(ls -td .agent/reports/* | head -1)"
cat "$RUN_DIR/99_final-verdict.md"
```

## Reading Reports

Each valid agent report must start with:

```markdown
# Agent Report
```

It must include `Provider`, `Model`, `Input files`, `Real execution`, a canonical `Verdict`, and a `## Findings` section. A report is real review evidence only when it says `Provider: codex`, `Real execution: yes`, and has one accepted verdict.

Canonical verdicts:

- `PASS`: no blocking issues found; still requires final human approval.
- `PASS WITH NOTES`: no blocker, but notes must be resolved or explicitly accepted before merge.
- `CHANGES REQUESTED`: code or documentation changes are required before merge.
- `BLOCKED`: review cannot approve because of a substantive blocker.
- `INFRASTRUCTURE BLOCKED`: the workflow lacks valid evidence, such as missing diff, missing validation, invalid report format, or `Real execution: no`.

The final deterministic verdict is in:

```bash
.agent/reports/<run-id>/99_final-verdict.md
```

## Mergeability

A patch is not mergeable when any of these are true:

- The branch flow is not `feature/* -> system -> prod`.
- The diff is missing or empty for the selected review scope.
- `git diff --check`, `npm run lint`, or `npm run build` is missing or failing.
- Required real Codex reviewer reports are missing, invalid, or marked `Real execution: no`.
- Any required reviewer returns `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`.
- A `PASS WITH NOTES` finding is unresolved and not explicitly accepted.
- The implementer is approving their own patch.
- Final human approval has not happened.

`PASS` and `PASS WITH NOTES` never authorize automatic merge. No OpenClaw spike output changes that rule.

## Branch Flow

OpenClaw orchestration must fit the existing branch policy:

```text
feature/* -> system -> prod
```

Feature branches may be reviewed locally. Successful local review does not merge the branch. The branch can move to `system` only after human review accepts the patch. `prod` receives changes only from `system`; direct `feature/* -> prod` merges remain prohibited.

## Spike Success Criteria

The spike is successful when OpenClaw usage is documented, the wrapper fails safely without a local OpenClaw CLI, fallback to the Codex workflow is clear, and the existing validation/report contract remains unchanged.

The spike is blocked when OpenClaw cannot invoke real provider-backed execution, produces simulated output, skips validation, or cannot preserve `.agent/reports/<run-id>/`. In those cases the workflow result must be `BLOCKED` or `INFRASTRUCTURE BLOCKED`.

## Next Step

After the spike, the project can decide whether to wire a verified OpenClaw CLI invocation. That future change must be tested with real Codex-backed reports and must keep `scripts/local-review.sh` as the validation and aggregation source of truth until an explicit project decision replaces it.
