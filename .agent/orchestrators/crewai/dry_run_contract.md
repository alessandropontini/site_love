# CrewAI Dry-Run Report Contract

Every CrewAI evaluation report must contain at least the following fields and sections.

The dry-run report contract is separate from the executor bridge contract in `.agent/contracts/crewai-codex-executor-contract.md`. Fase 5d allows CrewAI to describe an Executor Request and Codex to describe an Executor Response, but it does not activate automatic Codex execution, direct CrewAI repository writes, or merge-gate integration.

```markdown
# CrewAI Orchestrator Evaluation Report

- Orchestrator: CrewAI
- Mode: dry-run
- Real repo modification: no
- Agent separation: yes/no
- Executor used for repo writes: none
- Final verdict: PASS | PASS WITH NOTES | CHANGES REQUESTED | BLOCKED | INFRASTRUCTURE BLOCKED

## Scenario
## Agents
## Task sequence
## Agent outputs
## Evidence
## Limitations
## Final decision
## Next step
```

Additional fields are allowed when they improve traceability, such as:

- Timestamp
- CrewAI importable
- CrewAI version
- Real CrewAI execution
- Report path
- Repository modification policy

The report must not claim real review or real CrewAI execution unless the run actually used CrewAI agents and captured separate outputs by agent.

`Real CrewAI execution: no` means CrewAI was not importable, could not complete `Crew.kickoff()`, or only validated the local report contract.

`Real CrewAI execution: yes` means CrewAI executed a dry-run with distinct `Agent`, `Task`, and `Crew` objects and captured separate outputs for each required agent.

If CrewAI is not importable, or if the run only validates the local report contract, the report must use:

```markdown
- Real CrewAI execution: no
- Final verdict: INFRASTRUCTURE BLOCKED
```

An honest blocked verdict is required whenever evidence is incomplete.

If CrewAI executes but required agent outputs are missing or unstructured, the report must use:

```markdown
- Real CrewAI execution: yes
- Final verdict: CHANGES REQUESTED
```

If CrewAI executes, required agent outputs are present, repository writes remain disabled, and the merge gate is unchanged, the expected Fase 5c verdict is:

```markdown
- Real CrewAI execution: yes
- Final verdict: PASS WITH NOTES
```

`PASS WITH NOTES` reflects that CrewAI remains a candidate orchestrator and is not integrated with Codex executor, `scripts/local-review.sh`, or merge governance.

Future CrewAI-to-Codex requests must use the contract and templates under `.agent/contracts/` before any executor bridge is considered.

Fase 5e adds an Executor Request dry-run report shape:

```markdown
# CrewAI Executor Request Dry-Run Report

- Phase: Fase 5e — CrewAI Executor Request Dry-Run
- Orchestrator: CrewAI
- Real CrewAI execution: yes/no
- CrewAI importable: yes/no
- CrewAI version:
- Executor Request generated: yes/no
- Executor Request valid: yes/no
- Executor Response generated: no-op/example
- Real Codex execution: no
- Repo modification: no
- Git operations: no
- Agent separation: yes/no
- Final verdict: PASS | PASS WITH NOTES | CHANGES REQUESTED | BLOCKED | INFRASTRUCTURE BLOCKED

## Scenario
## Agent outputs
## Executor Request validation
## Safety checks
## Evidence
## Limitations
## Final decision
## Next step
```

The Fase 5e response is always no-op/example unless a later reviewed phase explicitly authorizes real Codex execution. It must not be represented as a real Executor Response from Codex.
