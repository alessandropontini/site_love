# Pixel Quest: Alessandro & Bridget

A retro-styled Next.js microsite evolving into a playable scrollytelling love story. The current home experience moves through narrative chapters, lightweight interactions, and progressively unlocked mini-games before the final reveal.

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the dev server
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 and press **Inizia**.

## Playing The Timeline

The site launches with a cinematic intro and a scroll-driven route. Complete each interactive chapter in order to unlock the next narrative section and finale:

1. **Signal quiz** – answer personal route-setting questions.
2. **Memory pairs** – match places and feelings from the shared archive.
3. **Picture sequence** – reorder the story beats.
4. **Hidden clues** – find the objects that unlock the final reveal.

Story gating applies to both mini-games and later narrative chapters. The first intro chapter is always readable; future chapters depend on the previous required mini-game. If someone scrolls directly to the first game without pressing **Inizia**, a local **Inizia il capitolo** CTA starts the path without forcing auto-start.

The legacy arcade quest remains in `components/QuestGame.tsx` and `components/quest/` for reuse or reference, but `app/page.tsx` currently mounts the scrollytelling shell.

## Where To Customize

- `lib/storyConfig.ts` – edit scrollytelling chapters, game order, labels, questions, memory pairs, puzzle tiles, and hidden objects.
- `lib/useStoryProgress.ts` – progress state, `localStorage`, game unlocks, and finale unlock logic.
- `components/story/StoryShell.tsx` – scrollytelling assembly, chapter gating, and local start CTA.
- `components/story/ProgressIndicator.tsx` – compact progress states: complete, available/current, and locked.
- `components/games/*` – lightweight scrollytelling mini-games.
- `components/QuestGame.tsx` – legacy arcade quest shell kept intact.
- `components/quest/questSchema.ts` – legacy arcade chapter metadata.
- `components/quest/games/*` – legacy arcade mini-game mechanics.
- `components/pixel/PixelCharacter.tsx` – update pixel palettes or redraw the avatars.
- `app/globals.css` – global palette, CRT overlays, and responsive layout tokens.
- `data/` – still ignored; stash heavyweight concept art or exports here if needed.

👉 For deeper breakdowns, peek at `docs/quest-guide.md`.
👉 For the current visual direction and character references, use `docs/visual-direction.md`.

## Story Gating Checklist

- The first intro chapter must stay readable.
- Future narrative chapters must stay gated behind the previous required mini-game.
- The first game must be derived from `gameOrder`, not hardcoded in UI code.
- The first mini-game must be startable locally if the user scrolls past the intro before pressing **Inizia**.
- Locked chapters should expose one clear locked message, not duplicate locked copy in nested game slots.
- The progress indicator must not label an available but incomplete game as locked.
- Documentation should be updated with behavior changes to `StoryShell`, `ProgressIndicator`, or `useStoryProgress`.

## Dev Skip Button

During development a **Skip (DEV)** button appears in every mini-game panel so you can jump past a stage while testing. It is shown automatically when `NODE_ENV !== "production"` or when you set:

```bash
NEXT_PUBLIC_DEV_SKIP=true
```

Be sure to unset the flag (or comment out the button) before launching to production.

## Production Build

```bash
npm run build
npm start
```

Deploy behind a CDN (Vercel works great) to keep input latency low for the mini-games.

## Tech Stack Highlights

- **Next.js 14** with the App Router powering the single-page quest.
- **React hooks** orchestrating real-time state loops for each mini-game.
- **Custom pixel art** drawn with CSS grids for avatars, tiles, and collectibles.
- **RequestAnimationFrame loops** for Flappy and Side-Scroller physics.
- **TypeScript** across all components for safer interaction code.

Have fun remixing the stages—swap in new memories, change the mechanics, or add hidden chapters to keep the love story evolving.
