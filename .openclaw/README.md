# SITE LOVE OpenClaw Templates

This directory contains experimental, documentation-only OpenClaw orchestration notes for SITE LOVE.

OpenClaw is treated as an optional orchestrator above the existing Codex-backed workflow. It must not replace `scripts/local-review.sh`, generate simulated reviewer reports, require secrets, perform auto-merge, push branches, or become required for `npm run dev`, `npm run lint`, `npm run build`, `npm run start`, or deployment.

Use these files as local spike input:

- `agents.md`: reviewer role to prompt-file mapping.
- `workflow.md`: safe orchestration expectations and fallback commands.

The source-of-truth operational guide is `docs/openclaw-orchestration.md`.
