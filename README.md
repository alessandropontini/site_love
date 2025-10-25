# Pixel Quest: Alessandro & Bridget

A retro-styled Next.js microsite that opens like an arcade cartridge. Follow a map, drop into four pixel mini-games, and relive the love story of Alessandro and Bridget while collecting hearts and vow coins.

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the dev server
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 and press **Start Quest**.

## Playing The Timeline

The site launches with a title card and map. Complete each chapter in order to unlock the finale:

1. **Block Party Beginnings** – stack classic tetrominoes to bank 50 hearts.
2. **Hearts in the Arcade** – navigate a Pac-Maze, grabbing every heart while dodging doubts.
3. **Skyline Letters** – flap rooftop love notes through the skyline gaps.
4. **Side-Scroller Vows** – double-jump, glide, and sprint through the trail to gather every vow coin.

Every win adds to the shared heart counter and advances the quest timeline. Finishing all four mini-games plays the epilogue panel.

## Where To Customize

- `lib/profile.ts` – edit the hero headline and copy for the title screen.
- `components/QuestGame.tsx` – tweak map order, rewards, and screen copy.
- `components/quest/questSchema.ts` – adjust chapter metadata (titles, years, locations, reward hearts, render components).
- `components/quest/games/*` – fine-tune mechanics, difficulty, and art for each mini-game.
- `components/pixel/PixelCharacter.tsx` – update pixel palettes or redraw the avatars.
- `app/globals.css` – global palette, CRT overlays, and responsive layout tokens.
- `data/` – still ignored; stash heavyweight concept art or exports here if needed.

👉 For deeper breakdowns, peek at `docs/quest-guide.md`.

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
