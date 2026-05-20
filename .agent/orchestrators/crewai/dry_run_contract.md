# CrewAI Dry-Run Report Contract

Every CrewAI evaluation report must contain at least the following fields and sections.

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

If CrewAI is not importable, or if the run only validates the local report contract, the report must use:

```markdown
- Real CrewAI execution: no
- Final verdict: INFRASTRUCTURE BLOCKED
```

An honest blocked verdict is required whenever evidence is incomplete.
