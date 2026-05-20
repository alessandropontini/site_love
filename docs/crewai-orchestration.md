# CrewAI Orchestration

SITE LOVE prepares CrewAI as future orchestration infrastructure, not as the active site worker. Codex remains the operational tool for installation, repository management, technical patches, validation, documentation, and real review.

## Architectural Decision

- Codex CLI handles setup, repository work, scoped patches, validation, documentation, and real review.
- CrewAI may coordinate future multi-agent work on the site, separating implementation roles from review roles.
- Bash and Git provide deterministic guardrails.
- `.agent/prompts/` defines reviewer contracts and role expectations.
- `.agent/contracts/` defines the CrewAI/Codex executor boundary, request template, response template, and document-only examples.
- `.agent/reports/` stores the audit trail and final verdict evidence.
- `scripts/local-review.sh` remains the source of truth for real Codex-backed review.
- Human approval is mandatory before merge.

CrewAI does not replace Codex. In this phase it may prepare structured Executor Requests for Codex, but it does not modify app code directly, generate UI patches by itself, run creative site tasks, or produce valid review evidence.

See `.agent/contracts/crewai-codex-executor-contract.md` for the executor contract.

The local CrewAI installation is isolated in:

```text
.venv-crewai
```

Use the Python from that virtual environment for CrewAI work. The global `python3` may be a newer incompatible version, such as Python 3.14.x, and must not be used for CrewAI. The expected local venv Python is Python 3.11.9. The CrewAI version observed for this setup is 1.9.3.

## Why OpenClaw Is Paused

OpenClaw was tested as an optional orchestrator, but it is paused for operational use because it tends toward deep inspection, often requires `continue` in the TUI, and is not deterministic enough for SITE LOVE's local review contract. It remains documented as an experiment, but it is not the main orchestration path.

## Why CrewAI

CrewAI is being prepared as a future role/task coordinator. Its value is explicit lane separation: one crew may plan and implement a scoped patch, another independent crew may review read-only, and an aggregation lane may summarize reviewer reports without implementing.

## Lanes

Implementation lane:

- Patch Planner
- Patch Implementer
- Validation Runner

This lane may work on a patch in the future, within authorized scope, but it cannot approve.

Review lane:

- Frontend Architect Reviewer
- Code Reviewer
- UX / Accessibility Reviewer
- Performance Reviewer
- QA / Regression Reviewer
- Git / Workflow Reviewer

This lane is read-only. Reviewers cannot modify files, implement fixes, commit, merge, push, or auto-merge.

Aggregation lane:

- Review Aggregator

The aggregator reads reviewer reports and validation evidence. It cannot implement, edit files, invent verdicts, or upgrade non-real output into approval.

## Core Rule

Who implements does not review. Who reviews does not modify. The aggregator does not implement. Final approval is human.

## When To Use Codex Directly

Use Codex directly for:

- Infrastructure setup.
- Reading and editing files.
- Running repository commands.
- Tool installation and local workflow maintenance.
- Script fixes.
- Documentation patches.
- Technical repository changes.
- Preparing scoped patches.
- Launching validation commands.
- Producing implementation and validation summaries.
- Real review through `scripts/local-review.sh`.

## When To Use CrewAI

Use CrewAI later for:

- Coordinating future site work across implementation and review crews.
- Generating structured Executor Requests for Codex.
- Assigning roles and tasks from `orchestration/agents.yaml` and `orchestration/tasks.yaml`.
- Keeping implementation, review, and aggregation lanes separate.

Do not use CrewAI to replace real Codex review. Do not let CrewAI modify the repository directly. Valid review evidence still requires separate reports with `Provider: codex` and `Real execution: yes`.

## Commands

Activate the local CrewAI virtual environment when you want the wrapper to detect the installed CrewAI package:

```bash
source .venv-crewai/bin/activate
python --version
crewai --version
```

Verify the local install:

```bash
python --version
crewai --version
```

Show wrapper help:

```bash
./scripts/crewai-orchestrate.sh --help
```

Show repository and scaffold status:

```bash
./scripts/crewai-orchestrate.sh status
```

Run non-destructive scaffold smoke checks:

```bash
./scripts/crewai-orchestrate.sh smoke
```

Explain lanes and guardrails:

```bash
./scripts/crewai-orchestrate.sh explain
```

Run real review through the CrewAI wrapper bridge:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/crewai-orchestrate.sh review
```

Run real review directly:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

The `review` command is only a bridge to `scripts/local-review.sh`; it does not ask CrewAI to invent review output.

## Branch Policy

The branch flow remains:

```text
feature/* -> system -> prod
```

`prod` is protected. No direct `feature/* -> prod` merge is allowed. No merge is allowed without final human approval.

## Real Review Criteria

- Reviewer reports must be separate.
- Provider must be declared.
- Real review requires `Provider: codex`.
- Real review requires `Real execution: yes`.
- `noop` is never approving review evidence.
- A simulated review must never be declared as real review evidence.
- If the provider does not execute for real, the verdict must be `INFRASTRUCTURE BLOCKED`, not `PASS`.
- Missing reports, invalid reports, empty diffs, missing validation, or non-real execution block approval.

## Anti-Regression Rules

- No fake reviews.
- No reviewer may modify files.
- No implementer may approve its own work.
- No aggregator may invent verdicts.
- No automatic commit, merge, push, or auto-merge.
- Do not require CrewAI, Codex, or any AI tool for app runtime, lint, build, start, or deployment.
- Do not add AI orchestration tools to `package.json`.
- Keep `scripts/local-review.sh` as the real review source of truth until a future reviewed decision changes that.

## Troubleshooting

CrewAI not installed:

- `./scripts/crewai-orchestrate.sh smoke` should say CrewAI is not installed and continue non-destructive scaffold checks.
- This is acceptable in this phase because CrewAI is not executing site work yet.
- If `.venv-crewai` exists, activate it with `source .venv-crewai/bin/activate` before running CrewAI-specific smoke checks.
- The local venv is ignored by Git and must not be treated as a project runtime dependency.

Codex auth, quota, or usage limit:

- Real review may return `INFRASTRUCTURE BLOCKED`.
- Keep generated stdout, stderr, diagnostics, and reports under `.agent/reports/<run-id>/`.
- Do not invent `PASS`.

Working tree dirty:

- `scripts/local-review.sh` can review working-tree changes, but the intended scope must be clear before relying on any report.
- Stage intended additions when possible so the diff is explicit.

Branch `prod`:

- The CrewAI wrapper refuses to run on `prod`.
- Work from `feature/*`, then move through `system` after review and human approval.

Missing reports or verdict:

- Inspect the latest report directory:

```bash
RUN_DIR="$(ls -td .agent/reports/* | head -1)"
echo "$RUN_DIR"
cat "$RUN_DIR/99_final-verdict.md" || true
grep -R "Real execution:" "$RUN_DIR" || true
```

- Missing or invalid report evidence means the patch is not mergeable through this workflow.
