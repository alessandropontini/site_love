# Architecture Overview

Alessandro & Bridget is a single-page Next.js 14 App Router experience. The public route is a state-driven journey with an invitation, a paper-theatre index, four lightweight challenges presented as illustrated book chapters, four rewards, a persistent inventory, and a gated Duomo finale.

This paper-theatre route is the canonical product architecture and the main narrative line for production. Legacy trees remain in the repository for reference, but changes to them do not change the shipped home unless `app/page.tsx` is deliberately remounted.

## Next.js app structure

- `app/layout.tsx` defines app metadata, loads the Manrope UI font, and imports `app/globals.css`. Editorial headings use a local system serif stack, so the public route has no decorative font download.
- `app/page.tsx` is a minimal Server Component that mounts `ExperienceShell`.
- `next.config.mjs` contains Next.js configuration for remote image host patterns.
- `tsconfig.json` enables strict TypeScript settings and the `@/*` path alias.

The app is intended to run through the standard scripts in `package.json`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Current experience structure

- `components/experience/ExperienceShell.tsx` mounts exactly one active screen and owns navigation, focus changes, toolbar state, inventory visibility, and live announcements.
- `components/experience/JourneyMap.tsx` renders the theatre index and its semantic ordered list of chapter nodes over the visual Milan route.
- `components/experience/ChapterExperience.tsx` provides the responsive hard-cover book frame, its one-time cover opening, the development-only completion shortcut, the chapter palette, and configured challenge selection.
- `components/experience/challenges/` contains the frequency, pairing, ordering, and window-sequence interactions.
- `components/experience/art/` contains the shared paper-stage composition, per-chapter Milan landmark selection, and accessible-independent reward iconography.
- `components/experience/RewardScene.tsx` presents the newly collected object.
- `components/experience/InventoryPanel.tsx` is the persistent, dismissible memory drawer with a confirmed reset action.
- `components/experience/FinaleExperience.tsx` assembles the four objects and reveals the final letter.
- `components/experience/ExperienceShell.module.css` contains the isolated design system, responsive layout, scene art, and reduced-motion behavior.
- `lib/experienceConfig.ts` is the serializable source of truth for chapter order, copy, tones, instructions, and rewards.
- `lib/i18n.ts` contains the Italian/English interface dictionaries and the provider-independent locale detection rules.
- `components/experience/LocaleProvider.tsx` owns the active locale, manual selector, local persistence, `html lang`, and client-side metadata updates.
- `lib/useExperienceProgress.ts` provides versioned local persistence, sequential gating, legacy migration, reset, and finale guards.

The inventory is derived from completed chapter IDs and is never persisted separately. Stored progress is normalized to a closed prefix of configured chapters, so malformed or out-of-order data cannot skip the journey. The finale uses `every()` across configured IDs rather than trusting a numeric count.

The public screen sequence is:

```text
invitation → map → chapter → reward → map → … → finale
```

There is no automatic start, timer-authoritative progression, external API, account, database, analytics service, or paid runtime dependency.

## Localization

The active route is bilingual without a runtime translation service or localization dependency. Chapter structure remains language-independent: `chapterOrder` contains stable IDs, while `getExperienceChapters(locale)` resolves localized copy. Challenge state also stores IDs and phase values rather than translated labels, so a language switch does not reset progress or leave stale messages.

Initial locale priority is:

1. A previous manual choice saved under `site-love-locale-v1`.
2. An Italian geographic time zone (`Europe/Rome`, `Europe/San_Marino`, or `Europe/Vatican`).
3. An Italian browser language.
4. English fallback.

The visible `IT / EN` control is available before and after entering the journey. Switching locale updates the mounted copy, accessible names, live messages, `html lang`, document title, and description. Detection is client-side and privacy-preserving; exact IP-country detection can be added later at the hosting edge without changing chapter or challenge state.

## Legacy implementations

The earlier scrollytelling implementation remains under `components/story/`, `components/games/`, `components/finale/`, `lib/storyConfig.ts`, and `lib/useStoryProgress.ts`. It is not mounted by `app/page.tsx`.

The legacy arcade quest remains under `components/QuestGame.tsx`, `components/quest/`, and `components/quest/games/`. It is also not mounted by the public route.

These trees are retained only for reference and possible future extraction; they do not share state with the current experience.

## Experience progression invariants

- The invitation is always readable and never auto-starts.
- The first configured chapter is available; each later chapter requires every previous chapter.
- Locked chapters are disabled and never mounted as hidden game panels.
- A successful challenge is idempotent and cannot duplicate its reward.
- Returning to a completed chapter offers replay without removing progress.
- Completion is saved before the reward scene, so a reload cannot lose the newly earned object.
- The finale opens only when all configured chapter IDs are complete.
- Reset requires confirmation and removes the current and legacy storage keys.
- Version 3 keeps the first three completed chapters from version 2 but deliberately reopens the replaced fourth challenge.
- A visible saved control can reduce motion; the operating-system reduced-motion preference always takes precedence.

## Accessibility and mobile behavior

- Only the current screen is interactive and present in the main flow.
- Every change of screen focuses the new `<main>` region and emits a short polite announcement.
- The map exposes chapter state in text and marks the available step with `aria-current="step"`.
- All challenges have tap/keyboard paths; none require drag, hover, sound, or a timer.
- Interactive targets are at least 44 px high in the mobile layouts.
- Scenes use `100svh` with `100dvh` enhancement and safe-area padding.
- Motion-off mode and `prefers-reduced-motion` remove decorative transitions.

## Cost and delivery boundary

The runtime uses only Next.js, React, local CSS/SVG, local scene assets, and browser `localStorage`. No new package, paid API, map tile service, image CDN, database, or analytics provider is required. A temporary public preview may use a free Cloudflare quick tunnel; its generated URL is ephemeral and must not be treated as permanent hosting.

## Previous component reference

The following legacy notes remain useful when inspecting old code, but do not describe the mounted route.

- `components/story/StoryShell.tsx` is the earlier scrollytelling controller.
- `components/story/ScrollScene.tsx` renders earlier scroll scenes.
- `components/story/ProgressIndicator.tsx` renders the earlier compact progress indicator.
- `components/games/` contains the earlier quiz, memory, puzzle, and hidden-object interactions.
- `components/finale/FinalReveal.tsx` renders the earlier final reveal.
- `components/QuestGame.tsx` is the top-level interactive controller. It manages the intro, map, active game, ending screen, selected character, completed chapters, heart totals, attempt counts, leaderboard entries, and game-panel scroll locking.
- `components/quest/QuestMap.tsx` renders the map/progression layer.
- `components/quest/QuestEventPanel.tsx` hosts the currently selected chapter game.
- `components/quest/QuestLeaderboard.tsx` and `components/quest/QuestSummary.tsx` render supporting progress and end-state UI.
- `components/pixel/PixelCharacter.tsx` and `components/pixel/PixelLandmark.tsx` render custom pixel-style characters and landmark scenery.

## Legacy scrollytelling structure

Scrollytelling content and state live in:

- `lib/storyConfig.ts` for chapters, game order, accessible game labels, quiz questions, memory pairs, puzzle tiles, and hidden objects.
- `lib/useStoryProgress.ts` for session state, `localStorage` persistence, game unlocks, and finale unlocks.

Story gating applies to both games and later narrative chapters. The first intro chapter is always readable. Future chapters depend on completion of the previous required mini-game or story block. The first game should be derived from `gameOrder` rather than hardcoded in UI code. If a user scrolls to the first game before pressing the intro CTA, `StoryShell` must provide a local start CTA instead of relying on auto-start. Locked chapters should expose one clear locked explanation and avoid duplicate nested locked messages.

Progress indicators must represent three distinct states: `complete`, `available/current`, and `locked`. Do not label an available but incomplete game as locked.

The legacy first game is treated as available even before the old story has started. This rule applies to the unmounted scrollytelling tree, not the current map experience.

## Quest and game structure

Quest metadata lives in `components/quest/questSchema.tsx`. It defines:

- The `EventKey` union for the four chapter keys.
- Shared progress snapshot and event metadata types.
- `QUEST_EVENTS`, which maps each chapter to title, subtitle, description, location, year, colors, reward hearts, and the React component used to render the game.
- Unlock/progress helpers used by the quest map flow.

Mini-game implementations live in `components/quest/games/`:

| Chapter key | File | Role |
| --- | --- | --- |
| `tetris` | `components/quest/games/TetrisQuest.tsx` | Falling-block heart collection stage. |
| `pacmaze` | `components/quest/games/PacMazeQuest.tsx` | Maze navigation stage with hearts and a ghost/doubt. |
| `flappy` | `components/quest/games/FlappyLettersQuest.tsx` | Flappy-style rooftop letter stage. |
| `platformer` | `components/quest/games/PlatformRunQuest.tsx` | Side-scroller vow-coin runner stage. |

Mini-game mechanics, physics, scoring, collision, and win conditions are high-risk areas. Edit them only with explicit approval and focused validation.

## Styling structure

Legacy global styling remains concentrated in `app/globals.css`, including:

- Theme color custom properties.
- Player/partner accent color switching through root data attributes.
- Base layout and typography.
- Intro/map/game/ending screens.
- Responsive behavior and game scroll locking.
- Retro/pixel visual treatments.

The current experience layout and controls are isolated in `components/experience/ExperienceShell.module.css`; the decorative stage layers live in `components/experience/art/PaperArt.module.css`. Use `docs/visual-direction.md` as the design source of truth before changing layout, typography, paper assets, lighting, or motion.

## Content and static assets

- `lib/profile.ts` contains title-screen profile and intro copy.
- `lib/photos.ts` contains photo metadata.
- `public/photos/` contains photo documentation/placeholders.
- `public/scene/paper-theatre/` contains the active opaque JPEG panoramas for the entrance, four chapters, and finale, plus PNG compatibility overlays for the couple, tram, and tuning radio. Source WebP cutouts and older paper/pixel assets remain as rollback or unmounted references. Opaque stage art prevents Android/WebView alpha-compositing rectangles.
- `data/` is ignored except for `.gitkeep` and can hold heavyweight local concept art or exports.

Do not modify visual assets in `public/` without explicit approval.

## Design documentation references

- `README.md` gives the high-level project overview, local commands, gameplay sequence, customization paths, and production-build notes.
- `docs/quest-guide.md` documents the active chapter configuration, challenge files, progress invariants, paper art, and regression checks.
- `docs/visual-direction.md` records the current paper-theatre direction, Milan/Duomo composition guidance, typography, materials, motion, and responsive rules.
- `docs/ai-workflow.md` documents Codex usage, validation commands, and the manual review process for this repository.
- `docs/multiagent-workflow.md` documents the lean Codex review policy, combined report contract, and verdict rules.

## AI assistance and review workflow

AI workflow guidance lives in `AGENTS.md`, `docs/ai-workflow.md`, and `docs/multiagent-workflow.md`. Codex is the only active AI development and review tool; CrewAI, OpenClaw, and Ruflo are outside the release path.

- Do not add Ruflo, Claude Flow, MCP servers, WASM agents, Anthropic/Claude managed agents, or provider API keys to the repository.
- Codex CLI may be installed separately when needed with `npm i -g @openai/codex`.
- Codex may implement scoped changes, inspect files, run validation, and prepare summaries.
- One fresh read-only Codex execution performs the combined Code + QA review after implementation.
- The implementation response is not review evidence; simulated role splitting is invalid.
- Final approval remains manual/human even after a valid reviewer report.
- AI tooling must not be required for runtime, build, lint, start, or deployment.
