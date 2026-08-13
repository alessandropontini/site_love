# Visual Direction — Teatro di cartone

This document is the source of truth for the mounted public experience.

## North Star

- Experience concept: **Milano come un piccolo teatro di cartone da attraversare**.
- Structure: invitation → theatre index → four illustrated book chapters → collected props → final Duomo letter.
- Visual principle: every screen is a new arrangement of the same tactile cardboard theatre.
- Emotional target: adult, intimate, cinematic, and playful without becoming childish or kitsch.
- Runtime boundary: local CSS, SVG, and optimized images only; no paid API, remote asset dependency, video, WebGL, or animation library.

The earlier pixel/handheld direction has been retired from the public route. Pixel components and assets remain only inside unmounted legacy implementations.

## Implemented system

- The stage uses one opaque illustrated panorama plus, only where narratively useful, a small number of cardboard performers. Every visible paper object is fully opaque; transparency is reserved for the empty pixels around PNG cut-outs.
- The public route mounts opaque JPEG panoramas and transparent PNG overlays from `public/scene/paper-theatre/`. The PNG fallback avoids black alpha rectangles in Android browsers and embedded preview viewers.
- `components/experience/art/PaperArt.tsx` composes the shared scene and renders chapter-specific paper reward symbols.
- `PaperArt.module.css` owns the proscenium, curtains, lighting, skyline, paper texture, depth, and restrained scene motion.
- `ExperienceShell.module.css` owns readable UI, map states, game controls, reward, inventory, finale, and responsive behavior.
- The selected Sarah & Matt-inspired type system uses `Newsreader` for editorial display and `Instrument Sans` for UI and body copy. Both are open-source equivalents of the reference site's commercial Romie/Instrument pairing and are loaded locally through `next/font`.
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
- The invitation adds a Milanese architectural sub-palette inspired by Portaluppi interiors: petrol and malachite greens, merlot red, pale stone, smoked glass blue, and tram/brass yellow. Cream is a paper highlight, not the dominant field color.
- Shadows describe the distance between cardboard planes, not glossy cards or floating SaaS panels.
- Avoid tape, random tears, doodles, pastel craft colors, plastic 3D, and heart confetti.

## Scene grammar

### Invitation

- Copy and CTA come first on small screens.
- The curtain opens onto the daytime Piazza Duomo facade of the real Galleria Vittorio Emanuele II, reconstructed from 57 distinct architectural references rather than an invented station-like entrance.
- The viewpoint is frontal and axial: the monumental triumphal arch, paired arched windows, Corinthian columns, relief bands, side wings and long iron-and-glass arcade provide recognition. Four to five coherent paper planes, visible corrugated edges, shallow embossed relief and one light direction carry the handmade treatment without distorting the architecture.
- The couple remains the only separate foreground performer on the empty paper-paved forecourt. The tram has been removed from the invitation because it had no believable narrative or spatial relationship to Piazza Duomo; it is not replaced with a generic prop.
- Two slow, fully opaque paper clouds, one static saffron paper sun and three recognisable grey paper pigeons inhabit only the open sky above the facade. The sky mask prevents them from crossing the building or entering the arcade; no airplane is used.
- A single cool color grade, shared light direction, contact shadows, and one common stage edge bind panorama and performers into the same set; visible individual cardboard plinths are avoided.
- The Duomo is deliberately absent here so its appearance remains exclusive to the finale.
- The CTA remains visible in the first phone viewport at 320–430 px where practical.

### Theatre index

- The four numbered chapters sit above the decorative stage and remain semantic HTML buttons inside a labelled navigation region.
- Available, complete, and locked states always include text and shape changes, not color alone.
- The route remains SVG/DOM and is never part of the background artwork.
- The index background stays abstract and landmark-free; each node owns one unique scene thumbnail instead of repeating the Duomo, tram, or couple.
- Decorative layers use `pointer-events: none` so they cannot block map interaction.

### Acts

- Dawn, day, sunset, and night change lighting and painted-cardboard colors; each act also owns a paper, edge, and accent palette derived from its setting.
- Each act opens as a hard-cover illustrated volume. A decorative cover rotates once around the left spine, then reveals one continuous spread containing narrative, setting, and challenge; it is skipped when motion is reduced.
- Each act has one distinct opaque Milanese panorama: a Galleria-inspired portal, a spring Naviglio Grande perspective, an Arco della Pace-inspired arch, or the exterior of Adelchi in Lambrate at night.
- The chapter panorama replaces every generic landmark layer instead of stacking cutouts. The Duomo appears only in the finale.
- Act number and location appear as a stamp and ticket inside the decorative scene.
- The setting appears only once per act as the full-width illustrated upper part of the same volume. A torn paper edge joins it to the printed narrative and challenge pages below, without a second frame or false pop-up supports.

### Rewards and inventory

- Each reward is an original SVG-like cardboard prop rather than a platform-dependent emoji.
- The reward rises into one warm spotlight; there is no confetti or flashing.
- The inventory behaves like a backstage prop cabinet while preserving dialog focus trap, Escape close, inert background, and focus return.

### Finale

- The Duomo, couple, and a small arriving tram assemble the final stage before it gives way to a large ivory letter.
- The letter is the emotional focus; decoration remains subordinate.
- A future real photograph may appear only after the letter opens and must never replace accessible HTML text.

## Act IV — Le luci di Adelchi

- The former hidden-object spotlight game has been replaced.
- Three deterministic rounds contain sequences of three, four, and five facade signals.
- Four large controls represent Lampione, Edera, Ingresso, and Serranda without changing the stable game IDs.
- The four controls are printed as light tactile tabs below the single Adelchi illustration; the facade image is not duplicated inside the challenge.
- The scene is an original paper-theatre interpretation of the low grey facade, central ivy, wall lanterns, and two shuttered bays outside the Adelchi venue on Via Adelchi. In its open state, the broad left bay remains a glazed frontage while the raised right shutter reveals the customer door opening inward toward the warm bar.
- There is no score penalty, time limit, sound dependency, drag, or tiny target.
- A mistake preserves completed rounds and offers an immediate replay.
- The sequence can be shown explicitly at any time.
- With movement disabled, playback is skipped and the ordered text guide stays visible.
- Completion rewards **La luce di casa**.

## Motion

- Animate only opacity, transform, simple SVG progress, and window-light state.
- One dominant animation per screen; parallax remains below roughly 12 px.
- Curtains animate only on the invitation, not on every action.
- On the invitation, the panorama resolves with a short optical settle and the couple is placed gently. Rigid paper clouds and pigeons move as whole cut-outs; the sun remains still.
- Only the far-background sky layer may loop: clouds drift on 28–38 second cycles; two pigeons cross on staggered 14–18 second cycles and one smaller silhouette hovers gently. The movement remains visible without competing with the CTA.
- No flicker, autoplay audio, vibration, or rapidly repeating light.
- `prefers-reduced-motion` and the saved user toggle disable scene translation, pulses, and timed visual playback.

## Responsive and performance rules

- `≤ 480px`: one column, copy/CTA before scenery, touch targets at least 44×44 px.
- `481–899px`: compact scene above content; games stay in a single readable column.
- `≥ 900px`: split composition with roughly 42% copy and 58% stage.
- Validate at 320×568, 390×844, and desktop.
- Maximum one opaque panorama and two transparent overlays per illustrated stage.
- Use `next/image`, intrinsic dimensions, responsive `sizes`, and `priority` only for the invitation.
- Prefer opaque JPEG for full-stage artwork and PNG only for alpha overlays. Never rely on transparent WebP for mounted performers on Android.
- Avoid animated blur, full-screen backdrop filters, WebGL, video, and heavy shadow stacks on Android.

## Invitation type scale

- The responsive title follows `44–76px`, `1.01` line height, `-0.018em` tracking, and a maximum measure of `9.5ch`.
- The romantic marker follows `20–24px`; the uppercase eyebrow is `14px` with `0.14em` tracking.
- The lede follows `17–20px`, `1.5` line height, and a maximum measure of `36ch`.
- UI controls remain at least `16px / 48px`; the CTA is `18px / 60px`, with a maximum width of `22rem`; supporting metadata is `15px`.
- These constraints synthesize the [USWDS typography guidance](https://designsystem.digital.gov/components/typography/), [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/), [Carbon editorial type sets](https://carbondesignsystem.com/elements/typography/type-sets/), [Material 3 type scale](https://developer.android.com/develop/ui/compose/designsystems/material3), and [W3C reflow guidance](https://www.w3.org/WAI/WCAG21/Understanding/reflow).

## Photography plan

Original photographs are not yet present. When supplied:

- strip EXIF metadata;
- resize and export as AVIF/WebP for the real display size;
- reveal one authentic photograph per act and one portrait after the final letter;
- do not re-enable placeholder stock metadata from `lib/photos.ts`;
- keep every caption and narrative detail in HTML.

## Active asset provenance

The mounted full-stage files are the opaque `scene-*.jpg` backgrounds. The invitation mounts `scene-entrance-duomo-cromolitografia-v2.jpg`, the selected proposal 02 recomposed specifically for the tall split-screen stage. It preserves the early-1900s chromolithographic theatre language, gives the upper animations real sky space, grounds the couple on a generous piazza floor and renders the traditional Madonnina in antique gold leaf paper. The approved Galleria scene remains intact as `scene-entrance-galleria-v6.jpg` and is reused for the first story stop. Earlier entrance scenes remain versioned rollback assets.

Ten alternative Duomo directions are preserved under `public/duomo-proposals/` and presented at `/duomo-proposals` for art-direction voting. They share a lower cathedral scale and generous upper sky so the sun, moon, clouds and location plaque can remain separate interactive HTML layers.

The scenes assign one visual role to each setting: Galleria at the entrance and chapter one, Naviglio Grande with spring jasmine in chapter two, Arco della Pace in chapter three, Adelchi in chapter four, and the Duomo only in the finale. Chapter one changes focus from the broad entrance view to a closer ticket-and-signal composition. `tram-cardboard.png` and `couple-cardboard.png` are the only mounted transparent performers and use PNG compatibility fallbacks. The original WebP flats and cutouts remain as editable source or rollback assets, not as Android-facing alpha layers.

The invitation art direction uses [The Paper Architect](https://www.studiomcguire.com/thepaperarchitect) as the primary paper-architecture and theatre benchmark, [Micropolis](https://www.studiomcguire.com/micropolis) for believable scale, [Paperholm](https://www.paperholm.com/) for mechanical micro-motion, and [Owen Gildersleeve](https://owengildersleeve.com/art) for coherent layers, edges, light, and shadow.

Five original props add a transit ticket, analog tuning radio, jasmine postcard, bicycle and letter, and Adelchi lantern with glasses without introducing copied text or branding. The radio appears only inside the first challenge, so its interaction does not repeat the Galleria or ticket already printed in the chapter panorama. The index shows each opaque panorama as a restrained chapter preview. The Naviglio Grande scene follows the district's broad linear canal, continuous Alzaia and Ripa embankments, aligned low-rise facades, distant iron pedestrian bridge, and a secondary washhouse-like nook. Flowering star jasmine is confined to one facade so spring remains a believable detail instead of a decorative frame.

The Adelchi flat was generated as an original cardboard composition after checking the venue's address and multiple public open/closed facade references. Research sources: [Birrificio Lambrate official site](https://birrificiolambrate.com/), Andy Mabbett's four 2019 facade photographs on Wikimedia Commons ([view 01](https://commons.wikimedia.org/wiki/File:Birrificio_Lambrate_(Adelchi)_-_2019-06-30_-_Andy_Mabbett_-_01.jpg), [view 02](https://commons.wikimedia.org/wiki/File:Birrificio_Lambrate_(Adelchi)_-_2019-06-30_-_Andy_Mabbett_-_02.jpg), [view 03](https://commons.wikimedia.org/wiki/File:Birrificio_Lambrate_(Adelchi)_-_2019-06-30_-_Andy_Mabbett_-_03.jpg), [view 04](https://commons.wikimedia.org/wiki/File:Birrificio_Lambrate_(Adelchi)_-_2019-06-30_-_Andy_Mabbett_-_04.jpg)), and Bernt Rostad's [2009 open-front view](https://www.flickr.com/photos/brostad/3444030976). Those photographs are references only and are not shipped, traced, or embedded. The final asset omits logos, copied signs, readable graffiti, cars, and people; its generated chroma background was removed locally and the transparent result was converted to WebP.

All mounted landmark designs are original paper-theatre compositions rather than copied photographs. The final JPEG panoramas were flattened from the project's own cardboard layers; they contain no remote runtime assets and no alpha channel. The earlier `milan-windows-cardboard.webp`, `navigli-spring-cardboard.webp`, `navigli-cardboard.webp`, and `*-paper.webp` files remain as rollback assets but are not mounted.
