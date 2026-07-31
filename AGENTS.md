# AGENTS.md — Alessandro & Bridget: Teatro di cartone

## Project summary

This repository is `alessandropontini/site_love`, a private Next.js microsite named `dreamy-couple-gallery`. The shipped experience is **Alessandro & Bridget — La nostra avventura**: a mobile-first cardboard-theatre journey through an invitation, a Milan map, four accessible narrative challenges, collected keepsakes, and a gated final letter.

The paper-theatre experience mounted by `app/page.tsx` is the canonical product and the main narrative line. The earlier scrollytelling and pixel arcade implementations remain unmounted legacy references and must not be treated as the current home experience.

Ruflo has been removed from the SITE LOVE workflow. Reviews do not use Ruflo, Claude Flow, MCP, WASM agents, or unvalidated automatic multi-agent orchestration. The local Ruflo/WASM runtime was retired because it did not produce autonomous review output without an external model provider/API key. Codex remains the active real executor/provider for implementation support, file inspection, lint/build execution, and independent reviewer reports.

OpenClaw is being evaluated as an optional experimental orchestrator above the existing Codex-backed workflow. It may coordinate reviewer roles and launch documented local workflow commands, but it must not replace Codex as the real provider, bypass `scripts/local-review.sh`, invent reports, auto-merge, push, or become required for runtime, lint, build, start, or deployment. See `docs/openclaw-orchestration.md`.

CrewAI is being evaluated as a pluggable orchestrator with a documented Codex executor boundary. CrewAI may generate structured Executor Requests and Codex may produce Executor Responses, but CrewAI must not directly modify the repository, bypass local review, or enter the merge gate without a separate reviewed project decision. See `.agent/contracts/crewai-codex-executor-contract.md`.

## Tech stack

- Next.js 14 App Router
- React 18
- TypeScript with strict compiler settings
- CSS Modules for the active experience, with shared base styling in `app/globals.css`
- Next font integration for Manrope UI text and a local system serif stack for editorial titles
- Custom CSS/SVG paper-stage compositions and optimized local WebP scene assets

## Key files and directories

- `package.json` — project name, scripts, and runtime/development dependencies.
- `app/layout.tsx` — metadata, font setup, and global stylesheet import.
- `app/page.tsx` — single-page entry point that renders `ExperienceShell`.
- `app/globals.css` — shared reset, base typography, and legacy styling.
- `components/experience/ExperienceShell.tsx` — canonical invitation/map/chapter/reward/finale controller.
- `components/experience/JourneyMap.tsx` — narrative map and chapter availability states.
- `components/experience/challenges/` — four active accessible narrative challenges.
- `components/experience/art/` — cardboard stage, landmarks, characters, and reward art.
- `components/experience/ExperienceShell.module.css` — active visual system and responsive layout.
- `lib/experienceConfig.ts` — canonical chapter order, copy, instructions, and rewards.
- `lib/useExperienceProgress.ts` — versioned local state, gating, persistence, and reset.
- `public/scene/paper-theatre/` — active local transparent WebP theatre assets.
- `components/story/`, `components/games/`, `components/QuestGame.tsx`, `components/quest/`, and `components/pixel/` — unmounted legacy implementations.
- `docs/quest-guide.md` — active experience customization and regression guide.
- `docs/visual-direction.md` — approved visual/design direction.
- `docs/architecture.md` — architecture overview for maintainers and agents.
- `docs/ai-workflow.md` — Codex usage and manual review workflow guidance.
- `docs/multiagent-workflow.md` — local multi-agent patch policy, provider hooks, and report rules.
- `docs/codex-multiagent-setup.md` — operational Codex reviewer setup notes.
- `docs/openclaw-orchestration.md` — optional OpenClaw orchestration spike and fallback rules.
- `.openclaw/` — experimental OpenClaw role and workflow templates.
- `.agent/prompts/` — separate implementer, reviewer, and aggregator prompts.
- `.agent/contracts/` — CrewAI/Codex executor contract, request/response templates, and document-only examples.
- `.agent/reports/` — per-run implementer/reviewer reports and captured context.
- `scripts/local-multiagent.sh`, `scripts/local-patch.sh`, `scripts/local-review.sh` — safe local workflow entrypoints.
- `scripts/openclaw-orchestrate.sh` — experimental safe OpenClaw wrapper and Codex fallback helper.
- `scripts/lib/multiagent-provider.sh` — provider abstraction and deterministic report aggregation.

## Safe tasks for Codex

Codex is appropriate for low-risk maintenance such as:

- Documentation updates in `README.md`, `docs/`, or this `AGENTS.md`.
- Small TypeScript refactors that preserve behavior and are backed by `npm run lint` and `npm run build`.
- Accessibility improvements that do not alter mini-game mechanics.
- Responsive layout polish that follows `docs/visual-direction.md`.
- Copy updates in metadata/content files when explicitly requested.
- Test, lint, and build troubleshooting that does not change deployment configuration.

Before changing the active paper-theatre experience, agents must read this `AGENTS.md`, `docs/architecture.md`, `docs/visual-direction.md`, and the relevant files under `components/experience/` and `lib/experienceConfig.ts`. If AI-assisted implementation or validation is part of the work, also read `docs/ai-workflow.md`.

## Risky tasks

Treat the following as risky and plan carefully before editing:

- Challenge sequencing, timers, completion rules, unlocks, and win-condition logic.
- Experience progression, persistence migrations, inventory, and finale gating.
- Major CSS rewrites affecting invitation, map, chapter, reward, inventory, or finale layout.
- Paper art, landmarks, characters, and visual-asset pipeline changes.
- Dependency upgrades, framework upgrades, or TypeScript config changes.
- Any change that could affect production deployment, environment variables, secrets, or hosting behavior.

## Files/directories requiring explicit approval before editing

Ask for explicit user approval before editing any of these paths:

- `components/experience/challenges/`
- `lib/useExperienceProgress.ts`
- `lib/experienceConfig.ts` chapter order or completion requirements
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

## Challenge logic rules

- Do not modify active challenge logic unless the user explicitly asks for that behavior.
- Preserve sequential chapter gating, idempotent rewards, finale requirements, keyboard/touch controls, and reduced-motion fallbacks.
- When challenge changes are requested, inspect the relevant file under `components/experience/challenges/` first, write a plan, and keep changes minimal and isolated.
- Validate challenge changes with `npm run lint` and `npm run build`; manually test the affected chapter in the browser when possible.
- Legacy arcade and scrollytelling mechanics are not part of the public route and should not be changed as a side effect of active experience work.

## Visual direction rules

- Follow `docs/visual-direction.md` as the source of truth for style decisions.
- Preserve the warm, tactile, cinematic cardboard-theatre love-story tone.
- Do not modify visual assets in `public/` without explicit approval.
- Keep Manrope for functional UI and the documented system serif stack for editorial titles.
- Maintain the approved Milan/Duomo, proscenium, tram, and layered paper-stage direction unless the user asks to revise it.

## Accessibility, mobile layout, and performance rules

- Keep interactive controls keyboard-accessible and clearly labeled.
- Maintain color contrast for text, controls, progress states, and game HUD elements.
- Respect mobile-first readability: actions and information should come before decorative scenery on small screens.
- Avoid fixed-width layouts that break on phones.
- Keep stage animation and timed challenge playback performant; avoid unnecessary React re-renders in animation paths.
- Preserve Next.js image/font optimizations and do not add heavyweight client libraries for orchestration or styling without approval.

## Paper-theatre progression rules

- The invitation must remain readable and the experience must not auto-start.
- Chapter order must come from `chapterOrder`/`experienceChapters`, not duplicated hardcoded arrays.
- Exactly the first incomplete chapter is available; later chapters remain locked until every previous chapter is complete.
- Completion and rewards must be idempotent, and inventory contents must derive from completed chapter IDs.
- The finale must require every configured chapter ID, not only a matching count.
- Persisted state must be sanitized and migrated without allowing locked chapters or the finale to open.
- Available, complete, and locked states must differ by text and semantics, not color alone.
- Reduced-motion system preference must override the saved in-app motion setting.
- Reset must require confirmation in the inventory flow and remove only SITE LOVE progress keys.
- Anti-regression checklist: invitation readable, map gating correct, rewards unique, finale fully gated, keyboard/touch completion available, focus restored after overlays, reduced motion respected, docs updated with code.

## AI assistance and review rules

- Ruflo has been removed from this project and must not be reintroduced as a required workflow tool without an explicit project decision.
- Do not add Ruflo, Claude Flow, MCP servers, WASM agents, Anthropic/Claude managed agents, or provider API keys to this repository.
- Do not add orchestration tools to `dependencies` or `devDependencies`.
- OpenClaw may be used only as an optional experimental orchestrator unless a future reviewed project decision promotes it.
- OpenClaw output is not valid review evidence unless it preserves real Codex-backed reviewer execution and the existing report contract.
- CrewAI may be used only as a pluggable orchestrator candidate unless a future reviewed project decision promotes it.
- CrewAI may generate Executor Requests for Codex, but it must not modify repository files directly or become merge-gate evidence by itself.
- Install Codex CLI separately when needed with `npm i -g @openai/codex`.
- Do not require Codex or any AI tool for `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, or deployment.
- Codex may implement scoped patches, read files, run commands, and summarize results, but it does not replace final manual/human review.
- The review process is: keep patches small and limited, run `npm run lint`, run `npm run build`, document any known environment-only build limitation, then require manual/human review before merge.
- Do not present simulated multi-agent output as an independent review.

## Multi-Agent Patch Policy

- Every patch requires independent review before merge.
- The minimum required independent reviewers are Code Review and QA / Regression.
- Add specialized reviewers when relevant:
  - Frontend Architect for React, Next.js routing, state, components, the paper-theatre experience, or architecture.
  - UX / Accessibility for UI, copy, interactions, mobile, focus, keyboard, semantics, or ARIA.
  - Performance for rendering, animation, scroll, bundle, images, or performance-sensitive paths.
  - Git / Workflow Reviewer for scripts, CI, operational docs, package files, AI workflow, or this `AGENTS.md`.
- The implementer cannot approve their own patch.
- Reviewer reports must be real, separate, and stored under `.agent/reports/<run-id>/`.
- A reviewer report is real only when it contains `Real execution: yes` and a valid verdict.
- Valid reviewer verdicts are `PASS`, `PASS WITH NOTES`, `CHANGES REQUESTED`, `BLOCKED`, and `INFRASTRUCTURE BLOCKED`.
- Codex is the only active real review provider. A valid review must be run with `MULTIAGENT_PROVIDER=codex` and each required report must contain `Provider: codex` and `Real execution: yes`.
- `noop` is only for smoke/regression testing workflow infrastructure and can never approve a patch or count as review.
- The deterministic aggregator must treat missing, empty, invalid, or `Real execution: no` reports as `INFRASTRUCTURE BLOCKED`.
- OpenClaw is an optional experimental orchestrator in the Phase 5 spike. It is not a provider and cannot approve patches independently of the Codex-backed workflow.
- `git diff --check`, `npm run lint`, and `npm run build` are required validation inputs for approval.
- If the diff is missing, lint/build output is missing, or required real reviewer reports are missing, the correct verdict is `INFRASTRUCTURE BLOCKED`.
- If any reviewer returns `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`, the patch is not mergeable.
- `PASS` and `PASS WITH NOTES` never authorize automatic merge; final human approval is always required.
- `PASS WITH NOTES` requires every note to be resolved or explicitly accepted before merge.
- Ruflo must not be reintroduced as a required workflow tool without an explicit project decision.
- Simulated multi-agent reviews are prohibited; do not ask one model to pretend to be several independent reviewers.
