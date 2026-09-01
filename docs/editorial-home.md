# Editorial Home Guide

The canonical guest-facing route `/` is the complete bilingual, mobile-first wedding experience for **Alessandro & Bridget — La nostra avventura**. It contains no link, import, or unlock path to the retained games. The unlinked `/proposal`, `/duomo-proposals`, and `/sun-proposals` routes are internal visual-review surfaces, not part of this flow.

## Canonical page flow

The content order is intentional and remains the same on desktop and mobile:

```text
invitation → personal photographs → Casa Nuova Niviano → RSVP
```

- `app/page.tsx` statically mounts `EditorialHome`; canonical social metadata uses the configured production origin in `app/layout.tsx`.
- `components/editorial/EditorialHome.tsx` composes the public sections inside the locale provider.
- `components/editorial/EditorialNavigation.tsx` provides in-page navigation, language selection, active-section state, and motion-aware smooth scrolling.
- `components/editorial/EditorialLocaleProvider.tsx` keeps public language state independent from the dormant experience dictionaries while preserving the existing locale preference key.
- `components/editorial/WeddingVenue.tsx` presents verified venue facts, the original static paper scene, and official outbound links.
- `components/editorial/RsvpSection.tsx` presents the informational status and a non-functional, non-scannable QR motif without guest data.
- `components/editorial/EditorialHome.module.css` owns the editorial visual system and responsive behavior.
- `lib/editorialConfig.ts` is the bilingual content, section-ID, link, and asset source for the home.

The mounted editorial tree must not import `components/experience/`, `lib/experienceConfig.ts`, or game copy from `lib/i18n.ts`. Its four story entries are a public narrative snapshot owned by `editorialConfig.ts`, so later game edits cannot change the wedding invitation by accident.

`ExperienceShell`, game challenges, progression, migrations, and browser progress are retained in the repository but are not mounted. Home changes must not clear, rewrite, or migrate their stored state.

## Editorial configuration

`getEditorialContent(locale)` provides:

- page metadata and accessible navigation labels;
- hero copy, invitation faces, states, and controls;
- story entries;
- personal gallery records;
- Casa Nuova Niviano facts and official outbound link;
- informational RSVP copy;
- retained final-letter copy, currently unmounted;
- footer and colophon copy.

Every visible string, label, alternative text, status, and link description must exist in both Italian and English. Use an explicit placeholder for missing factual content; do not infer dates, addresses, services, personal anecdotes, venue details, or image permissions.

## Hero invitation and fallback

`HeroInvitation.tsx` always renders an HTML/CSS poster. `HeroInvitation3D.tsx` is a client-only dynamic import, so Three.js stays outside the server render and the rest of the site bundle.

When WebGL succeeds, the invitation uses generated canvas faces, paper materials, restrained lighting, pointer input, buttons, and arrow keys. Important copy remains normal HTML. The provisional freshwater-turtle mark is decorative and replaceable when the couple chooses a final symbol.

The renderer:

- caps device pixel ratio for desktop and phones;
- uses smaller textures and lower rendering cost on phones;
- renders only while motion is settling;
- pauses outside the hero and while the document is hidden;
- follows container size changes;
- transfers focus safely between the poster and canvas control;
- returns to the poster after setup failure or WebGL context loss.

With `prefers-reduced-motion: reduce`, entrance, floating, tilt, gallery drift, and long transitions are removed. Controls and content remain available.

## Personal photography

The gallery uses approved local couple photographs rather than stock imagery. Files belong under `public/photos/` and are rendered through `next/image`.

The photographs begin as a straight vertical column of equal-width, equal-height, face-focused strips. Their closed height and spacing follow the compact rhythm of the reference instead of simulating a crop inside a large rotated card. Selecting an item expands every strip to the same content height with one shared easing curve: the chosen photograph remains centred while its neighbours move above and below the stage. The image composition interpolates from its dedicated face crop to a more natural open view, and the caption and controls enter in the opposite column. The direction is adapted from the MIT-licensed [Codrops stack-to-content experiment](https://tympanus.net/codrops/2022/05/11/stack-to-content-layout-transition/), but the implementation deliberately avoids its global scroll reset, DOM reparenting and gesture-blocking observer. React state and CSS transitions keep the page scroll stable and make the interaction resilient inside the wedding homepage.

Desktop keeps the album identity beside the stack and the expanded photograph beside the editorial copy. Tablet and phone move the album identity into a dedicated header band above the closed stack, then switch to a single-column open stage with the photograph above the caption and controls. This prevents the title from covering any row—especially photographs seven and eight—and preserves horizontal swipe navigation, vertical page scrolling, and controls that do not overlap the image. Previous/next controls, arrow keys, Home, End, Escape and a focus return to the selected stack item provide equivalent navigation. Reduced-motion mode removes the long layout transitions while preserving both stack and content states.

Before adding or replacing any photograph:

1. Confirm that the couple is comfortable publishing it.
2. Strip EXIF, GPS location, capture time, camera/device identifiers, and other unnecessary metadata.
3. Apply orientation before metadata removal so display does not depend on an EXIF orientation tag.
4. Resize and export an optimized JPEG, AVIF, or WebP near the largest real display size.
5. Use a stable, non-personal filename.
6. Add factual bilingual alternative text and a caption when it adds meaning.
7. Check crops and focal points at 320, 390, 768, 1024, and 1440 px.

Do not restore the old remote Unsplash records in `lib/photos.ts`. Copy, captions, and meaningful context remain HTML.

## Casa Nuova Niviano

The wedding location is [Casa Nuova Niviano](https://www.casanuovaniviano.com/). Its section should help an invited guest understand the place while remaining concise and factual.

- Prefer details published by the official venue or supplied directly by Alessandro and Bridget.
- Link to the official website using a clearly named external link.
- Do not scrape or mirror the official website at runtime.
- Do not copy photographs from search results, social profiles, booking portals, or the official website without documented reuse permission.
- Keep an intentional editorial placeholder or existing original graphic until authorized venue photographs are supplied.
- When authorized files arrive, process them with the same metadata-removal and optimization workflow used for personal photographs.

The absence of an authorized venue photo is a content dependency, not permission to invent a visual or ship a third-party image.

## RSVP section

RSVP on the home is informational. It may tell guests that each household receives a personal QR code, but it must not contain a form, fake confirmation number, or client-only success state.

The implemented personalized route is `/rsvp/[token]`, with opaque tokens and server-side lookup/persistence. It becomes operational only when Neon and Turnstile production variables are configured. Do not put guest data, tokens, responses, exports, backups, manifests, or generated QR files in `public/`, client configuration, static JSON, or `localStorage`.

The public home CTA may move the visitor to the informational RSVP section. It must not link to a personalized route until the visitor has received a valid personal URL. See `docs/rsvp.md` before implementing any form or QR generation.

## Retained games

The paper-theatre code remains available under `components/experience/` with its configuration and progress hook. It is deliberately absent from the public route and public navigation. This preserves the work and existing progress without blending it into the wedding invitation.

If games return later, treat them as a separate product surface with a separate route or host, design review, and distribution QR. Do not reuse the RSVP token or infer that RSVP households have game accounts.

## Accessibility and responsive checks

- The page has one `h1`, a skip link, semantic sections, visible focus, and real links/buttons.
- The public section order is invitation → photographs → location → RSVP.
- Navigation respects modified clicks, browser history, and reduced-motion preferences.
- Phone photography preserves vertical page scrolling, supports direct thumbnail selection and swipe navigation after opening a photograph, and does not sit beneath a fixed bottom control.
- The mounted colophon uses native dialog behavior with Escape close, focus containment, and focus return; the final letter remains unmounted.
- The invitation is keyboard operable and retains a functional non-WebGL fallback.
- All interactive targets remain at least 44×44 px.
- The page has no horizontal overflow at 320, 390, 768, 1024, or 1440 px.
- Language changes update `html lang`, title, description, Open Graph locale, and every visible/accessible string.
- No public element links to a game route or mounts `ExperienceShell`.

## Asset and performance boundary

- Use `next/image` with intrinsic dimensions and responsive `sizes`.
- Reserve `priority` for above-the-fold imagery.
- Keep below-fold personal and venue images lazy.
- Three.js remains isolated to the invitation and renders on demand.
- `public/og-turtle-v1.jpg` is metadata-only and not page content.
- No external image CDN or runtime venue API is required.

After image changes, inspect dimensions, metadata, file size, crop, alternative text, and the production build output.
