# CrewAI Status

CrewAI is retained as an inactive experiment and is not part of the SITE LOVE release path. The operational workflow uses Codex directly; a separate combined read-only review is available only for releases and high-risk work.

## Current Decision

- Codex is the only active developer and review provider.
- `scripts/local-review.sh` is the on-demand review command.
- CrewAI output is not required for lint, build, preview, deployment, or merge review.
- CrewAI does not modify the repository, approve patches, commit, merge, or push.
- Human approval remains mandatory.

The historical CrewAI scaffold, contract files, and isolated `.venv-crewai` may remain for reference. They must not be added to app dependencies or treated as release evidence.

## Compatibility Wrapper

The wrapper can still inspect the scaffold:

```bash
./scripts/crewai-orchestrate.sh status
./scripts/crewai-orchestrate.sh smoke
./scripts/crewai-orchestrate.sh explain
```

Its `review` command only delegates to the current Codex workflow:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/crewai-orchestrate.sh review
```

Direct review is preferred because it has less orchestration overhead and can receive the original request explicitly:

```bash
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

## Historical Boundary

`.agent/contracts/crewai-codex-executor-contract.md` documents the earlier proposed boundary between CrewAI requests and Codex execution. It is archival design context, not the current merge gate.

Promoting CrewAI again would require a new explicit project decision, real end-to-end tests, updated documentation, and proof that it reduces operational cost without weakening review evidence.
