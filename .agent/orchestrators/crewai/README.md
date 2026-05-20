# CrewAI Orchestrator Evaluation Spike

Fase 5c evaluates CrewAI through a real dry-run execution. The goal is to test whether CrewAI can orchestrate distinct agents and tasks, capture separate outputs, and produce a canonical report without becoming part of the merge gate.

Fase 5d defines the CrewAI-to-Codex executor boundary in `.agent/contracts/crewai-codex-executor-contract.md`. CrewAI may generate an Executor Request and Codex may produce an Executor Response, but no automatic executor bridge, merge-gate integration, or direct CrewAI repository modification is active.

CrewAI is only an orchestrator candidate. Codex remains the operational executor for repository work: reading and editing files, running commands, preparing patches, executing validation, handling Git operations, and summarizing results.

## Layer Boundaries

SITE LOVE keeps these layers separate:

- Executor layer: Codex performs real repository operations.
- Orchestrator layer: CrewAI may coordinate agents, tasks, roles, sequencing, and reports.
- Agent roles layer: implementation, review, and aggregation roles remain separate.
- Policy / Governance layer: merge, approval, and review rules remain deterministic and human-governed.
- Reports / Evidence layer: markdown reports, verdicts, validation output, and diff evidence remain auditable.

The orchestrator must be replaceable. It must not own policy, write application code, approve work, or change the merge process.

See also:

- `.agent/contracts/crewai-codex-executor-contract.md`
- `.agent/contracts/executor-request-template.md`
- `.agent/contracts/executor-response-template.md`

## This Phase Does Not

- Modify application code.
- Modify React components.
- Modify `package.json` or `package-lock.json`.
- Install dependencies.
- Replace `scripts/local-review.sh`.
- Add CrewAI to the merge gate.
- Connect CrewAI automatically to Codex execution.
- Authorize CrewAI to modify code directly.
- Declare dry-run output as real code review.
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

- `Real CrewAI execution: no` means CrewAI was unavailable or the script could not complete a real crew run.
- `Real CrewAI execution: yes` means CrewAI `Agent`, `Task`, and `Crew` objects were instantiated and `Crew.kickoff()` completed.

The Fase 5c script uses a deterministic local LLM adapter to avoid external provider requirements. This proves orchestration mechanics, not real model quality.

An honest `INFRASTRUCTURE BLOCKED` is required when CrewAI cannot be imported or cannot run. `PASS WITH NOTES` is acceptable when CrewAI executes distinct agents and tasks, produces separate outputs, avoids repository writes, and keeps CrewAI outside the merge gate.

## Verdict Meanings

- `PASS`: CrewAI ran real dry-run agents, preserved role separation, produced the required report, and did not modify the repository.
- `PASS WITH NOTES`: CrewAI ran real dry-run agents and preserved safety rules, but follow-up work remains because CrewAI is still not connected to Codex executor or merge governance.
- `INFRASTRUCTURE BLOCKED`: CrewAI was unavailable, did not execute real agents, or report evidence was insufficient for a real evaluation.

Other canonical verdicts may appear in reports:

- `CHANGES REQUESTED`
- `BLOCKED`

No verdict from this spike authorizes merge. Final human approval remains mandatory.
