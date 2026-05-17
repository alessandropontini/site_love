# AI Workflow: Codex and Multi-Agent Review Preparation

Ruflo has been removed from the SITE LOVE workflow. Reviews no longer use Ruflo, Claude Flow, MCP, WASM agents, or automatic multi-agent orchestration.

The local Ruflo/WASM runtime was retired because it created agent records but did not produce autonomous review output without an external model provider/API key. Do not configure Anthropic/Claude managed agents, provider keys, or replacement orchestration tooling for this project unless the project owner explicitly approves a new workflow.

The current multi-agent work is Phase 2B. The repository contains prompts, report locations, safe scripts, a provider abstraction, deterministic aggregation, and a Codex reviewer provider through `codex exec`. It can only produce real reviewer reports when Codex CLI is installed, configured, and returns valid separate reports. Otherwise the workflow verdict must be `INFRASTRUCTURE BLOCKED`, not `PASS`.

## What Codex is for

Codex remains useful as an operational development assistant:

- Implement small, scoped patches.
- Read and summarize repository files.
- Run validation commands such as lint and build.
- Collect raw command output.
- Prepare concise implementation summaries.

Codex may be used as an executor for scoped patches, file inspection, command execution, and report preparation. Codex does not replace final review, and Codex output must not be presented as independent multi-agent review unless separate real reviewer runs produce separate reports.

## Local multi-agent phases

Phase 1 added the infrastructure for future local/freemium multi-agent review:

- Agent prompts live in `.agent/prompts/`.
- Run reports belong in `.agent/reports/<run-id>/`.
- Safe scripts capture local diff/status context and blocked placeholders.

Phase 2A adds provider hooks:

- `MULTIAGENT_PROVIDER=noop` is the default and cannot approve a patch.
- `MULTIAGENT_PROVIDER=codex` uses Codex CLI as the first real reviewer provider through `codex exec`.
- `MULTIAGENT_PROVIDER=gemini` checks for Gemini CLI but remains blocked until an approved non-interactive command is wired.
- `MULTIAGENT_PROVIDER=ollama` can call `ollama run "$MULTIAGENT_OLLAMA_MODEL"` and validate the returned report format.
- `scripts/local-review.sh` writes separate minimum reviewer reports and a deterministic final verdict.

Phase 2B enables Codex review execution:

```bash
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
```

The deterministic safe-provider check is:

```bash
MULTIAGENT_PROVIDER=noop ./scripts/local-review.sh
```

`local-review` can generate real reports only when Codex is configured and returns valid reports with `Real execution: yes`. Valid reviewer verdicts are `PASS`, `PASS WITH NOTES`, `CHANGES REQUESTED`, `BLOCKED`, and `INFRASTRUCTURE BLOCKED`. Any missing, placeholder, empty, invalid, or non-real report remains `INFRASTRUCTURE BLOCKED`.

When Codex output is invalid, the wrapper keeps diagnostics in `.agent/reports/<run-id>/`, including `<agent>-codex-stdout.md`, `<agent>-codex-stderr.md`, `<agent>-codex-transcript.txt`, `<agent>-codex-diagnostics.md`, and `<agent>-codex-exit-code.txt`.

Gemini remains a nominal hook. Ollama remains experimental and optional, especially on 8 GB Intel Macs. OpenClaw is not part of Phase 2B. Automatic patch implementation is still disabled.

See `docs/multiagent-workflow.md` and `docs/codex-multiagent-setup.md` for the full policy and local setup.

## Runtime boundary

The shipped website must continue to work with normal Next.js commands only:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Do not add AI orchestration tools to `dependencies` or `devDependencies`. Do not require AI tooling, MCP servers, local agent runtimes, provider API keys, or external review services for deployment.

## Recommended workflow

### 1. Inspect

Before editing, inspect the relevant source and docs:

```bash
rg --files -g '!node_modules' -g '!.next'
cat package.json
sed -n '1,220p' README.md
sed -n '1,220p' docs/quest-guide.md
sed -n '1,260p' docs/visual-direction.md
```

For feature work, also inspect the relevant component, schema, or CSS file.

For scrollytelling work, inspect at minimum:

```bash
sed -n '1,220p' AGENTS.md
sed -n '1,220p' docs/architecture.md
sed -n '1,220p' components/story/StoryShell.tsx
sed -n '1,180p' components/story/ProgressIndicator.tsx
sed -n '1,180p' lib/useStoryProgress.ts
sed -n '1,220p' lib/storyConfig.ts
```

### 2. Plan

Write a short implementation plan before changing files. Call out:

- Files to edit
- Files intentionally avoided
- Validation commands to run
- Any risky areas, especially mini-games, visual assets, dependencies, or deployment configuration
- For scrollytelling changes: how chapter gating, local start CTA, and progress states remain intact

### 3. Implement

Keep changes small and scoped. Prefer documentation updates or isolated component changes. Do not modify mini-game logic, visual assets, dependency sections, deployment config, or secrets unless explicitly approved.

### 4. Validate

Run the normal project validations:

```bash
npm run lint
npm run build
```

If `node_modules/` is missing, install first:

```bash
npm install
```

If `npm run build` fails only because the environment cannot fetch Google Fonts through `next/font/google`, classify it as an environment/network limitation unless the task changed font loading or `app/layout.tsx`.

For perceptible UI changes, run the app locally and capture/review a screenshot when possible:

```bash
npm run dev
```

### 5. Review

Before merge, require independent review plus manual/human approval. Every patch requires real separate Code Review and QA / Regression reports. Add specialized reviewers when the patch touches frontend architecture, UX/accessibility, performance, scripts, CI, package files, AI workflow, or `AGENTS.md`.

The review should verify:

- Patch scope is small and matches the request.
- `npm run lint` passes.
- `npm run build` passes or has a documented environment-only failure.
- Mini-game logic was not changed unless explicitly requested.
- Visual assets in `public/` were not changed unless explicitly approved.
- Deployment configuration and environment files were not touched.
- Accessibility and mobile readability were preserved or improved.
- Documentation reflects any workflow or architecture changes.

Automatic approval is prohibited when separate reviewer reports are missing, simulated, incomplete, invalid, or marked `Real execution: no`. In that case the correct verdict is `INFRASTRUCTURE BLOCKED`.

For scrollytelling changes, also verify:

- The first intro chapter remains readable.
- Later narrative chapters are gated behind the previous required mini-game or story block.
- The first game is derived from story config such as `gameOrder`, not hardcoded in UI code.
- The first game has a local CTA if `started=false` and the user scrolls past the intro.
- Locked chapters show one clear locked explanation without duplicate nested locked copy.
- The progress indicator distinguishes `complete`, `available/current`, and `locked`.
- Available but incomplete games are not announced as locked.

## Safe first prompts

Good starter prompts for Codex in this repository:

- “Inspect the project structure and summarize the Next.js app, quest components, and docs without editing files.”
- “Review `docs/visual-direction.md` and list constraints to preserve before making layout changes.”
- “Find accessibility improvements for buttons and headings, then propose a plan before editing.”
- “Run lint/build and explain any failures without changing production code.”
- “Update documentation to reflect the current architecture; do not modify app code.”

Avoid broad prompts such as “improve the game,” “redesign the site,” or “upgrade everything” unless the scope and approvals are explicit.

## Validation command reference

```bash
npm install
npm run lint
npm run build
```

Record any environment limitations, such as unavailable CLI tools or package registry access restrictions, in the final report for the task.

## Troubleshooting

### `codex: command not found`

Codex CLI is separate from this repository. Install it on the developer machine when needed:

```bash
npm i -g @openai/codex
```

Do not add `@openai/codex` to this project's `dependencies` or `devDependencies` just to satisfy local CLI usage.

### `npm run build` fails on Google Fonts or `next/font`

This project uses Next font integration in `app/layout.tsx`. In restricted environments, `next build` may fail when it cannot fetch Google Fonts such as Manrope or Silkscreen. Treat that as an environment/network limitation unless the task explicitly asks to change font loading. Do not make invasive production-code changes only to bypass a local network restriction.
