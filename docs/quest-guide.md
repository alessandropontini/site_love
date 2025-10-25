# Quest Customization Guide

This guide highlights where to update copy, art, and game balance for the pixel timeline.

## Core Metadata

- `lib/profile.ts` – Title screen names and intro copy.
- `components/quest/questSchema.ts` – Chapter metadata (title, subtitle, location, year, reward hearts) and which React component renders the stage.
- `components/QuestGame.tsx` – Flow between screens (intro → map → game → ending) plus heart counter text.

## Mini-Game Files

| Chapter key    | File path                                               | Mechanics overview                             |
|----------------|---------------------------------------------------------|------------------------------------------------|
| `tetris`       | `components/quest/games/TetrisQuest.tsx`                | Falling block alignment with glowing columns.  |
| `pacmaze`      | `components/quest/games/PacMazeQuest.tsx`               | Turn-based maze chase with hearts vs ghost.    |
| `flappy`       | `components/quest/games/FlappyLettersQuest.tsx`         | Rafter-delivered letters weaving through gaps. |
| `platformer`   | `components/quest/games/PlatformRunQuest.tsx`           | Auto-runner collecting vow coins and jumping.  |

Each file exposes props (`rewardHearts`, `onComplete`) so you can adjust reward values or hook into alternative scoring.

## Pixel Art

- `components/pixel/PixelCharacter.tsx` draws avatars by mapping grid cells to color tokens.
- Edit the `palette` hex values or rewrite the `rows` strings to craft new outfits and hairstyles.
- Keep the grid dimensions consistent (12×16) for sizing.

## Difficulty Tuning Tips

- **TetrisQuest:** adjust `TARGET_SEQUENCE`, drop interval, or column count to ramp difficulty.
- **PacMazeQuest:** modify `GRID_TEMPLATE` walls or heart placement; ghost behaviour lives in `moveGhost`.
- **FlappyLettersQuest:** tweak `PIPE_GAP`, `HORIZONTAL_SPEED`, or required pipe count.
- **PlatformRunQuest:** update `OBSTACLES`, `COINS`, or physics constants (`RUN_SPEED`, `JUMP_FORCE`).

## Styling

- Global pixel aesthetic resides in `app/globals.css`.
- Add CRT scanline overlays or change accent colors by updating the CSS variables at the top of the file.
- Additional responsive tweaks live at the bottom media queries.

Feel free to branch new chapters: duplicate an event in `questSchema.ts`, create a new mini-game component, and add a corresponding node to the map.
