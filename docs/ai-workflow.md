# AI Workflow: Codex Development and Lean Review

Codex is the only active AI development and review tool for SITE LOVE. CrewAI, OpenClaw, Ruflo, Claude Flow, MCP agent runtimes, and WASM agents are not part of the release path.

## Runtime Boundary

The website must work with ordinary Next.js commands only:

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Do not add AI tools, provider SDKs, or orchestration packages to runtime or development dependencies. Local Codex CLI authentication and reports stay outside the deployed app.

## Codex Responsibilities

The interactive Codex session may:

- Inspect repository files and documentation.
- Plan and implement a scoped patch.
- Generate or process approved visual assets.
- Run validation and local browser checks.
- Update project documentation.
- Prepare intentional commits when the user asks.

The interactive implementation response cannot approve its own patch.

## Independent Review Boundary

After implementation, `scripts/local-review.sh` launches one new read-only `codex exec` process. That combined reviewer covers code quality, QA/regression, and relevant specialist risks in one report. It receives captured status, diff, touched files, validation output, and the request file.

This is the minimum token-efficient separation:

- Same product/provider: Codex.
- Different execution and prompt: required.
- Reviewer cannot edit files: required.
- Deterministic shell aggregation: required.
- Human final approval: required.

See `docs/multiagent-workflow.md` for policy and `docs/codex-multiagent-setup.md` for commands.

## Standard Work Sequence

### 1. Inspect

Read `AGENTS.md`, `docs/architecture.md`, `docs/visual-direction.md`, and the relevant source files before editing the mounted paper-theatre experience.

### 2. Plan

State candidate files, intended changes, risks, validation, and paths intentionally left untouched.

### 3. Implement

Keep changes scoped. Do not change challenge mechanics, progression, dependencies, deployment files, secrets, or approved visual assets without explicit authorization.

### 4. Validate

```bash
git diff --check
npm run lint
npm run build
```

For visible changes, run the local app and inspect desktop and mobile layouts. For generated imagery, verify composition, alpha, dimensions, file size, and mounted rendering.

### 5. Review

Write the real request and acceptance criteria to a local file, then run:

```bash
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

The request file prevents reviewers from receiving only a diff without the original intent. For binary assets, endpoint checks, screenshots, or other non-diff verification, first create a supplemental file and then add `--evidence-file /path/to/evidence.md`. Missing essential context must remain `INFRASTRUCTURE BLOCKED`.

### 6. Human Decision

`PASS` and `PASS WITH NOTES` are review evidence, not merge commands. Resolve or accept notes, inspect the site, and make the final merge decision manually.

## Paper-Theatre Regression Checks

- Invitation stays readable and never auto-starts.
- Exactly the first incomplete chapter is available.
- Rewards remain idempotent and derive from completed IDs.
- The finale requires every configured chapter ID.
- Keyboard, touch, focus restoration, and visible focus remain usable.
- `prefers-reduced-motion` overrides the saved motion setting.
- Italian and English stay complete with language-independent progress IDs.
- `app/page.tsx` continues to mount `ExperienceShell`.
- Legacy story and arcade implementations remain unmounted.

## Review Outcomes

- `PASS`: no blocking issue found; human approval still required.
- `PASS WITH NOTES`: non-blocking risks require explicit resolution or acceptance.
- `CHANGES REQUESTED`: fix the patch and rerun validation/review.
- `BLOCKED`: a substantive condition prevents approval.
- `INFRASTRUCTURE BLOCKED`: required review evidence was not produced.

`noop` is only for `scripts/test-multiagent-workflow.sh` and can never approve a patch.
