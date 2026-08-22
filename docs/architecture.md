# Architecture Overview

Alessandro & Bridget is a Next.js 16 App Router wedding site with one canonical guest-facing route: `/`. The root is a freely readable bilingual editorial experience; games and progression are deliberately outside the mounted product. The unlinked `/duomo-proposals` and `/sun-proposals` routes are internal visual-review surfaces and are not part of the guest flow.

The canonical public sequence is:

```text
story → personal photographs → Casa Nuova Niviano → RSVP information → letter
```

## Public app structure

- `app/layout.tsx` defines shared metadata, loads `Instrument Sans` and `Newsreader` through `next/font`, and imports `app/globals.css`.
- `app/page.tsx` mounts `EditorialHome` and derives absolute social-image metadata from the incoming request host.
- `components/editorial/EditorialHome.tsx` composes the complete page inside the locale provider.
- `components/editorial/EditorialNavigation.tsx` provides desktop/mobile section navigation, the language selector, smooth in-page movement, and active-section state.
- `components/editorial/HeroInvitation.tsx` owns the opening copy, accessible poster fallback, controls, and lazy Three.js boundary.
- `components/editorial/HeroInvitation3D.tsx` is the only Three.js consumer. It renders on demand, pauses when hidden, and hands control back to the HTML poster after setup failure or context loss.
- `components/editorial/EditorialLocaleProvider.tsx` owns public locale detection and the persisted language preference without importing dormant game dictionaries.
- `RelationshipTimeline`, `PhotoGallery`, `WeddingVenue`, `RsvpSection`, `FinalLetter`, and `EditorialFooter` isolate the remaining public sections.
- `lib/editorialConfig.ts` is the self-contained source for bilingual public copy, story entries, stable section IDs, accessible labels, local asset paths, and official venue links.
- `components/editorial/EditorialHome.module.css` owns the editorial grid, palette, paper treatments, responsive layout, focus states, and reduced-motion fallbacks.

No public component may link to or import an interactive game shell.

## Content and section boundaries

### Story

The story is ordinary semantic HTML and remains readable without state, a timer, an account, or an unlock condition. The invitation canvas is enhancement only; its meaningful text and controls have an HTML fallback.

### Personal photographs

Couple photographs are stored locally under `public/photos/` and rendered through `next/image`. Before inclusion they must be resized, optimized, and stripped of EXIF, GPS coordinates, device identifiers, timestamps, and other unnecessary metadata. Captions and meaningful alternative text remain bilingual HTML rather than being baked into an image.

### Casa Nuova Niviano

The venue section identifies [Casa Nuova Niviano](https://www.casanuovaniviano.com/) using facts from the official website or information supplied directly by the couple. The official site may be linked as an external reference; it is not a runtime data API.

Publicly visible venue photographs require reuse permission or files supplied by the venue/couple. Online images are references only until authorization is documented. The current architecture therefore permits an editorial placeholder or existing original graphic while authorized venue photography is still pending.

### RSVP

The mounted RSVP section is informational. It may explain that each invited household will receive a personal QR code, but it must not render a submission form or success state that suggests a response was persisted.

The planned personalized route is `/rsvp/[token]`. It does not exist as a functional public flow until a backend is selected and deployed. Its token must be random, opaque, high entropy, and free of readable personal information. A future server resolves the token to a household, returns only the permitted invitee fields, validates the response, and stores it server-side.

Guest lists, token mappings, responses, and generated QR images must never be placed in `public/`, shipped in client JavaScript, committed to source-controlled data files, or treated as `localStorage` state. See `docs/rsvp.md` for the full contract.

### Letter

The closing letter is public narrative content. It uses semantic HTML and a native dialog with Escape handling and focus return; there is no gated or game-only version on the public site.

## Games retained outside the public app

The following code remains intact for possible extraction into a separate project:

- `components/experience/ExperienceShell.tsx` and `ExperienceShell.module.css`;
- `components/experience/JourneyMap.tsx`, chapter, reward, inventory, finale, and challenge components;
- `components/experience/art/` and paper-theatre assets;
- `lib/experienceConfig.ts`;
- `lib/useExperienceProgress.ts` and its versioned storage/migration behavior.

None of it is mounted by `/`, exposed by a public game route, or linked from the wedding-site navigation. Removing the mount does not erase browser storage, migrate it, or call the reset action. If the experience is revived, it must use a separate route or distribution channel and a QR distinct from RSVP.

The earlier scrollytelling and arcade trees under `components/story/`, `components/games/`, `components/QuestGame.tsx`, `components/quest/`, and `components/pixel/` are also retained but unmounted.

## Retained progression invariants

These rules document dormant code; they do not authorize remounting it:

- the invitation never auto-starts;
- only the first incomplete configured chapter is available;
- completion and rewards are idempotent;
- persisted chapter IDs are sanitized into configured order;
- the finale requires every configured chapter ID;
- reset requires confirmation and removes only SITE LOVE progress keys;
- language changes never alter language-independent progress IDs;
- the system reduced-motion preference overrides a saved game preference.

Any future edit to challenge mechanics, progression, migrations, or reset behavior remains high risk and requires focused validation.

## Localization

The mounted home supports Italian and English without a runtime translation service. Initial locale priority is:

1. a previous manual choice under `site-love-locale-v1`;
2. an Italian geographic time zone;
3. an Italian browser language;
4. English fallback.

Switching locale updates visible copy, accessible names, `html lang`, title, description, and social metadata. Only the locale preference belongs in browser storage; future RSVP records do not.

## Accessibility and mobile behavior

The public home provides one `h1`, a skip link, semantic sections, an ordered story, keyboard-operable invitation controls, native dialogs, visible focus, and a vertical phone flow.

- Navigation state is conveyed by text/shape and `aria-current`, not color alone.
- Interactive targets remain at least 44×44 px.
- Dialogs close on Escape and restore focus.
- Content order stays story → photographs → location → RSVP → letter at every viewport.
- `prefers-reduced-motion` removes decorative movement without hiding controls or information.
- The HTML invitation fallback remains usable when WebGL is unavailable or lost.

Validate at 320, 390, 768, 1024, and 1440 px.

## Runtime, data, and cost boundary

The current public runtime uses Next.js, React, local CSS/SVG, local optimized images, and Three.js dynamically loaded only for the root hero. It does not require an account, database, analytics service, translation API, map tiles, or paid media service.

That boundary changes when RSVP becomes functional: a deliberate backend, data-retention policy, access controls, monitoring, and deployment configuration will be required. Do not bridge the gap with a client-only imitation.

## Static assets

- `public/photos/` contains approved, metadata-stripped local photographs.
- `public/og-turtle-v1.jpg` is the generated 1200×630 social card with the provisional freshwater-turtle mark and is metadata-only.
- `public/scene/paper-theatre/` contains retained scene and rollback assets. Only assets explicitly referenced by editorial components are loaded by `/`.
- `data/` is ignored except for `.gitkeep` and may hold local heavyweight working files, never production RSVP data.

Do not modify or add files under `public/` without explicit approval and provenance checks.

## Documentation and review

- `README.md` gives the public product overview and local commands.
- `docs/editorial-home.md` documents home maintenance and photography handling.
- `docs/rsvp.md` defines the planned personal-token and backend boundary.
- `docs/quest-guide.md` documents dormant game code and invariants.
- `docs/visual-direction.md` records the current visual system and asset provenance.
- `docs/ai-workflow.md` and `docs/multiagent-workflow.md` define validation and independent review.

Codex may implement scoped changes, but a fresh read-only Codex execution must perform the combined Code + QA review. Final approval remains human; no review command may commit, merge, or push.
