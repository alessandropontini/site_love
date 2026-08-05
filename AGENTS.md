# AGENTS.md — Alessandro & Bridget: Teatro di cartone

## Project summary

This repository is `alessandropontini/site_love`, a private Next.js microsite named `dreamy-couple-gallery`. The shipped experience is **Alessandro & Bridget — La nostra avventura**: a mobile-first cardboard-theatre journey through an invitation, a Milan map, four accessible narrative challenges, collected keepsakes, and a gated final letter.

The paper-theatre experience mounted by `app/page.tsx` is the canonical product and the main narrative line. The earlier scrollytelling and pixel arcade implementations remain unmounted legacy references and must not be treated as the current home experience.

Codex is the only active AI development and review tool. An interactive Codex session may implement a scoped patch; approval evidence must come from one fresh read-only Codex execution launched by `scripts/local-review.sh`. The combined reviewer covers Code + QA and relevant specialist risks in one report. Final approval remains human.

Ruflo has been removed. CrewAI and OpenClaw are retained only as inactive experiments and compatibility documentation; they are not part of the release path or merge gate. Do not reintroduce automatic multi-agent orchestration without an explicit project decision.

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
- `lib/i18n.ts` — Italian/English dictionaries and free client-side locale detection.
- `lib/useExperienceProgress.ts` — versioned local state, gating, persistence, and reset.
- `public/scene/paper-theatre/` — active local transparent WebP theatre assets.
- `components/story/`, `components/games/`, `components/QuestGame.tsx`, `components/quest/`, and `components/pixel/` — unmounted legacy implementations.
- `docs/quest-guide.md` — active experience customization and regression guide.
- `docs/visual-direction.md` — approved visual/design direction.
- `docs/architecture.md` — architecture overview for maintainers and agents.
- `docs/ai-workflow.md` — Codex usage and manual review workflow guidance.
- `docs/multiagent-workflow.md` — canonical lean Codex review policy and report contract.
- `docs/codex-multiagent-setup.md` — operational setup for the single combined reviewer.
- `docs/crewai-orchestration.md` and `docs/openclaw-orchestration.md` — inactive experiment status.
- `.agent/prompts/review-code-qa.md` — combined independent reviewer prompt.
- `.agent/contracts/` — archived CrewAI/Codex design contracts.
- `.agent/reports/` — per-run context, validation, reviewer report, and deterministic verdict.
- `scripts/local-review.sh` — canonical review entrypoint.
- `scripts/local-multiagent.sh`, `scripts/crewai-orchestrate.sh`, and `scripts/openclaw-orchestrate.sh` — compatibility entrypoints only.
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

## Localization rules

- The mounted experience supports Italian (`it`) and English (`en`).
- All visible copy, status messages, accessible names, image alternatives, confirmations, and live-region announcements must come from `lib/i18n.ts` or localized fields in `lib/experienceConfig.ts`.
- Preserve the detection priority: saved manual choice, Italian geographic time zone, Italian browser language, then English fallback.
- Keep the visible `IT / EN` selector available on the invitation and journey toolbar.
- A manual selection must persist locally and update `html lang`, document title, and description.
- Challenge state must use language-independent IDs so switching language never resets progress or leaves mixed-language status text.
- Do not add runtime translation APIs or localization dependencies without explicit approval.

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
- CrewAI and OpenClaw are inactive experiments and cannot produce merge-gate evidence by themselves.
- Install Codex CLI separately when needed with `npm i -g @openai/codex`.
- Do not require Codex or any AI tool for `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, or deployment.
- Codex may implement scoped patches, read files, run commands, and summarize results.
- The implementation response cannot approve its own patch. Review must run in a fresh read-only `codex exec` process.
- Keep patches small, run `git diff --check`, `npm run lint`, and `npm run build`, then require human review before merge.
- Do not present simulated roles inside one response as independent review.

## Lean Codex Review Policy

- Every patch requires independent review before merge.
- The minimum review is one combined Code + QA report from a fresh read-only Codex execution.
- The combined reviewer must apply architecture, UX/accessibility, performance, and Git/workflow checks when relevant to touched files.
- The interactive implementer response cannot count as review evidence.
- The reviewer report must be real and stored under `.agent/reports/<run-id>/`.
- A reviewer report is real only when it contains `Real execution: yes` and a valid verdict.
- Valid reviewer verdicts are `PASS`, `PASS WITH NOTES`, `CHANGES REQUESTED`, `BLOCKED`, and `INFRASTRUCTURE BLOCKED`.
- Codex is the only active real review provider. A valid review must use `MULTIAGENT_PROVIDER=codex` and contain `Provider: codex` plus `Real execution: yes`.
- `noop` is only for smoke/regression testing workflow infrastructure and can never approve a patch or count as review.
- The deterministic aggregator must treat a missing, empty, invalid, or `Real execution: no` report as `INFRASTRUCTURE BLOCKED`.
- `git diff --check`, `npm run lint`, and `npm run build` are required validation inputs for approval.
- Pass the original request and acceptance criteria with `--request-file` whenever scope cannot be proven from the diff alone.
- Pass binary, screenshot, or environment verification with `--evidence-file` when it cannot be represented in the text diff.
- If the diff, essential request context, lint/build output, or real reviewer report is missing, the correct verdict is `INFRASTRUCTURE BLOCKED`.
- If the reviewer returns `CHANGES REQUESTED`, `BLOCKED`, or `INFRASTRUCTURE BLOCKED`, the patch is not mergeable.
- `PASS` and `PASS WITH NOTES` never authorize automatic merge; final human approval is always required.
- `PASS WITH NOTES` requires every note to be resolved or explicitly accepted before merge.
- No review command may commit, merge, or push.
