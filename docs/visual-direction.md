# Visual Direction — Editorial wedding site

This document is the source of truth for the canonical guest-facing editorial home. Paper-theatre notes are retained below only for the dormant game code and do not describe a guest route.

## North Star

- Experience concept: **una storia matrimoniale editoriale, calda e tattile, con accenti di carta**.
- Public structure: invitation → personal photographic album → Casa Nuova Niviano → informational RSVP.
- Visual principle: the root alternates large typographic, photographic, and color scenes while keeping one continuous reading flow.
- Emotional target: adult, intimate, cinematic, and playful without becoming childish or kitsch.
- Runtime boundary: local CSS, SVG, optimized images, and one lazy Three.js scene in the root hero; no paid API, remote asset dependency, video, or general animation library.

The pixel/handheld and paper-theatre game directions are outside the public site. Their components and assets remain only as unmounted retained implementations.

## Editorial home system

- Palette: blush `#EAC5C0`, cream `#FAF7F5`, burgundy `#261B20`, dark olive `#242B16`, taupe `#C29983`, muted gold `#9B7948`, and near-black footer.
- A 12-column desktop grid, fluid Newsreader display type, Instrument Sans controls, large whitespace, irregular image rhythm, and section-scale color changes carry the editorial narrative.
- The hero combines a low-contrast original Galleria scene, readable DOM copy, a CSS poster fallback, and a thin WebGL invitation. Three.js is dynamically imported only by `HeroInvitation3D`.
- The invitation uses generated canvas faces rather than copied textures. It responds to pointer drag, hover tilt, buttons, and arrow keys; the renderer sleeps when settled, offscreen, or backgrounded.
- The freshwater-turtle mark uses a restrained top-down engraving silhouette, fine shell geometry, and one water line so it reads as an adult editorial seal rather than a cartoon mascot. The DOM SVG and generated Three.js canvas face share the same construction.
- The story uses semantic editorial scenes. Phones linearize the route vertically with no required gesture.
- The gallery uses approved local personal photographs with EXIF, GPS, and unnecessary metadata removed. No stock couple photography is mounted.
- The location section focuses on Casa Nuova Niviano and uses facts and the outbound link from the venue's official website. It currently presents an original paper-theatre interpretation of the venue; it is not a photographic or architectural depiction.
- Authorized Casa Nuova photography is still pending. Until it is supplied, use an intentional editorial placeholder or original project visual, never an unlicensed web image.
- RSVP is a calm informational home section, not a simulated form. It explains that each household receives a personal QR code; the functional form is isolated at the personalized route.
- The final letter remains retained but unmounted. The mounted colophon uses native modal behavior with Escape, focus containment, and focus return.

### Carrara proposal scene

- `/proposal` is a development-only visual draft based on Alessandro's account that the proposal took place in Carrara under the Venere Apuana. It is not linked from the public home and returns 404 in production until the couple approves it.
- The scene depicts Alessandro and Bridget as original paper puppets leaning into a kiss, with a recognisable but non-photoreal likeness: dark hair for both, Alessandro's glasses and moustache, and restrained cream/burgundy clothing.
- The Venere Apuana reference is limited to public factual traits: Franco Mauro Franchi's 2023 bardiglio-marble work outside the Accademia di Belle Arti, with a compact pyramidal volume. The SVG is an abstract original construction, not a traced or embedded photograph.
- The Apuan peaks, warm academy facade, puppet strings, paper joints, and muted marble palette establish Carrara without downloading any remote visual asset.
- Keep the route private to development while permission and final art direction for the contemporary sculpture are unresolved.

### Casa Nuova Niviano scene

- Treat the venue as the physical destination of the page, not another generic story stop.
- Use the official [Casa Nuova Niviano website](https://www.casanuovaniviano.com/) for factual orientation and the external link label.
- Keep address, services, timing, and travel guidance out of the design until they are confirmed by the couple or official venue material.
- Do not download or imitate venue photography from the web. Reserve a strong, clearly intentional frame for authorized imagery still to be supplied.
- When authorized files arrive, match the editorial crop rhythm, remove metadata, preserve natural color, and avoid filters that misrepresent the place.

### RSVP scene

- RSVP should feel like the practical next chapter of the invitation, with high contrast, short copy, and a direct heading.
- The home shows status and explains the personal QR flow; it contains no fields, fake submit button, or fake confirmation.
- The functional experience belongs at `/rsvp/[token]` with server-side data. Guest names, token values, and real/scannable QR graphics are never decorative home content or static public assets; the home QR motif stays visibly non-functional and `aria-hidden`.
- If games return, their visual surface and QR remain separate from RSVP.

## Dormant paper-theatre system

This system is retained in source but is not mounted or reachable from the wedding site. Preserving its palette and mechanics does not authorize a public game route.

- The stage uses one opaque illustrated panorama plus, only where narratively useful, a small number of cardboard performers. Every visible paper object is fully opaque; transparency is reserved for the empty pixels around PNG cut-outs.
- A future separate game surface may mount opaque JPEG panoramas and transparent PNG overlays from `public/scene/paper-theatre/`. The PNG fallback avoids black alpha rectangles in Android browsers and embedded preview viewers.
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

## Retained game scene grammar

The following invitation, index, acts, rewards, and finale notes apply only to the unmounted paper-theatre source.

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

On the editorial home, movement is limited to the invitation entrance/float, pointer tilt, smooth in-page navigation, optional gallery drift, and envelope feedback. Three.js renders on demand rather than maintaining a perpetual loop.

- Animate only opacity and transform for public decoration.
- One dominant animation per section; parallax remains below roughly 12 px.
- Scrolling initiated by navigation is smooth unless the visitor prefers reduced motion.
- Do not animate personal or venue photographs in a way that obscures faces, crops essential detail, or delays reading.
- No flicker, autoplay audio, vibration, or rapidly repeating light.
- `prefers-reduced-motion` disables decorative translation, drift, and long transitions while keeping every action immediate.

## Responsive and performance rules

- Root validation targets: 320, 390, 768, 1024, and 1440 px.
- Root phone order is copy/actions before the invitation, one-column gallery, Casa Nuova location, RSVP, and footer.
- Every root target is at least 44×44 px. The phone navigation is fixed to the bottom safe area and the language selector remains available in the top bar and footer.
- Three.js DPR is capped at 1.75 desktop and 1.25 phone; phone textures are smaller and antialiasing is disabled.
- Local personal images and explicitly selected editorial art use `next/image`; below-fold media remains lazy. The social card is metadata-only.

- `≤ 480px`: one column, copy/CTA before scenery, touch targets at least 44×44 px.
- `481–899px`: compact scene above content; every public section stays in a single readable flow.
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

Approved personal photographs are local and replace the earlier abstract gallery placeholders. For every new or replacement image:

- strip EXIF, GPS, timestamp, and device metadata;
- apply orientation, then resize and export for the real display size;
- update the configured slot in `lib/editorialConfig.ts` while retaining a deliberate aspect ratio;
- do not re-enable placeholder stock metadata from `lib/photos.ts`;
- keep every caption and narrative detail in HTML;
- confirm publication approval for each recognisable person.

Authorized photographs of Casa Nuova Niviano have not yet been supplied. Do not substitute copies from the official website, search engines, social networks, or booking portals. Keep a deliberate venue placeholder until reusable files arrive.

See `docs/editorial-home.md` for the replacement steps and asset budget.

## Retained paper-theatre asset provenance

The dormant game source retains opaque `scene-*.jpg` backgrounds and transparent compatibility overlays. The public home loads only the files explicitly referenced by its editorial components. Earlier entrance scenes remain versioned rollback assets.

Ten alternative Duomo directions remain under `public/duomo-proposals/` as internal art-direction references. They are not part of the wedding-site flow.

The retained scenes assign one visual role to each setting: Galleria, Naviglio Grande, Arco della Pace, Adelchi, and the Duomo finale. The original WebP flats and cutouts remain editable source or rollback assets rather than public-home content.

The invitation art direction uses [The Paper Architect](https://www.studiomcguire.com/thepaperarchitect) as the primary paper-architecture and theatre benchmark, [Micropolis](https://www.studiomcguire.com/micropolis) for believable scale, [Paperholm](https://www.paperholm.com/) for mechanical micro-motion, and [Owen Gildersleeve](https://owengildersleeve.com/art) for coherent layers, edges, light, and shadow.

Five original props add a transit ticket, analog tuning radio, jasmine postcard, bicycle and letter, and Adelchi lantern with glasses without introducing copied text or branding. The radio appears only inside the first challenge, so its interaction does not repeat the Galleria or ticket already printed in the chapter panorama. The index shows each opaque panorama as a restrained chapter preview. The Naviglio Grande scene follows the district's broad linear canal, continuous Alzaia and Ripa embankments, aligned low-rise facades, distant iron pedestrian bridge, and a secondary washhouse-like nook. Flowering star jasmine is confined to one facade so spring remains a believable detail instead of a decorative frame.

The Adelchi flat was generated as an original cardboard composition after checking the venue's address and multiple public open/closed facade references. Research sources: [Birrificio Lambrate official site](https://birrificiolambrate.com/), Andy Mabbett's four 2019 facade photographs on Wikimedia Commons ([view 01](https://commons.wikimedia.org/wiki/File:Birrificio_Lambrate_(Adelchi)_-_2019-06-30_-_Andy_Mabbett_-_01.jpg), [view 02](https://commons.wikimedia.org/wiki/File:Birrificio_Lambrate_(Adelchi)_-_2019-06-30_-_Andy_Mabbett_-_02.jpg), [view 03](https://commons.wikimedia.org/wiki/File:Birrificio_Lambrate_(Adelchi)_-_2019-06-30_-_Andy_Mabbett_-_03.jpg), [view 04](https://commons.wikimedia.org/wiki/File:Birrificio_Lambrate_(Adelchi)_-_2019-06-30_-_Andy_Mabbett_-_04.jpg)), and Bernt Rostad's [2009 open-front view](https://www.flickr.com/photos/brostad/3444030976). Those photographs are references only and are not shipped, traced, or embedded. The final asset omits logos, copied signs, readable graffiti, cars, and people; its generated chroma background was removed locally and the transparent result was converted to WebP.

The retained landmark designs are original paper-theatre compositions rather than copied photographs. Their final JPEG panoramas were flattened from the project's own cardboard layers and contain no remote runtime assets or alpha channel. The earlier `milan-windows-cardboard.webp`, `navigli-spring-cardboard.webp`, `navigli-cardboard.webp`, and `*-paper.webp` files remain rollback assets and are not mounted by the public home.
