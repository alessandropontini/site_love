# Dreamy Couple Gallery

Single-page Next.js experience that spotlights our favorite photos with a cinematic Ken Burns wall and an interactive 3D story stack.

## Getting Started

1. Install dependencies  
   ```bash
   npm install
   ```
2. Run the development server  
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000 to explore the gallery.

## Customizing It For You Two

- Drop your optimized images (≤2000px wide) inside `public/photos` and update the URLs in `lib/photos.ts`. Local files can use paths like `/photos/01.jpg`.
- Tune hero copy in `lib/profile.ts` to reflect your names and tone.
- Each photo entry supports `title`, `tagline`, `location`, `capturedOn`, and `accent` (RGBA string that powers the glow).
- A ready-to-run showcase dataset (with public stock imagery) is documented in `docs/showcase.md`.
- Personal raw assets or exports that shouldn't live in git can sit in `data/`—the folder exists locally but stays ignored so the repo stays lightweight.

## Production Build

```bash
npm run build
npm start
```

This runs the optimized Next.js build. Aim for Lighthouse ≥ 90 by compressing imagery and serving the app via a CDN or Vercel.
