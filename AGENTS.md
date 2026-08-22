# AGENTS.md — Alessandro & Bridget: home editoriale + RSVP

## Project summary

This repository is `alessandropontini/site_love`, a private Next.js microsite named `dreamy-couple-gallery`. The shipped experience is **Alessandro & Bridget — La nostra avventura**: one freely readable bilingual editorial wedding home. Its public flow is invitation → personal photographs → Casa Nuova Niviano location → RSVP information. The four-stop story timeline and final letter are retained in the codebase but are not currently mounted on the public home.

`app/page.tsx` is the canonical public-home route. `/rsvp/[token]` is the personalized household response route and `/admin/rsvp` is the spouses-only administration route. The unlinked `/duomo-proposals` and `/sun-proposals` routes remain internal visual-review surfaces in development and return 404 in production. The paper-theatre `ExperienceShell`, its four challenges, progression hook, migrations, and saved-state contract remain in the repository for a possible future project, but are not mounted or reachable from this wedding site. No game code or existing browser progress is deleted as part of this separation. Earlier scrollytelling and pixel arcade implementations are likewise unmounted references.

The home RSVP section is deliberately informational. The implemented invitation flow uses one personal QR code per invited household and an opaque route token at `/rsvp/[token]`, backed by server-side Neon storage when production services are configured. Do not publish guest data, response data, RSVP tokens, exports, backups, manifests, or generated QR codes in `public/`, client bundles, source-controlled configuration, or `localStorage`.

Codex is the only active AI development and review tool. Routine, scoped work is validated in the interactive session; an independent read-only Codex review is reserved for releases and high-risk changes. Final approval remains human.

Ruflo has been removed. CrewAI and OpenClaw are retained only as inactive experiments and compatibility documentation; they are not part of the release path or merge gate. Do not reintroduce automatic multi-agent orchestration without an explicit project decision.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript 6 with strict compiler settings
- CSS Modules for the public home and retained dormant experiences, with shared base styling in `app/globals.css`
- Next font integration for Instrument Sans UI text and Newsreader editorial titles
- Three.js isolated to the home hero, plus custom CSS/SVG paper-stage compositions and optimized local scene assets
- Neon Postgres for server-side RSVP persistence, Zod validation, and Cloudflare Turnstile abuse protection
- Clerk identity plus an explicit email allowlist for the spouses-only administration area

## Key files and directories

- `package.json` — project name, scripts, and runtime/development dependencies.
- `CHANGELOG.md` — concise, human-readable record of completed changes; update its `Unreleased` section with every completed task.
- `app/layout.tsx` — metadata, font setup, and global stylesheet import.
- `app/page.tsx` — editorial home entry point that renders `EditorialHome`.
- `app/globals.css` — shared reset, base typography, and legacy styling.
- `components/editorial/` — editorial navigation, hero, gallery, `WeddingVenue`, informational `RsvpSection`, footer, and retained unmounted story/letter components.
- `lib/editorialConfig.ts` — centralized bilingual editorial copy, section IDs, and asset mapping.
- `components/experience/ExperienceShell.tsx` — retained but unmounted invitation/map/chapter/reward/finale controller.
- `components/experience/JourneyMap.tsx` — narrative map and chapter availability states.
- `components/experience/challenges/` — four retained accessible narrative challenges, not mounted publicly.
- `components/experience/art/` — cardboard stage, landmarks, characters, and reward art.
- `components/experience/ExperienceShell.module.css` — retained visual system and responsive layout.
- `lib/experienceConfig.ts` — canonical chapter order, copy, instructions, and rewards.
- `lib/i18n.ts` — Italian/English dictionaries and free client-side locale detection.
- `lib/useExperienceProgress.ts` — versioned local state, gating, persistence, and reset.
- `public/photos/` — approved local personal imagery and, when supplied, authorized venue imagery; remove EXIF and location metadata before adding files.
- `public/scene/paper-theatre/` — retained local theatre assets; only explicitly referenced editorial art is loaded by the public home.
- `components/story/`, `components/games/`, `components/QuestGame.tsx`, `components/quest/`, and `components/pixel/` — unmounted legacy implementations.
- `docs/rsvp.md` — RSVP privacy, token, QR, and backend contract.
- `docs/deployment.md` — low-cost hosting, service configuration, QR generation, and launch checklist.
- `docs/architecture-diagram.md` — runtime, release, identity, data, rollback, and backup diagram.
- `docs/operations-guide.md` — Italian operational runbook for dashboards, commands, recurring checks, and incidents.
- `docs/privacy.md` — data minimization, access, retention, deletion, and incident guidance.
- `docs/quest-guide.md` — maintenance guide for the retained, unmounted paper-theatre experience.
- `docs/visual-direction.md` — approved visual/design direction.
- `docs/architecture.md` — architecture overview for maintainers and agents.
- `docs/ai-workflow.md` — Codex usage and manual review workflow guidance.
- `docs/multiagent-workflow.md` — risk-based independent review policy and report contract.
- `docs/codex-multiagent-setup.md` — operational setup for an on-demand combined reviewer.
- `docs/crewai-orchestration.md` and `docs/openclaw-orchestration.md` — inactive experiment status.
- `.agent/prompts/review-code-qa.md` — combined independent reviewer prompt.
- `.agent/contracts/` — archived CrewAI/Codex design contracts.
- `.agent/reports/` — per-run context, validation, reviewer report, and deterministic verdict.
- `scripts/local-review.sh` — on-demand release and high-risk review entrypoint.
- `scripts/local-multiagent.sh`, `scripts/crewai-orchestrate.sh`, and `scripts/openclaw-orchestrate.sh` — compatibility entrypoints only.
- `scripts/lib/multiagent-provider.sh` — provider abstraction and deterministic report aggregation.

## Safe tasks for Codex

Codex is appropriate for low-risk maintenance such as:

- Documentation updates in `README.md`, `docs/`, or this `AGENTS.md`.
- Small TypeScript refactors that preserve behavior and are backed by `npm run lint` and `npm run build`.
- Accessibility improvements to the public home that do not alter retained mini-game mechanics.
- Responsive layout polish that follows `docs/visual-direction.md`.
- Copy updates in metadata/content files when explicitly requested.
- Test, lint, and build troubleshooting that does not change deployment configuration.

Before changing the retained paper-theatre experience, agents must read this `AGENTS.md`, `docs/architecture.md`, `docs/visual-direction.md`, and the relevant files under `components/experience/` and `lib/experienceConfig.ts`. Do not remount it or expose a game route without an explicit product decision. If AI-assisted implementation or validation is part of the work, also read `docs/ai-workflow.md`.

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

- Do not modify retained challenge logic unless the user explicitly asks for that behavior.
- Preserve sequential chapter gating, idempotent rewards, finale requirements, keyboard/touch controls, and reduced-motion fallbacks.
- When challenge changes are requested, inspect the relevant file under `components/experience/challenges/` first, write a plan, and keep changes minimal and isolated.
- Validate challenge changes with `npm run lint` and `npm run build`; manually test the affected chapter in the browser when possible.
- The paper-theatre, legacy arcade, and scrollytelling mechanics are not part of the public route and should not be changed as a side effect of wedding-home work.

## Visual direction rules

- Follow `docs/visual-direction.md` as the source of truth for style decisions.
- Preserve the warm, tactile, adult editorial love-story tone.
- Do not modify visual assets in `public/` without explicit approval.
- Keep Instrument Sans for functional UI and Newsreader for editorial display text.
- Keep the public sequence on `/` as invitation → photographs → Casa Nuova Niviano → RSVP unless the user asks to revise it.
- Use factual venue information and the official Casa Nuova Niviano link. Do not claim that third-party venue photographs are licensed for reuse; authorized venue photography still needs to be supplied.
- Personal photographs must be stored locally, optimized, and stripped of EXIF, GPS, and other unnecessary metadata before they enter `public/`.

## Accessibility, mobile layout, and performance rules

- Keep interactive controls keyboard-accessible and clearly labeled.
- Maintain color contrast for public text and controls; preserve it in dormant progress states and game HUD elements when those files are deliberately edited.
- Respect mobile-first readability: actions and information should come before decorative scenery on small screens.
- Avoid fixed-width layouts that break on phones.
- Keep the hero animation performant; preserve dormant stage and challenge performance when those files are deliberately edited.
- Preserve Next.js image/font optimizations and do not add heavyweight client libraries for orchestration or styling without approval.

## Localization rules

- The mounted home supports Italian (`it`) and English (`en`).
- Public-home copy, accessible names, image alternatives, and statuses belong in `lib/editorialConfig.ts`; retained shared/game copy belongs in `lib/i18n.ts` or localized fields in `lib/experienceConfig.ts`.
- Preserve the detection priority: saved manual choice, Italian geographic time zone, Italian browser language, then English fallback.
- Keep the visible `IT / EN` selector available on the editorial navigation and footer.
- A manual selection must persist locally and update `html lang`, document title, and description.
- Challenge state must use language-independent IDs so switching language never resets progress or leaves mixed-language status text.
- Do not add runtime translation APIs or localization dependencies without explicit approval.

## RSVP rules

- Keep the home RSVP section informational. The real form belongs only on the personalized route and must show an unavailable state rather than fake success when no backend exists.
- The canonical personalized URL is `/rsvp/[token]`, where `token` is random, opaque, high entropy, and contains no readable name, email, phone number, household ID, or attendance state.
- Resolve tokens and persist responses only on the server with validation, Turnstile in production, rate limiting, optimistic concurrency, and a metadata-only audit trail.
- Keep guest data minimized to invited name, attendance, structured meal preference, and timestamps. Do not add free-text health/accessibility fields without a separate reviewed privacy decision.
- Protect every admin page, export route, and mutation independently with Clerk authentication plus the explicit admin allowlist. Registration alone never grants authorization.
- Never commit guest lists, token-to-household mappings, RSVP responses, or generated QR images to the repository.
- Never use `localStorage` as the RSVP system of record. It is acceptable only for non-sensitive interface preferences such as locale.
- Generate final QR codes only after the production domain and backend route are stable, using the private generator outside the repository. The games, if revived later, require a different route or distribution channel and a separate QR.

## Retained paper-theatre progression rules

These invariants apply only if the dormant experience is intentionally edited or revived; they do not imply a public game route.

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
- Keep patches small. Select validation in proportion to the change: documentation needs `git diff --check`; code changes need lint and the relevant test/build; visible public changes also need a local browser check.
- Update the `Unreleased` section of `CHANGELOG.md` and every directly affected guide or README section before handoff. State explicitly when no additional guide is affected.
- At handoff, return a short summary, validation results, known limitations, and a proposed commit message. Do not commit, merge, or push unless the user asks.
- Do not present simulated roles inside one response as independent review.

## Risk-based Codex review policy

Routine changes do **not** require a separate reviewer: documentation and copy edits, contained visual polish, focused bug fixes, and small refactors that do not alter public routes, data, privacy, dependencies, or retained-game behavior. The implementer must still inspect the diff and run proportionate validation.

Run one fresh, read-only Codex review with `scripts/local-review.sh` only when preparing a release or when a change affects any of the following:

- dependencies, Next.js/React/TypeScript configuration, build, deployment, environment variables, security, or authentication;
- RSVP routes, guest data, tokens, QR codes, storage, or privacy boundaries;
- public routing, major architectural refactors, or a significant accessibility/performance change;
- retained-game progression, challenge logic, persistence, rewards, reset, or finale gating;
- new or changed personal/venue assets, where provenance and metadata evidence are required;
- any change the user explicitly asks to have independently reviewed.

When a review is required, provide the request plus any non-diff evidence, and retain the resulting report under `.agent/reports/`. A `PASS` or `PASS WITH NOTES` is evidence for human decision-making, never an automatic commit, merge, or push. `noop` remains limited to workflow smoke tests.

## Documentation and cleanup policy

- Every completed task updates `CHANGELOG.md` under `Unreleased`, using concise user-facing language.
- Update the directly affected README or guide when behavior, setup, workflow, architecture, privacy, or maintenance instructions change; do not duplicate unchanged reference material.
- Keep unrelated work out of a cleanup patch. Before deleting legacy code, assets, scripts, reports, or documentation, first provide an inventory, explain dependencies, and obtain explicit approval for the exact targets.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
