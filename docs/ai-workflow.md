# AI Workflow: Codex + Ruflo/Claude Flow

This project may use Ruflo/Claude Flow as a development orchestration layer for OpenAI Codex CLI. The repository or workflow may be called Ruflo, while the npm package used for setup may still be `claude-flow`. Ruflo/Claude Flow is not part of the Next.js website runtime and must not be added to `dependencies` or `devDependencies` unless the project owner explicitly approves that change.

## What Ruflo/Claude Flow is for in this repo

Use Ruflo/Claude Flow with Codex to coordinate development tasks such as inspection, documentation, small refactors, accessibility review, responsive layout analysis, lint/build validation, and implementation planning. The shipped website must continue to work with the normal Next.js commands only:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Setup notes

Install Codex CLI separately on the developer machine when it is not already available:

```bash
npm i -g @openai/codex
```

Initialize the orchestration tool through `npx` without adding it to this project's package dependencies:

```bash
npx claude-flow@alpha init --codex
```

After initialization, verify the MCP server registration:

```bash
codex mcp list
```

If Ruflo is not listed, register it manually:

```bash
codex mcp add ruflo -- npx claude-flow@alpha mcp start
```

Keep any project-local Ruflo/Codex guidance at the repository root. Do not commit secrets or environment-specific credentials.

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

### 4. Test

Run the normal project validations:

```bash
npm run lint
npm run build
```

If `node_modules/` is missing, install first:

```bash
npm install
```

For perceptible UI changes, run the app locally and capture/review a screenshot when possible:

```bash
npm run dev
```

### 5. Document

Update relevant docs when behavior, architecture, workflow, or customization paths change. For this project, consider:

- `README.md`
- `docs/quest-guide.md`
- `docs/visual-direction.md`
- `docs/architecture.md`
- `docs/ai-workflow.md`
- `AGENTS.md`

## Safe first prompts

Good starter prompts for Codex/Ruflo in this repository:

- “Inspect the project structure and summarize the Next.js app, quest components, and docs without editing files.”
- “Review `docs/visual-direction.md` and list constraints to preserve before making layout changes.”
- “Find accessibility improvements for buttons and headings, then propose a plan before editing.”
- “Run lint/build and explain any failures without changing production code.”
- “Update documentation to reflect the current architecture; do not modify app code.”

Avoid broad prompts such as “improve the game,” “redesign the site,” or “upgrade everything” unless the scope and approvals are explicit.

## Review checklist before accepting AI-generated changes

Before merging or accepting changes, verify:

- Ruflo/Claude Flow was not added to `dependencies` or `devDependencies`.
- The scripts `dev`, `build`, `start`, and `lint` still exist and keep their original purpose.
- Mini-game logic was not changed unless explicitly requested.
- Visual assets in `public/` were not changed unless explicitly approved.
- Deployment configuration and environment files were not touched.
- Accessibility and mobile readability were preserved or improved.
- `npm run lint` passes.
- `npm run build` passes.
- Documentation reflects any workflow or architecture changes.

For scrollytelling changes, also verify:

- The first intro chapter remains readable.
- Later narrative chapters are gated behind the previous required mini-game or story block.
- The first game is derived from story config such as `gameOrder`, not hardcoded in UI code.
- The first game has a local CTA if `started=false` and the user scrolls past the intro.
- Locked chapters show one clear locked explanation without duplicate nested locked copy.
- The progress indicator distinguishes `complete`, `available/current`, and `locked`.
- Available but incomplete games are not announced as locked.

## Validation command reference

```bash
npm install
npm run lint
npm run build
codex mcp list
```

If `codex mcp list` does not show Ruflo, run:

```bash
codex mcp add ruflo -- npx claude-flow@alpha mcp start
codex mcp list
```

Record any environment limitations, such as unavailable CLI tools or package registry access restrictions, in the final report for the task.

## Troubleshooting

### `npx ruflo@latest` returns 403

If `npx ruflo@latest init --codex` fails with a registry 403, do not add alternative packages to this Next.js app. Use the current package command instead:

```bash
npx claude-flow@alpha init --codex
```

Keep `npx ruflo@latest` only as historical context or troubleshooting evidence, not as the primary setup command.

### `codex: command not found`

Codex CLI is separate from this repository. Install it on the developer machine when needed:

```bash
npm i -g @openai/codex
```

Do not add `@openai/codex` to this project's `dependencies` or `devDependencies` just to satisfy local CLI usage.

### MCP is missing from `codex mcp list`

First confirm Codex CLI is installed and available on `PATH`:

```bash
codex mcp list
```

If Ruflo is absent, register the MCP server with:

```bash
codex mcp add ruflo -- npx claude-flow@alpha mcp start
codex mcp list
```

### `npm run build` fails on Google Fonts or `next/font`

This project uses Next font integration in `app/layout.tsx`. In restricted environments, `next build` may fail when it cannot fetch Google Fonts such as Manrope or Silkscreen. Treat that as an environment/network limitation unless the task explicitly asks to change font loading. Do not make invasive production-code changes only to bypass a local network restriction.

### Development tools vs runtime dependencies

Ruflo/Claude Flow and Codex CLI are developer orchestration tools. They should run through `npx` or a separately installed CLI and must not be imported by the app, bundled into the Next.js runtime, required by deployment, or added to package dependencies without explicit approval.
