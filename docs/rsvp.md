# RSVP and Household QR Plan

## Current status

RSVP on the public home remains informational. The personalized `/rsvp/[token]` route, server action, Postgres migrations, admin dashboard, protected CSV export, local backup, and private QR generator are implemented in the repository.

The flow is not production-active until a final domain, Neon database, Turnstile widget, claimed Clerk production instance, admin allowlist, approved privacy notice, and real invitation import exist. Without `DATABASE_URL`, the personalized route returns a neutral unavailable state and never claims a response was saved.

## Product decision

Each invited household will receive its own RSVP QR code. The QR is separate from any future games and points only to that household's wedding-response flow.

The implemented URL shape is:

```text
https://<stable-production-domain>/rsvp/<opaque-token>
```

In the Next.js App Router this maps to `/rsvp/[token]`. The route is dynamic, marked private/no-store/noindex, and resolves the token only on the server.

## Token contract

The route token is a bearer credential. Anyone who possesses it may be able to view or edit that household's RSVP, so it requires the same care as a private invitation link.

- Generate tokens with a cryptographically secure random source and at least 128 bits of entropy.
- Use an opaque URL-safe value. Do not encode names, email addresses, phone numbers, sequential database IDs, guest counts, attendance, or other personal information.
- Store a one-way hash of the token server-side where practical; compare a hash of the presented token rather than keeping the raw value.
- Never write full tokens to application logs, analytics, error reports, screenshots, support documents, or source control.
- Allow revocation and replacement if a QR or link is lost or shared accidentally.
- A household can edit its response until its configured deadline. Optimistic versioning rejects stale concurrent edits.

The token identifies an invitation, not a person account. RSVP must not silently become authentication for games or another application.

## Backend boundary

The implemented Neon boundary supports:

- household invitation lookup by token hash;
- the exact invitees and attendance options allowed for that household;
- validation of all submitted values on the server;
- idempotent create/update behavior;
- a trustworthy `updatedAt` timestamp, response version, and metadata-only audit history;
- token revocation;
- a per-household update limit plus Cloudflare Turnstile in production;
- encrypted transport, access-controlled administration, backup, and deletion procedures;
- a defined data-retention period.

Do not replace this with static JSON, URL-encoded guest data, hidden fields as authority, a client-only API mock, email-only success UI, or `localStorage` persistence.

No real guest list or response fixture belongs in the repository. Development fixtures must be obviously fictional and remain outside production builds.

## Minimal data model

`db/migrations/001_rsvp.sql` and `002_admin_audit.sql` distinguish:

- **Household invitation** — opaque ID, token hash, status, locale preference if needed, deadline, revocation state.
- **Invitee** — household relationship, display name, attendance eligibility, plus-one or child rules where applicable.
- **Response** — attendance, structured meal choice, and update timestamp per permitted invitee.
- **Audit event** — invitation created, response updated, token revoked/reissued, administrative correction.
- **Admin event** — external administrator ID, export type, row count, and timestamp; never response content.

The form deliberately does not collect free-text allergy, disability, accessibility, email, or phone data. Special requirements are handled directly through the invitation channel. See `docs/privacy.md`.

## Public-home behavior

The `/` RSVP section contains:

- a heading such as **Conferma la tua presenza** / **Confirm your attendance**;
- a short explanation that every household will receive a personal QR code;
- a clear status such as **RSVP in preparazione** / **RSVP coming soon**.

It must not contain active guest fields, a submit control, a generated confirmation number, or copy that says a response was saved.

The personalized implementation provides:

- `/rsvp` without a token may show neutral instructions to use the personal invitation link;
- an invalid, revoked, or expired token receives a privacy-safe error that does not confirm whether a household exists;
- the valid token page reveals only the minimum data needed for that invitation;
- the form is bilingual, keyboard accessible, screen-reader usable, and resilient to refresh/retry;
- success copy confirms server persistence; the same link can be used for later edits before the deadline.

The request payload is rebuilt from server-resolved invitees. Client-supplied names, household IDs, or extra invitee IDs are not trusted. Zod validates every value, and the SQL statement requires the incoming invitees to match the household exactly before it increments the revision and upserts responses.

## QR generation and handling

Generate final QR codes only after all of the following are stable:

1. the production HTTPS domain;
2. the `/rsvp/[token]` route;
3. backend lookup and persistence;
4. token revocation/reissue workflow;
5. mobile and printed-code testing;
6. the final invitation list.

`npm run create:rsvp-invitations -- /private/list.json` reads a JSON file outside the repository, creates 256-bit URL-safe tokens, stores only SHA-256 hashes, inserts a batch atomically, and writes high-error-correction PNG files plus a private manifest outside the repository. The command rejects localhost, non-HTTPS origins, and any input/output path inside the project.

QR artwork and the manifest must not be committed under `public/` or another repository directory. Keep them in an encrypted access-controlled operational location.

Test every printed QR against the intended household before distribution. Use sufficient quiet zone and contrast, and retain a human-readable fallback URL or support path that does not expose the household name.

## Privacy rules

- Do not place guest names, emails, phone numbers, tokens, responses, or QR codes in `public/`, client bundles, static page source, analytics events, or source control.
- Do not use `localStorage`, cookies, or URL parameters as the RSVP system of record.
- Do not add third-party analytics or session replay to personalized RSVP pages.
- Minimize server and CDN logging of token paths; configure redaction before launch.
- Use an appropriate referrer policy so the personalized URL is not leaked to external links.
- Define data owner, administrators, retention, export, correction, and deletion procedures before collecting responses.

## Separation from games

Games are not mounted by the wedding site. If they return, they use a separate route or host, separate access/distribution, and a separate QR. Never reuse the RSVP token, household lookup, response record, or guest data to unlock or personalize a game without a new explicit privacy decision.

## Administration and recovery

`/admin/rsvp` uses Clerk authentication plus `RSVP_ADMIN_EMAILS`. Registration alone never grants access. The page and CSV route each enforce authorization server-side. CSV cells that could be interpreted as spreadsheet formulas are prefixed safely, and exports are marked private/no-store.

`npm run backup:rsvp` creates a custom-format `pg_dump` of the `rsvp` schema with owner-only permissions. Restore tests must target a separate Neon branch. A lost or shared link requires token rotation/reissue before launch; do not send the same compromised URL again.

## Decisions still required before launch

- Final production domain and registrar.
- Production Neon/Clerk/Turnstile accounts and owners.
- Final RSVP deadline and household list.
- Whether plus-one and child rules require extra structured schema fields.
- Recovery operator and token rotation procedure.
- Complete privacy contact, legal basis, provider regions, and deletion date approval.
- Copy owner and operational process for reviewing and sharing the minimum export.

## Launch checklist

- [x] Backend and data model implemented locally.
- [ ] Privacy/retention decisions documented.
- [ ] Opaque token generation, hashing, revocation, and rate limiting tested against production-like services.
- [ ] No guest data or token exists in repository/public assets.
- [ ] Invalid-token behavior does not leak invitation existence.
- [x] Italian and English form copy implemented.
- [ ] Keyboard, screen-reader, error, retry, and mobile flows tested.
- [ ] Response edits and concurrency tested.
- [ ] Domain and route stable before QR export.
- [ ] Every printed QR matched to the intended household.
- [ ] Games remain technically and operationally separate.
- [ ] Clerk users, admin allowlist, MFA, CSV export, backup, and restore tested.
