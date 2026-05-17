# Architecture Overview

Pixel Quest: Alessandro & Bridget is a single-page Next.js 14 App Router experience. It combines a quest-map shell, four React mini-games, CSS-driven pixel art, and static scene assets into a retro love-story microsite.

## Next.js app structure

- `app/layout.tsx` defines app metadata, loads the Manrope UI font and Silkscreen accent/title font, and imports `app/globals.css`.
- `app/page.tsx` renders the current home experience and mounts `StoryShell`.
- `next.config.mjs` contains Next.js configuration for remote image host patterns.
- `tsconfig.json` enables strict TypeScript settings and the `@/*` path alias.

The app is intended to run through the standard scripts in `package.json`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Components structure

- `components/story/StoryShell.tsx` is the current scrollytelling controller. It assembles the intro, scroll scenes, progress indicator, mini-games, chapter gating, local first-game CTA, and finale.
- `components/story/ScrollScene.tsx` renders individual narrative scenes and their locked/unlocked presentation.
- `components/story/ProgressIndicator.tsx` renders compact game progress states: `complete`, `available/current`, and `locked`.
- `components/games/` contains lightweight scrollytelling mini-games: quiz, memory, puzzle, and hidden object.
- `components/finale/FinalReveal.tsx` renders the gated final reveal.
- `components/QuestGame.tsx` is the top-level interactive controller. It manages the intro, map, active game, ending screen, selected character, completed chapters, heart totals, attempt counts, leaderboard entries, and game-panel scroll locking.
- `components/quest/QuestMap.tsx` renders the map/progression layer.
- `components/quest/QuestEventPanel.tsx` hosts the currently selected chapter game.
- `components/quest/QuestLeaderboard.tsx` and `components/quest/QuestSummary.tsx` render supporting progress and end-state UI.
- `components/pixel/PixelCharacter.tsx` and `components/pixel/PixelLandmark.tsx` render custom pixel-style characters and landmark scenery.

The legacy arcade quest in `components/QuestGame.tsx` and `components/quest/` remains available for reuse/reference, but it is not currently mounted by `app/page.tsx`.

## Scrollytelling structure

Scrollytelling content and state live in:

- `lib/storyConfig.ts` for chapters, game order, accessible game labels, quiz questions, memory pairs, puzzle tiles, and hidden objects.
- `lib/useStoryProgress.ts` for session state, `localStorage` persistence, game unlocks, and finale unlocks.

Story gating applies to both games and later narrative chapters. The first intro chapter is always readable. Future chapters depend on completion of the previous required mini-game or story block. The first game should be derived from `gameOrder` rather than hardcoded in UI code. If a user scrolls to the first game before pressing the intro CTA, `StoryShell` must provide a local start CTA instead of relying on auto-start. Locked chapters should expose one clear locked explanation and avoid duplicate nested locked messages.

Progress indicators must represent three distinct states: `complete`, `available/current`, and `locked`. Do not label an available but incomplete game as locked.

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

Global styling is concentrated in `app/globals.css`, including:

- Theme color custom properties.
- Player/partner accent color switching through root data attributes.
- Base layout and typography.
- Intro/map/game/ending screens.
- Responsive behavior and game scroll locking.
- Retro/pixel visual treatments.

Use `docs/visual-direction.md` as the design source of truth before changing layout, typography, landmarks, sprites, or pixel-art presentation.

## Content and static assets

- `lib/profile.ts` contains title-screen profile and intro copy.
- `lib/photos.ts` contains photo metadata.
- `public/photos/` contains photo documentation/placeholders.
- `public/scene/` contains approved and in-progress scene assets, including Duomo pixel-art variants.
- `data/` is ignored except for `.gitkeep` and can hold heavyweight local concept art or exports.

Do not modify visual assets in `public/` without explicit approval.

## Design documentation references

- `README.md` gives the high-level project overview, local commands, gameplay sequence, customization paths, and production-build notes.
- `docs/quest-guide.md` documents quest metadata, mini-game files, pixel art customization, difficulty tuning, and styling entry points.
- `docs/visual-direction.md` records the current visual direction, including retro handheld influences, Milan/Duomo composition guidance, typography rules, sprite direction, and next design steps.
- `docs/ai-workflow.md` documents Codex usage, validation commands, and the manual review process for this repository.
- `docs/multiagent-workflow.md` documents the Phase 1 local multi-agent patch policy, report structure, verdicts, and future provider integration path.

## AI assistance and review workflow

AI workflow guidance for this repository lives at the root in `AGENTS.md`, with details in `docs/ai-workflow.md` and `docs/multiagent-workflow.md`. Ruflo has been removed from the project workflow because the local Ruflo/WASM runtime did not produce autonomous review output without an external model provider/API key.

- Do not add Ruflo, Claude Flow, MCP servers, WASM agents, Anthropic/Claude managed agents, or provider API keys to the repository.
- Codex CLI may be installed separately when needed with `npm i -g @openai/codex`.
- Codex may be used to implement scoped changes, inspect files, run lint/build, and prepare summaries.
- Phase 1 prepares prompts, report folders, and safe placeholder scripts for future local/freemium multi-agent review.
- Independent reviewer reports must be real and separate; simulated multi-agent output is not valid.
- Final review is manual/human before merge even when future reviewer providers are configured.
- AI tooling must not be required for runtime, build, lint, start, or deployment.
