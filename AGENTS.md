# AGENTS.md — Pixel Quest: Alessandro & Bridget

## Project summary

This repository is `alessandropontini/site_love`, a private Next.js microsite named `dreamy-couple-gallery`. The shipped experience is **Pixel Quest: Alessandro & Bridget**: a retro/pixel-style love-story quest with a title screen, map progression, four mini-games, shared heart collection, and an epilogue.

Ruflo has been removed from the SITE LOVE workflow. Reviews do not use Ruflo, Claude Flow, MCP, WASM agents, or automatic multi-agent orchestration. The local Ruflo/WASM runtime was retired because it did not produce autonomous review output without an external model provider/API key. Codex remains available as an operational coding assistant for implementation, file inspection, lint/build execution, and concise summaries.

## Tech stack

- Next.js 14 App Router
- React 18
- TypeScript with strict compiler settings
- CSS-driven retro/pixel styling in `app/globals.css`
- Next font integration for Manrope UI text and Silkscreen title accents
- Custom CSS/pixel-art components and static scene assets

## Key files and directories

- `package.json` — project name, scripts, and runtime/development dependencies.
- `app/layout.tsx` — metadata, font setup, and global stylesheet import.
- `app/page.tsx` — single-page entry point that renders the quest shell.
- `app/globals.css` — global theme tokens, responsive layout rules, CRT/pixel styling, and game panel styling.
- `components/QuestGame.tsx` — top-level quest state, intro/map/game/ending flow, heart totals, character selection, and dev skip handling.
- `components/quest/questSchema.tsx` — chapter metadata and game component registration.
- `components/quest/games/` — mini-game implementations.
- `components/pixel/` — custom pixel characters and landmarks.
- `public/scene/` and `public/photos/` — static visual assets.
- `lib/profile.ts` and `lib/photos.ts` — site content/profile and photo metadata.
- `docs/quest-guide.md` — gameplay customization guide.
- `docs/visual-direction.md` — approved visual/design direction.
- `docs/architecture.md` — architecture overview for maintainers and agents.
- `docs/ai-workflow.md` — Codex usage and manual review workflow guidance.
- `docs/multiagent-workflow.md` — Phase 1 local multi-agent patch policy and report rules.
- `.agent/prompts/` — separate implementer, reviewer, and aggregator prompts.
- `.agent/reports/` — per-run implementer/reviewer reports and captured context.
- `scripts/local-multiagent.sh`, `scripts/local-patch.sh`, `scripts/local-review.sh` — safe Phase 1 workflow placeholders.
- `components/story/` — scrollytelling shell, scroll scenes, and progress indicator.
- `components/games/` — lightweight scrollytelling mini-games.
- `lib/storyConfig.ts` and `lib/useStoryProgress.ts` — scrollytelling content/config and progress state.

## Safe tasks for Codex

Codex is appropriate for low-risk maintenance such as:

- Documentation updates in `README.md`, `docs/`, or this `AGENTS.md`.
- Small TypeScript refactors that preserve behavior and are backed by `npm run lint` and `npm run build`.
- Accessibility improvements that do not alter mini-game mechanics.
- Responsive layout polish that follows `docs/visual-direction.md`.
- Copy updates in metadata/content files when explicitly requested.
- Test, lint, and build troubleshooting that does not change deployment configuration.

Before changing the scrollytelling feature, agents must read this `AGENTS.md`, `docs/architecture.md`, and the relevant story files. If AI-assisted implementation or validation is part of the work, also read `docs/ai-workflow.md`.

## Risky tasks

Treat the following as risky and plan carefully before editing:

- Mini-game physics, timers, scoring, collision, unlock, and win-condition logic.
- Quest progression and reward-heart accounting.
- Major CSS rewrites affecting intro, map, or game-panel layout.
- Pixel art, landmarks, sprites, and visual-asset pipeline changes.
- Dependency upgrades, framework upgrades, or TypeScript config changes.
- Any change that could affect production deployment, environment variables, secrets, or hosting behavior.

## Files/directories requiring explicit approval before editing

Ask for explicit user approval before editing any of these paths:

- `components/quest/games/`
- `components/quest/questSchema.tsx`
- `components/QuestGame.tsx`
- `components/pixel/`
- `public/`
- `app/globals.css`
- `next.config.mjs`
- `package.json` dependency sections
- `package-lock.json` dependency graph changes
- `.env`, `.env.*`, secrets, credentials, or deployment-specific files

Documentation-only changes describing these files are allowed when they do not modify the files themselves.

## Mini-game logic rules

- Do not modify mini-game logic unless the user explicitly asks for that specific game behavior.
- Preserve current win conditions, score/reward flow, collision detection, movement physics, timers, keyboard/touch controls, and dev skip behavior.
- When game changes are requested, inspect the relevant file first, write a plan, and keep changes minimal and isolated.
- Validate game-related changes with `npm run lint` and `npm run build`; manually test the affected game in the browser when possible.

## Visual direction rules

- Follow `docs/visual-direction.md` as the source of truth for style decisions.
- Preserve the retro, warm, pixel-art love-story tone.
- Do not modify visual assets in `public/` without explicit approval.
- Keep Silkscreen for short title/accent moments and prefer clean readable UI text elsewhere.
- Maintain the approved Milan/Italian city-entry sign/Duomo direction unless the user asks to revise it.

## Accessibility, mobile layout, and performance rules

- Keep interactive controls keyboard-accessible and clearly labeled.
- Maintain color contrast for text, controls, progress states, and game HUD elements.
- Respect mobile-first readability: actions and information should come before decorative scenery on small screens.
- Avoid fixed-width layouts that break on phones.
- Keep animation and real-time game loops performant; avoid unnecessary React re-renders in animation paths.
- Preserve Next.js image/font optimizations and do not add heavyweight client libraries for orchestration or styling without approval.

## Scrollytelling progression rules

- The first intro chapter must always be readable.
- Story gating applies to both mini-games and later narrative chapters.
- Future narrative chapters must depend on completion of the previous required mini-game or story block.
- The first game must be derived from story configuration such as `gameOrder`, not hardcoded in UI code.
- If `started=false` and the user reaches the first game without using the intro CTA, show a local CTA such as `Inizia il capitolo`; do not rely only on the intro CTA.
- Do not auto-start the story unless that behavior is explicitly requested.
- Locked chapters should present one clear locked explanation; avoid duplicate locked copy from nested game slots.
- The progress indicator must distinguish `complete`, `available/current`, and `locked`; never label an available but incomplete game as locked.
- Anti-regression checklist for story changes: first chapter readable, future chapters gated, first game config-driven and locally startable, no duplicate locked copy, progress states correct, docs updated with the code.

## AI assistance and review rules

- Ruflo has been removed from this project and must not be reintroduced as a required workflow tool without an explicit project decision.
- Do not add Ruflo, Claude Flow, MCP servers, WASM agents, Anthropic/Claude managed agents, or provider API keys to this repository.
- Do not add orchestration tools to `dependencies` or `devDependencies`.
- Install Codex CLI separately when needed with `npm i -g @openai/codex`.
- Do not require Codex or any AI tool for `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, or deployment.
- Codex may implement scoped patches, read files, run commands, and summarize results, but it does not replace final manual/human review.
- The review process is: keep patches small and limited, run `npm run lint`, run `npm run build`, document any known environment-only build limitation, then require manual/human review before merge.
- Do not present simulated multi-agent output as an independent review.

## Multi-Agent Patch Policy

- Every patch requires independent review before merge.
- The minimum required independent reviewers are Code Review and QA / Regression.
- Add specialized reviewers when relevant:
  - Frontend Architect for React, Next.js routing, state, components, scrollytelling, or architecture.
  - UX / Accessibility for UI, copy, interactions, mobile, focus, keyboard, semantics, or ARIA.
  - Performance for rendering, animation, scroll, bundle, images, or performance-sensitive paths.
  - Git / Workflow Reviewer for scripts, CI, operational docs, package files, AI workflow, or this `AGENTS.md`.
- The implementer cannot approve their own patch.
- Reviewer reports must be real, separate, and stored under `.agent/reports/<run-id>/`.
- `git diff --check`, `npm run lint`, and `npm run build` are required validation inputs for approval.
- If the diff is missing, lint/build output is missing, or required real reviewer reports are missing, the correct verdict is `INFRASTRUCTURE BLOCKED`.
- If any reviewer returns `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`, the patch is not mergeable.
- Ruflo must not be reintroduced as a required workflow tool without an explicit project decision.
- Simulated multi-agent reviews are prohibited; do not ask one model to pretend to be several independent reviewers.
