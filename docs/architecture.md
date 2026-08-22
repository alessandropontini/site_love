# Architecture Overview

Alessandro & Bridget is a Next.js 16 App Router wedding site with a canonical public home `/`, a personalized guest route `/rsvp/[token]`, and a separate spouses-only administration area. The root is a freely readable bilingual editorial experience; games and progression are deliberately outside the mounted product. The unlinked `/proposal`, `/duomo-proposals`, and `/sun-proposals` routes remain available only in development and return 404 in production.

## Diagramma operativo

`docs/architecture-diagram.md` rappresenta graficamente persone, dominio,
Vercel Preview/Production, route statiche e server, Clerk, Turnstile, Neon,
GitHub, backup e rollback. `docs/operations-guide.md` traduce il diagramma in
controlli e comandi eseguibili senza inserire segreti nella documentazione.

The canonical public sequence is:

```text
invitation → personal photographs → Casa Nuova Niviano → RSVP information
```

## Public app structure

- `app/layout.tsx` defines shared metadata, loads `Instrument Sans` and `Newsreader` through `next/font`, and imports `app/globals.css`.
- `app/page.tsx` statically mounts `EditorialHome`; `app/layout.tsx` derives canonical absolute metadata from `NEXT_PUBLIC_SITE_URL` or the production Vercel URL.
- `components/editorial/EditorialHome.tsx` composes the complete page inside the locale provider.
- `components/editorial/EditorialNavigation.tsx` provides desktop/mobile section navigation, the language selector, smooth in-page movement, and active-section state.
- `components/editorial/HeroInvitation.tsx` owns the opening copy, accessible poster fallback, controls, and lazy Three.js boundary.
- `components/editorial/HeroInvitation3D.tsx` is the only Three.js consumer. It renders on demand, pauses when hidden, and hands control back to the HTML poster after setup failure or context loss.
- `components/editorial/EditorialLocaleProvider.tsx` owns public locale detection and the persisted language preference without importing dormant game dictionaries.
- `RelationshipTimeline` and `FinalLetter` remain retained but unmounted. `PhotoGallery`, `WeddingVenue`, `RsvpSection`, and `EditorialFooter` isolate the mounted public sections.
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

The mounted home section stays informational. The real form exists only at `/rsvp/[token]`, where a dynamic Server Component hashes the opaque token, resolves the permitted household and invitees in Neon, and sends only the minimum display data to the client form.

The Server Action resolves the token again, reconstructs allowed invitee IDs, validates values with Zod, verifies Turnstile in production, enforces a per-household update limit and performs an optimistic-versioned SQL upsert. Invalid, expired, revoked, malformed, and unavailable states do not reveal whether a household exists.

Only attendance and a structured menu choice are collected. Free-text health/accessibility notes, email, and phone are deliberately excluded. Guest lists, raw tokens, responses, exports, backups, and generated QR images must never be placed in `public/`, shipped in client JavaScript, committed to source-controlled data files, or treated as `localStorage` state. See `docs/rsvp.md`.

### Administration

`/admin/rsvp` and `/admin/rsvp/export` are dynamic and private/no-store. Clerk proves identity; `RSVP_ADMIN_EMAILS` separately authorizes the spouses. Each resource checks authorization server-side. The dashboard never reads or emits token hashes, and the CSV route protects against spreadsheet formula injection while recording metadata-only export audit events.

### Retained final letter

The closing letter remains in the codebase but is not mounted or linked by the current public home.

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

Switching locale updates visible copy, accessible names, and `html lang`. Canonical metadata stays stable for the public URL. Only the public-home locale preference belongs in browser storage; RSVP records do not.

## Accessibility and mobile behavior

The public home provides one `h1`, a skip link, semantic sections, an ordered story, keyboard-operable invitation controls, native dialogs, visible focus, and a vertical phone flow.

- Navigation state is conveyed by text/shape and `aria-current`, not color alone.
- Interactive targets remain at least 44×44 px.
- Dialogs close on Escape and restore focus.
- Content order stays invitation → photographs → location → RSVP at every viewport.
- `prefers-reduced-motion` removes decorative movement without hiding controls or information.
- The HTML invitation fallback remains usable when WebGL is unavailable or lost.

Validate at 320, 390, 768, 1024, and 1440 px.

## Runtime, data, and cost boundary

The public home runtime uses Next.js, React, local CSS/SVG, local optimized images, and Three.js dynamically loaded only for the root hero. It does not require an account, database, analytics service, translation API, map tiles, or paid media service and is prerendered as static content.

The personalized boundary uses Neon Postgres, Cloudflare Turnstile and Next.js Server Actions. Clerk is loaded only on sign-in/admin routes. This preserves the static home and keeps expected hosting, database, bot protection, and authentication usage inside free tiers for wedding-scale traffic.

`next.config.mjs` applies CSP, clickjacking, MIME, referrer, permissions and HSTS headers. Personalized and admin routes add no-store/noindex headers; `robots.ts` disallows private/internal paths. Headers reduce attack surface but do not replace provider configuration, secret rotation, least-privilege database grants, backups or incident handling.

## Static assets

- `public/photos/` contains approved, metadata-stripped local photographs.
- `public/og-turtle-v1.jpg` is the generated 1200×630 social card with the provisional freshwater-turtle mark and is metadata-only.
- `public/scene/paper-theatre/` contains retained scene and rollback assets. Only assets explicitly referenced by editorial components are loaded by `/`.
- `data/` is ignored except for `.gitkeep` and may hold local heavyweight working files, never production RSVP data.

Do not modify or add files under `public/` without explicit approval and provenance checks.

## Documentation and review

- `README.md` gives the public product overview and local commands.
- `docs/editorial-home.md` documents home maintenance and photography handling.
- `docs/rsvp.md` defines the implemented personal-token boundary and production launch gates.
- `docs/deployment.md` defines the low-cost production runbook and launch gates.
- `docs/architecture-diagram.md` maps runtime, release, authentication, data and backup flows.
- `docs/operations-guide.md` is the Italian dashboard and command runbook for routine checks and incidents.
- `docs/privacy.md` defines data minimization, access, retention, and incident handling.
- `docs/quest-guide.md` documents dormant game code and invariants.
- `docs/visual-direction.md` records the current visual system and asset provenance.
- `docs/ai-workflow.md` and `docs/multiagent-workflow.md` define validation and independent review.

Codex may implement scoped changes, but a fresh read-only Codex execution must perform the combined Code + QA review. Final approval remains human; no review command may commit, merge, or push.
