# On-demand Codex review workflow

SITE LOVE uses a single optional independent reviewer: a fresh, read-only Codex execution. It is a safeguard for releases and high-risk work, not a mandatory cost for every small change.

## When to run it

Run `scripts/local-review.sh` before a release and for dependency, framework/configuration, security, RSVP/data, routing/architecture, retained-game, or sensitive asset changes. Also run it whenever the user explicitly requests an independent review.

Do not run it automatically for contained documentation, copy, styling, or focused bug-fix work. Those tasks still require a clear diff, proportionate validation, a `CHANGELOG.md` entry, and ordinary human review of the handoff.

The detailed decision rules are maintained in `AGENTS.md` and `docs/ai-workflow.md`.

## Review command

Create a request file outside the repository with the outcome, allowed scope, acceptance criteria, required validation, and Git constraints. Then run:

```bash
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

For a screenshot, endpoint, binary asset, or environment-sensitive change, add an evidence file with `--evidence-file`.

The script captures the diff, validation output, and one reviewer report under `.agent/reports/<run-id>/`. Its reviewer must contain `Provider: codex`, `Real execution: yes`, and one structured verdict: `PASS`, `PASS WITH NOTES`, `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`.

## Decision and cleanup rules

- A review report never commits, merges, pushes, or deploys.
- `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED` require follow-up before a release. `PASS WITH NOTES` requires notes to be resolved or consciously accepted.
- Keep review scope coherent: do not combine an unrelated cleanup with feature, dependency, or privacy work.
- Before deleting legacy source, assets, scripts, reports, or docs, inventory the exact targets and dependencies, then obtain explicit user approval.
- Run `./scripts/test-multiagent-workflow.sh` only when changing the review scripts themselves.
