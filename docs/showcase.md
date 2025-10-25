# Showcase Dataset

This project ships with a demo storyline so you can run the app without adding personal photos right away. The seed data mirrors a fashion/editorial couple shoot and exercises each animated section of the page.

## How to Run the Demo

1. Install dependencies once: `npm install`
2. Start the development server: `npm run dev`
3. Visit http://localhost:3000 to explore the gallery
4. (Optional) Build the production bundle: `npm run build && npm start`

The imagery is sourced from public Unsplash URLs that already follow the correct format (`?auto=format&fit=crop&w=1600&q=80`). No local assets are required.

## Seed Copy Overview

### Hero copy (`lib/profile.ts`)

| Field     | Value                                               | Notes                                   |
|-----------|-----------------------------------------------------|-----------------------------------------|
| `names`   | `Aurora & Jules`                                    | Neutral stand‑ins for the hero heading  |
| `headline`| `A modern love letter told through city lights and quiet getaways.` | Sets the cinematic tone                |
| `subheading` | `Use this sample montage to preview the gallery without personal photos.` | Explains that this is demo content |

### Photo cards (`lib/photos.ts`)

| ID                 | Scene                | Location            | Accent color            | Purpose |
|--------------------|----------------------|---------------------|-------------------------|---------|
| `neon-stroll`      | Scene 01 · Night     | Tokyo               | `rgba(255, 210, 237, 0.55)` | First hero tile with neon glow |
| `sunrise-express`  | Scene 02 · Dawn      | Mediterranean Route | `rgba(255, 222, 212, 0.55)` | Shows warm sunrise gradients |
| `seaside-hideout`  | Scene 03 · Golden Hour | Amalfi Coast     | `rgba(198, 227, 255, 0.55)` | Demonstrates coastal palette |
| `desert-sway`      | Scene 04 · Sunset    | Morocco             | `rgba(255, 213, 194, 0.55)` | Highlights the desert vignette |
| `moonlit-overlook` | Scene 05 · Evening   | Venice              | `rgba(198, 255, 235, 0.55)` | Adds depth to the stack stage |
| `forest-campfire`  | Scene 06 · Twilight  | Dolomites           | `rgba(214, 206, 255, 0.55)` | Finishes on muted twilight tones |

The first four entries (`photos.slice(0, 4)`) feed the Ken Burns wall, while the last four (`photos.slice(2)`) power the 3D stack interaction. Editing this table is the fastest way to prototype new looks.

## Customizing the Showcase

- Swap `imageUrl` values with other Unsplash links or local `/public/photos/*.jpg` assets.
- Adjust `accent` to change the glow color; keep the `rgba(..., alpha < 0.65)` structure for subtle overlays.
- Change `capturedOn` to communicate scene order (`Scene 01`, `Scene 02`, etc.) or real world dates.
- Duplicate entries in `photos` to extend the wall; both `wallPhotos` and `storyStack` are derived slices, so the UI adapts automatically.

Create additional showcase presets by exporting alternate arrays (e.g., `export const winterShowcase = [...]`) and swapping them in `components/*` based on an environment flag or query parameter.
