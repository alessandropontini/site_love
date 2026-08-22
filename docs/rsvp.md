# RSVP and Household QR Plan

## Current status

RSVP on the public home is informational only. It explains the intended personal invitation flow but does not collect, validate, send, or save a response.

This is intentional: there is no production backend, guest registry, privacy policy, stable personalized route, or final domain contract yet. The interface must not imply that data has been submitted when it has only changed client state.

## Product decision

Each invited household will receive its own RSVP QR code. The QR is separate from any future games and points only to that household's wedding-response flow.

The planned URL shape is:

```text
https://<stable-production-domain>/rsvp/<opaque-token>
```

In the Next.js App Router this maps conceptually to `/rsvp/[token]`. The route must not become functional until server-side token resolution and response persistence exist.

## Token contract

The route token is a bearer credential. Anyone who possesses it may be able to view or edit that household's RSVP, so it requires the same care as a private invitation link.

- Generate tokens with a cryptographically secure random source and at least 128 bits of entropy.
- Use an opaque URL-safe value. Do not encode names, email addresses, phone numbers, sequential database IDs, guest counts, attendance, or other personal information.
- Store a one-way hash of the token server-side where practical; compare a hash of the presented token rather than keeping the raw value.
- Never write full tokens to application logs, analytics, error reports, screenshots, support documents, or source control.
- Allow revocation and replacement if a QR or link is lost or shared accidentally.
- Decide explicitly whether a household can edit its response until a deadline or requires a separate confirmation step.

The token identifies an invitation, not a person account. RSVP must not silently become authentication for games or another application.

## Backend boundary

A production RSVP requires a real server-side system of record. At minimum it must support:

- household invitation lookup by token hash;
- the exact invitees and attendance options allowed for that household;
- validation of all submitted values on the server;
- idempotent create/update behavior;
- a trustworthy `updatedAt` timestamp and basic audit history;
- token revocation;
- rate limiting and abuse monitoring;
- encrypted transport, access-controlled administration, backup, and deletion procedures;
- a defined data-retention period.

Do not replace this with static JSON, URL-encoded guest data, hidden fields as authority, a client-only API mock, email-only success UI, or `localStorage` persistence.

No real guest list or response fixture belongs in the repository. Development fixtures must be obviously fictional and remain outside production builds.

## Minimal data model

Exact schema and provider are future decisions, but the boundary should distinguish:

- **Household invitation** — opaque ID, token hash, status, locale preference if needed, deadline, revocation state.
- **Invitee** — household relationship, display name, attendance eligibility, plus-one or child rules where applicable.
- **Response** — attendance per permitted invitee, optional contact channel, dietary/accessibility notes, submission timestamps.
- **Audit event** — invitation created, response updated, token revoked/reissued, administrative correction.

Collect only what the wedding organization genuinely needs. Avoid free-text fields when a smaller structured choice is sufficient, and define who may access sensitive dietary or accessibility notes.

## Public-home behavior

Until the backend exists, the `/` RSVP section may contain:

- a heading such as **Conferma la tua presenza** / **Confirm your attendance**;
- a short explanation that every household will receive a personal QR code;
- a clear status such as **RSVP in preparazione** / **RSVP coming soon**.

It must not contain active guest fields, a submit control, a generated confirmation number, or copy that says a response was saved.

Once personalized RSVP launches:

- `/rsvp` without a token may show neutral instructions to use the personal invitation link;
- an invalid, revoked, or expired token receives a privacy-safe error that does not confirm whether a household exists;
- the valid token page reveals only the minimum data needed for that invitation;
- the form is bilingual, keyboard accessible, screen-reader usable, and resilient to refresh/retry;
- success copy states exactly what was stored and how the household can modify it.

## QR generation and handling

Generate final QR codes only after all of the following are stable:

1. the production HTTPS domain;
2. the `/rsvp/[token]` route;
3. backend lookup and persistence;
4. token revocation/reissue workflow;
5. mobile and printed-code testing;
6. the final invitation list.

QR artwork may be exported for the private invitation-production workflow, but generated household QR files must not be committed under `public/` or another served repository directory. Keep the token-to-household mapping in the protected backend or an access-controlled operational system.

Test every printed QR against the intended household before distribution. Use sufficient quiet zone and contrast, and retain a human-readable fallback URL or support path that does not expose the household name.

## Privacy rules

- Do not place guest names, emails, phone numbers, tokens, responses, or QR codes in `public/`, client bundles, static page source, analytics events, or source control.
- Do not use `localStorage`, cookies, or URL parameters as the RSVP system of record.
- Avoid third-party analytics and session replay on personalized RSVP pages unless there is a reviewed, consent-aware need.
- Minimize server and CDN logging of token paths; configure redaction before launch.
- Use an appropriate referrer policy so the personalized URL is not leaked to external links.
- Define data owner, administrators, retention, export, correction, and deletion procedures before collecting responses.

## Separation from games

Games are not mounted by the wedding site. If they return, they use a separate route or host, separate access/distribution, and a separate QR. Never reuse the RSVP token, household lookup, response record, or guest data to unlock or personalize a game without a new explicit privacy decision.

## Decisions required before implementation

- Production domain and hosting platform.
- Backend/database provider and administrator access.
- RSVP deadline and whether edits remain open afterward.
- Exact invitee, plus-one, child, meal, dietary, accessibility, transport, and contact fields.
- Whether confirmation email is needed and which provider may process addresses.
- Recovery path when a household loses its personal link.
- Retention and deletion date after the event.
- Copy owner and operational process for reviewing responses.

## Launch checklist

- [ ] Backend and data model approved.
- [ ] Privacy/retention decisions documented.
- [ ] Opaque token generation, hashing, revocation, and rate limiting tested.
- [ ] No guest data or token exists in repository/public assets.
- [ ] Invalid-token behavior does not leak invitation existence.
- [ ] Italian and English form copy complete.
- [ ] Keyboard, screen-reader, error, retry, and mobile flows tested.
- [ ] Response edits and concurrency tested.
- [ ] Domain and route stable before QR export.
- [ ] Every printed QR matched to the intended household.
- [ ] Games remain technically and operationally separate.
