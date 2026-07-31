# Visual Direction — Teatro di cartone

This document is the source of truth for the mounted public experience.

## North Star

- Experience concept: **Milano come un piccolo teatro di cartone da attraversare**.
- Structure: invitation → living Milan stage → four acts → collected props → final letter.
- Visual principle: every screen is a new arrangement of the same tactile cardboard theatre.
- Emotional target: adult, intimate, cinematic, and playful without becoming childish or kitsch.
- Runtime boundary: local CSS, SVG, and optimized images only; no paid API, remote asset dependency, video, WebGL, or animation library.

The earlier pixel/handheld direction has been retired from the public route. Pixel components and assets remain only inside unmounted legacy implementations.

## Implemented system

- The stage uses four to six decorative depths: backdrop, two skylines, Duomo, road, tram/couple, and proscenium.
- The public route mounts transparent corrugated-cardboard WebP assets from `public/scene/paper-theatre/`.
- `components/experience/art/PaperArt.tsx` composes the shared scene and renders chapter-specific paper reward symbols.
- `PaperArt.module.css` owns the proscenium, curtains, lighting, skyline, paper texture, depth, and restrained scene motion.
- `ExperienceShell.module.css` owns readable UI, map states, game controls, reward, inventory, finale, and responsive behavior.
- Manrope remains the functional UI font. Titles use the free system serif stack `Iowan Old Style`, `Palatino`, and `Georgia`.
- No text, button, progress state, clue, or instruction is baked into an image.

## Palette and materials

Core tokens:

```css
--paper-light: #fff9ee;
--paper-base: #f3e8d4;
--paper-edge: #d4bea0;
--ink: #211d1b;
--ink-muted: #5d514a;
--curtain: #782d3d;
--curtain-deep: #481a25;
--stage-night: #16242d;
--stage-blue: #29495a;
--sage: #3f5f52;
--gold: #c4913b;
--focus: #007485;
```

- Cardboard is matte ivory or painted kraft with visible corrugation, scored folds, layered edges, and hard contact shadows.
- Curtain red frames the scene and marks primary actions; it must not dominate long-form content.
- Gold is reserved for lights, borders, progress, and collected objects. Never use it for small text on a light surface.
- Shadows describe the distance between cardboard planes, not glossy cards or floating SaaS panels.
- Avoid tape, random tears, doodles, pastel craft colors, plastic 3D, and heart confetti.

## Scene grammar

### Invitation

- Copy and CTA come first on small screens.
- The curtain opens onto the Duomo, couple, and Milan tram as three independent layers.
- The Duomo is the main landmark; the couple provides emotional scale; the tram provides movement.
- The CTA remains visible in the first phone viewport at 320–430 px where practical.

### Map

- The four stops sit above the decorative stage and remain semantic HTML buttons.
- Available, complete, and locked states always include text and shape changes, not color alone.
- The route remains SVG/DOM and is never part of the background artwork.
- Decorative layers use `pointer-events: none` so they cannot block map interaction.

### Acts

- Dawn, day, sunset, and night change lighting and painted-cardboard colors; every act also rearranges its foreground props.
- Act number and location appear as a stamp and ticket inside the decorative scene.
- The game card is a clean sheet of paper separate from the stage so instructions remain readable.

### Rewards and inventory

- Each reward is an original SVG-like cardboard prop rather than a platform-dependent emoji.
- The reward rises into one warm spotlight; there is no confetti or flashing.
- The inventory behaves like a backstage prop cabinet while preserving dialog focus trap, Escape close, inert background, and focus return.

### Finale

- The assembled stage gives way to a large ivory letter.
- The letter is the emotional focus; decoration remains subordinate.
- A future real photograph may appear only after the letter opens and must never replace accessible HTML text.

## Act IV — Le finestre accese

- The former hidden-object spotlight game has been replaced.
- Three deterministic rounds contain sequences of three, four, and five windows.
- Four large controls represent Lampada, Pianta, Tende, and Balcone.
- There is no score penalty, time limit, sound dependency, drag, or tiny target.
- A mistake preserves completed rounds and offers an immediate replay.
- The sequence can be shown explicitly at any time.
- With movement disabled, playback is skipped and the ordered text guide stays visible.
- Completion rewards **La luce di casa**.

## Motion

- Animate only opacity, transform, simple SVG progress, and window-light state.
- One dominant animation per screen; parallax remains below roughly 12 px.
- Curtains animate only on the invitation, not on every action.
- No flicker, autoplay audio, vibration, or rapidly repeating light.
- `prefers-reduced-motion` and the saved user toggle disable scene translation, pulses, and timed visual playback.

## Responsive and performance rules

- `≤ 480px`: one column, copy/CTA before scenery, touch targets at least 44×44 px.
- `481–899px`: compact scene above content; games stay in a single readable column.
- `≥ 900px`: split composition with roughly 42% copy and 58% stage.
- Validate at 320×568, 390×844, and desktop.
- Maximum five or six simultaneous decorative layers per stage.
- Use `next/image`, intrinsic dimensions, responsive `sizes`, and `priority` only for the invitation.
- Active cardboard assets should remain within a combined low-hundreds-of-kilobytes budget.
- Avoid animated blur, full-screen backdrop filters, WebGL, video, and heavy shadow stacks on Android.

## Photography plan

Original photographs are not yet present. When supplied:

- strip EXIF metadata;
- resize and export as AVIF/WebP for the real display size;
- reveal one authentic photograph per act and one portrait after the final letter;
- do not re-enable placeholder stock metadata from `lib/photos.ts`;
- keep every caption and narrative detail in HTML.

## Active asset provenance

The active Duomo, tram, and couple marionettes are `duomo-cardboard.webp`, `tram-cardboard.webp`, and `couple-cardboard.webp`. They were generated as original project assets with the built-in image-generation workflow, removed from a flat chroma-key background locally, converted to transparent WebP, and stored under `public/scene/paper-theatre/`. The earlier `*-paper.webp` files remain as rollback assets but are not mounted. No remote source, stock license, subscription, or runtime API is required.
