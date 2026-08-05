# OpenClaw Status

OpenClaw is a paused experiment and is not part of the SITE LOVE release path.

The active workflow is:

1. Interactive Codex implementation.
2. Required repository validation.
3. One fresh read-only combined Codex review through `scripts/local-review.sh`.
4. Deterministic verdict aggregation.
5. Human approval.

`scripts/openclaw-orchestrate.sh` remains only as a compatibility experiment. It cannot create valid review evidence by itself, modify the repository, commit, merge, push, or replace the direct Codex command.

Use direct review instead:

```bash
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

OpenClaw may be reconsidered only after an explicit project decision and a measured benefit over the lean workflow.
