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

- **Household invitation** — opaque ID, token hash, status, locale preference,
  contact email, deadline, revocation state and private source (`bride`, `groom`
  or `both`).
- **Invitee** — appartenenza al nucleo e nome mostrato.
- **Response** — attendance, later structured meal choice, and update timestamp
  per permitted invitee.
- **Additional guest** — one optional named +1, available only when the
  household has been explicitly authorised. Children are represented only by a
  household-level yes/no flag, without names, ages or dates of birth.
- **Audit event** — invitation created, response updated, token revoked/reissued, administrative correction.
- **Admin event** — external administrator ID, export type, row count, and timestamp; never response content.

The attendance phase collects one confirmed household email for transactional
wedding confirmations and reminders. It deliberately does not collect phone
numbers, dates of birth, or free-text allergy, disability, accessibility, or
health data. Special requirements are handled directly through the invitation
channel. See `docs/privacy.md`.

Transactional confirmation email is provider-gated. It is sent through Resend
only when `RSVP_EMAIL_ENABLED=1`, `RESEND_API_KEY`, and `RSVP_EMAIL_FROM` are all
configured. The message contains no personal RSVP link or response details, and
uses an idempotency key based on household ID and revision. Open and click
tracking must remain disabled.

Due persone con lo stesso `household_id` fanno parte dello stesso nucleo e
usano lo stesso link/QR; non sono necessariamente una coppia. `invited_by`
appartiene al nucleo: tutti i componenti ereditano la stessa provenienza e non
possono essere classificati separatamente. Questa informazione compare soltanto
in dashboard ed export, non nella pagina personale dell'invitato.

Il +1 non è una regola globale. `allow_plus_one` è disattivato per impostazione
predefinita e viene abilitato soltanto per i nuclei autorizzati ad aggiungere un
accompagnatore non già nominato. Se entrambi i componenti di una coppia sono
già presenti tra gli `invitees`, non sono +1 e il campo resta nascosto.

Le opzioni menu restano strutturate ma non compaiono nella prima fase. Verranno
attivate sullo stesso link personale soltanto dopo la conferma di location e
catering; fino ad allora una presenza confermata può avere menu nullo.

Ogni portata della proposta apre una finestra accessibile con foto illustrativa,
spiegazione e ingredienti tipici in italiano o inglese. Le immagini sono asset
originali locali, non contengono dati degli invitati e non attivano richieste a
servizi esterni. La finestra usa il dialogo nativo del browser: supporta
tastiera, chiusura con `Esc` e ritorno del focus al comando che l'ha aperta.

Quando un invitato riapre lo stesso link, email, presenza, +1 e indicazione
sì/no sui figli vengono caricati dal database e riselezionati nel form. Un invio successivo viene
accettato soltanto dopo una conferma esplicita nel browser; un invio identico
viene bloccato sia nel browser sia dall'operazione atomica sul server, senza
incrementare la revisione né scrivere un evento di audit. Il salvataggio
aggiorna soltanto le persone le cui scelte sono
cambiate, così la dashboard può evidenziarle come modificate nell'ultimo invio
senza conservare nel log una copia storica delle preferenze. Dopo un
salvataggio riuscito la route viene aggiornata e il form viene ricreato usando
la nuova `response_version`, così i controlli non possono trattenere valori
precedenti soltanto nello stato React.

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

The local-only database contract for recording a response received off-site is
documented in [manual RSVP](manual-rsvp.md). Migration 014 is not applied to
Neon. The Clerk/allowlist-protected `/admin/rsvp/manual` screen supports
household review, explicit confirmation, and same-payload retry after an
uncertain result. Its dashboard grant review and authenticated browser
walkthrough remain separate roadmap items.

`npm run backup:rsvp` creates a custom-format `pg_dump` of the `rsvp` schema with owner-only permissions. Restore tests must target a separate Neon branch. A lost or shared link requires token rotation/reissue before launch; do not send the same compromised URL again.

## Decisions still required before launch

- Final production domain and registrar.
- Production Neon/Clerk/Turnstile accounts and owners.
- Final RSVP deadline and household list.
- Mark `allowPlusOne` only for households genuinely authorised to add an
  unnamed companion.
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

## Manual planning synchronization

`/admin/guests` (linked from `/admin/rsvp`) implements a manual Sheets → Neon
Preview/Apply flow. See [guest-list-sync.md](guest-list-sync.md) for setup,
permissions, mapping and recovery. Administration now uses English UI and a
verified Clerk email matching the existing allowlist.

Migration 008 introduces permanent external UUID mappings and metadata-only
batch history. Imported households have null token hashes and disabled status;
there is no token generation or invitation issuance in sync. Named adult invitees
reuse the current household model. Child names and dietary/notes text are never
imported; child places do not set the RSVP `has_children` answer. Unnamed +1 places
only control explicitly validated permission on unissued households.

Sync preserves all replies, contact email, response version/timestamps, RSVP
audit, tokens, deadlines and existing household relationships. Replied household
changes and issued-roster changes conflict; absent source records are retained.
Do not run the current invitation generator for imported households: activation
of existing UUIDs needs a separately reviewed issuance workflow.

### Imported-household activation — Step 8.1

The first implementation is a read-only preview model in
`lib/rsvp/imported-household-activation.ts`. It requires the registered
Household UUID source mode and an explicit one-to-one source Household UUID →
existing `rsvp.households.id` mapping. It compares the complete source Sync UUID
roster and named invitee mapping with the database snapshot, then blocks
excluded households, token or RSVP activity, non-disabled status and source /
database roster or invitation metadata drift.

This preview neither issues invitations nor creates or exposes a token, QR,
manifest or database write. The admin route and explicit preview action are
added in Step 8.2 below. The activation persistence boundary is added in Step
8.3; Clerk actions and the private one-time URL/QR handoff remain separate
bullets.

### Admin preview — Step 8.2

`/admin/invitations` is protected at page render and in its Server Action by
Clerk plus `RSVP_ADMIN_EMAILS`. Opening the page does not contact Sheets or the
database. An administrator must explicitly request a preview; the server then
reads the Household UUID source and minimized database snapshot and compares
them with the Step 8.1 planner. The page shows household mapping IDs, labels,
counts and blockers, without named invitees, contact details, answers, tokens,
hashes or raw snapshots. The response DTO is server-produced and does not accept
an ID from the browser.

This screen is review-only: it has no confirmation or activation control and
does not create links, QR codes, tokens, database writes or communications.
The atomic database boundary is documented in Step 8.3; the separately
authorized Clerk confirmation and private link/QR handoff remain to be built.

### Atomic persistence — Step 8.3

`db/migrations/013_imported_household_invitation_activation.sql` adds
`rsvp.activate_imported_household_invitation`. The caller supplies an
idempotency event UUID, authenticated actor ID, source ID, external Household
UUID, existing RSVP household UUID, expected response version and a SHA-256
token hash. The database requires the registered Household UUID mode and exact
one-to-one mapping, validates the persisted guest/invitee roster, checks active
exclusions, and rejects any existing token, non-disabled state or RSVP
activity. It serializes with guest sync, reconciliation and RSVP writes under
the shared lock. A successful transaction updates only the existing household's
token hash and status and appends a metadata-only event. Exact retries return a
replay result; a reused event ID with different inputs is rejected. No
household, invitee, membership, response, prior audit record or token is
replaced. The function takes only the hash, never the bearer token. `site_love_sync`
may execute it but cannot write the household or journal tables directly; the
ordinary RSVP role has no execute grant. PGlite tests cover the transaction,
replay, conflict cases, data preservation and grants using fictional fixtures.
Migration 013 has not been applied to Neon.

### Clerk confirmation and retries — Step 8.4

The protected `/admin/invitations` workflow separates read-only preview,
preparation/review and explicit confirmation. Both Server Actions call
`requireRsvpAdmin` before any Sheets or database read, and each request is
independently authorized. Preparation rechecks the selected external Household
UUID mapping, validates current source/database eligibility, generates a
256-bit opaque RSVP token and signs an actor-bound receipt containing its SHA-256
hash plus an HMAC commitment to the current source snapshot. The raw token is
returned only to the current browser page; it is never logged or persisted by
the server. The administrator must confirm that exact mapping before the
existing household can be activated.

Confirmation checks for an exact committed event first, then enforces the
30-minute receipt expiry, re-reads Sheets and compares the source commitment,
and calls the atomic SQL function. SQL rechecks mapping, roster, exclusion,
token and RSVP state under its shared lock. If a network timeout obscures a
successful commit, retrying the same receipt returns the journal match before
expiry checks. The raw token remains in page memory during a pending/retry flow;
closing or refreshing that page discards it, so keep the page open during an
unverified confirmation. After confirmation the page reveals the private RSVP
URL; Step 8.5 adds explicit browser-side QR generation. The flow does not send a message. A changed source or any
incompatible database state blocks a new activation. These operations have
only been exercised with fictional fixtures; neither Sheets nor Neon was
contacted in local tests.

### Private URL and QR handoff — Step 8.5

After activation succeeds, the page keeps the RSVP URL in memory and offers an
explicit copy action. QR rendering is a separate user action. The browser
renders a 512-pixel PNG with high error correction into an in-memory data URL;
the administrator may download it to a private location. The renderer accepts
only the same origin over HTTPS (HTTP is allowed for localhost development), an
exact `/rsvp/<43-character opaque token>` path, and no query or fragment. The
PNG is not written to the repository, server, database or manifest and is not
sent. Refreshing or closing the page discards the URL and QR; a downloaded
image must be protected by the administrator. The local test generates only a
synthetic fixture QR in memory and verifies the PNG bytes and URL restrictions.
