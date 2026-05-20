# CrewAI Orchestrator Evaluation Spike

Fase 5b evaluates CrewAI as a candidate pluggable orchestrator for SITE LOVE. The goal is to test whether CrewAI can coordinate roles, task order, and report shape without becoming part of the merge gate.

CrewAI is only an orchestrator candidate. Codex remains the operational executor for repository work: reading and editing files, running commands, preparing patches, executing validation, handling Git operations, and summarizing results.

## Layer Boundaries

SITE LOVE keeps these layers separate:

- Executor layer: Codex performs real repository operations.
- Orchestrator layer: CrewAI may coordinate agents, tasks, roles, sequencing, and reports.
- Agent roles layer: implementation, review, and aggregation roles remain separate.
- Policy / Governance layer: merge, approval, and review rules remain deterministic and human-governed.
- Reports / Evidence layer: markdown reports, verdicts, validation output, and diff evidence remain auditable.

The orchestrator must be replaceable. It must not own policy, write application code, approve work, or change the merge process.

## This Phase Does Not

- Modify application code.
- Modify React components.
- Modify `package.json` or `package-lock.json`.
- Install dependencies.
- Replace `scripts/local-review.sh`.
- Add CrewAI to the merge gate.
- Declare dry-run output as real review.
- Auto-merge, push, commit, or delete branches.

## Dry Run

Run from the repository root with the isolated CrewAI virtual environment:

```bash
source .venv-crewai/bin/activate
python .agent/orchestrators/crewai/run_crewai_dry_run.py
```

The script writes a report to:

```text
.agent/reports/<timestamp>/crewai-orchestrator-evaluation.md
```

## Expected Result

The dry-run should produce an auditable markdown report that states whether CrewAI was importable and whether real CrewAI agent execution happened.

An honest `INFRASTRUCTURE BLOCKED` is acceptable when CrewAI cannot be imported or when the script only validates the report contract without running real CrewAI agents.

## Verdict Meanings

- `PASS`: CrewAI ran real dry-run agents, preserved role separation, produced the required report, and did not modify the repository.
- `PASS WITH NOTES`: CrewAI ran real dry-run agents and preserved safety rules, but follow-up improvements remain.
- `INFRASTRUCTURE BLOCKED`: CrewAI was unavailable, did not execute real agents, or report evidence was insufficient for a real evaluation.

Other canonical verdicts may appear in reports:

- `CHANGES REQUESTED`
- `BLOCKED`

No verdict from this spike authorizes merge. Final human approval remains mandatory.
