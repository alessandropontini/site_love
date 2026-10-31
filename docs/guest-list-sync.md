# Manual guest-list batch synchronization

## Operator guide — Alessandro and Bridget

1. Work in **Guest List** in the shared **THE LIST** workbook. Complete Guest name, optional Surname,
   Guest type (Adult/Child), Group, List owner (Ale/Bridget/Both), Party / family,
   Planning status and Priority. Use the same Party / family and List owner for
   every member of one invitation. Use `Plus-one of <host>` for an unnamed seat.
2. When adding new rows, pause edits together, then use the spreadsheet menu
   **Guest identifiers → Assign missing permanent IDs**. Resume edits only after
   it confirms readback. This step needs the one-time setup below. Never copy,
   regenerate, type formulas into or edit existing Sync UUID cells. When sorting,
   sort the **whole table including the hidden column**, never only visible cells.
3. Open `/admin/rsvp` → **Sync Guests** → **Preview Sync**. This is read-only:
   it does not alter the Sheet, guest tables, or synchronization history.
4. Review the counts, validation errors and every current/new value. Counts are
   source rows, including children and unnamed places; the database count is
   named adult RSVP invitees. These numbers intentionally need not match.
5. If valid, select the explicit confirmation checkbox and **Apply Changes**.
   The server reads the source again, rebuilds the plan, checks its signed
   15-minute preview, then checks the database again under transaction locks.
6. **SUCCESS** means the database transaction and audit record committed together.
   **CONFLICT** means obtain a fresh preview. **FAILED** means inspect setup and
   retry with a fresh preview. For an unknown result/network interruption, keep
   the existing preview and use **Retry / Check Batch**, which checks the same ID.
   Cancel records **CANCELLED** and prevents later application of that preview.

New households are **disabled and have no token**. Importing is planning only;
no QR, official invitation, email or public RSVP link is created.

## Boundaries and mapping

| Source column | Import policy |
| --- | --- |
| ID | Ignored; formula/row-dependent, never a reconciliation key |
| Sync UUID | Permanent external UUID; database UUIDs remain separate |
| Guest name | Given-name input (first name); preserve any existing full name without splitting |
| Surname | Optional surname; combined with Guest name for named adult `rsvp.invitees.display_name` |
| Guest type | Adult/Child; child rows become anonymous planning places |
| Group | Private planning metadata |
| List owner | Ale → groom; Bridget → bride; Both → both; household-wide/private |
| Party / family | Initial grouping; immutable mapped membership; changes require reconciliation |
| Planning status | Private planning metadata, never invitation activation |
| Invitation | Ignored; does not issue, revoke or activate invitations |
| RSVP | Ignored; PostgreSQL remains authoritative for replies |
| Priority, Table | Private planning metadata |
| Dietary requirements, Notes | Never imported, returned in previews or logged |

Names for children and placeholders are discarded before planning/storage.
Only anonymous row identity, type and organizational metadata are stored for
these places. `has_children` is an RSVP answer and is never set from the sheet.
One unnamed companion can enable `allow_plus_one` for one named adult in an
unissued household; it never creates a named invitee. A named couple does not
receive an additional +1. More complex companion arrangements fail validation.

The protected admin page renders guest names only to authorized spouses. They
are not embedded in static assets, source fixtures, browser persistence or
public routes. Google values (including ignored columns) exist transiently in
server memory during the read and source digest calculation; logs and receipts
contain no copies. Google Notes/dietary fields should still be minimized at source.

## Name and surname compatibility

### Confirmed source schema

**Guest name is the first-name field**, as confirmed by the owner. Keep Guest
name and Surname; do not introduce First name or Last name columns or aliases.
The existing sourceName property stores Guest name without a redundant firstName
property. No spreadsheet schema change or backfill is required.

Guest name may still contain a full legacy name: preserve it without guessing a
split. A surname correction for such a row requires deliberate human correction
of Guest name if necessary. Do not overwrite rows or infer unknown surnames.

The source uses **Guest name** and the existing **Surname** column. Surname may be absent in
legacy workbooks or blank while the list is completed; duplicate Surname headers
block validation. Column positions do not matter: parsing and ID assignment use
headers. Keep the full range (including Sync UUID) together when sorting.

For named adults, `sourceName` preserves the trimmed Guest name cell and `surname`
stores the explicitly entered surname (or null). `name` remains the display name
used by existing SQL, the RSVP form and admin exports. Append the surname only
when Guest name does not already equal it or end with that complete surname after
a whitespace boundary (case, Unicode normalization and whitespace are ignored
for this check only). Preserve source spelling; never infer or split names.
A supplied full name plus a different surname is not automatically repaired:
review the displayed result in Preview and correct the source deliberately.
The final display name and individual fields are limited to 120 characters.

Old mapping JSON without sourceName/surname is compared using sourceName=name
and surname=null. Adding an empty column causes no update; actual source-field
changes are tracked even if the displayed name stays the same. Existing SQL
stores these fields in mapping JSONB and still writes only `name` to invitees;
no additional migration is required for this change. A code rollback to a parser
that ignores surnames is unsafe after importing them: disable sync until the
compatible version is restored instead of applying a legacy preview.

Name-only drafts without UUID or organizational fields remain provisional even
when Surname is filled. Identified incomplete rows still fail validation. Child
and unnamed companion names **and surnames** are discarded before the plan;
`Plus-one of <host>` is recognized from Guest name, without adding a surname.
The ID menu still assigns IDs only to complete organizational rows; Surname is
not required. No source edits, ID reassignment, or RSVP writes happen in Preview.

The existing issued-invitation and replied-household restrictions remain in
force. This extension does not reconcile legacy households, identify unnamed
companions, change their RSVP-provided names, or activate invitations.

## Google setup (no extra paid runtime service)

1. In a Google Cloud project controlled by the couple, enable **Google Sheets API**.
2. Create a dedicated service account, with no project IAM roles, no domain-wide
   delegation and no access to other files. Create a private key and store its
   email/key in server-only environment secrets. Do not download it into the repo.
3. Share **only the specific spreadsheet** with its service-account email as
   **Viewer**. Do not share the containing folder. The API cannot scope permission
   to one tab; it can read the workbook, though the application requests only
   Guest List. Use a separate test workbook and test account in development.
4. Set `GUEST_SYNC_SPREADSHEET_ID` to the intended workbook ID. Its name shown in
   the UI is THE LIST; the ID is the real identity. The server uses a short-lived
   signed JWT and the `spreadsheets.readonly` OAuth scope. No Google SDK is added.
5. Rotate/revoke the key if exposed, and remove spreadsheet sharing to disable
   access. Authentication, forbidden/not-found, API and transport errors are
   sanitized and never include request headers, keys or Google response bodies.

References: [Sheets OAuth scopes](https://developers.google.com/workspace/sheets/api/scopes),
[service account OAuth](https://developers.google.com/identity/protocols/oauth2/service-account),
[Apps Script LockService](https://developers.google.com/apps-script/reference/lock/lock-service).

### Permanent ID setup

Use **Extensions → Apps Script** on a fictional workbook first. Install
`scripts/guest-sync-identifiers.gs` as a bound script and reload the workbook.
It adds a manual menu, creates/hides **Sync UUID**, and assigns UUID values only
where missing. It validates existing IDs before writing and verifies readback.
It has no scheduled trigger, no edit trigger, no web deployment and never calls
the website. `onOpen` only adds the menu; it does not modify data or synchronize.

A document lock serializes script executions but **does not lock human edits**.
Pause all human editing during this command. A failed/uncertain write is recovered
by rerunning after reading the column; persisted IDs are reused, never regenerated.
An incomplete ID column blocks Apply. Protect the column against accidental edits
using Sheets' range protection where appropriate; owners can still change it.
Sorting only visible columns breaks the identity contract and must not be done.
The site does **not** assign UUIDs during Apply: the Sheets API lacks a row-value
compare-and-swap spanning concurrent human sorts and writes. Keeping it read-only
avoids attaching a new UUID to the wrong person. This explicit additional step is
required when adding rows; there is no claim of an atomic cross-service ID write.

## Environment variables

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | Existing RSVP connection to the target Neon database |
| GUEST_SYNC_DATABASE_URL | Same database/branch, dedicated `site_love_sync` role |
| GUEST_SYNC_SPREADSHEET_ID | Exact source workbook ID, never inferred from title |
| GUEST_SYNC_GOOGLE_CLIENT_EMAIL | Dedicated service account email |
| GUEST_SYNC_GOOGLE_PRIVATE_KEY | PEM private key; literal `\n` is supported |
| GUEST_SYNC_SIGNING_SECRET | Random secret of at least 32 characters; use 32 random bytes encoded as hex |
| RSVP_ADMIN_EMAILS | Existing explicit Clerk admin allowlist |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY | Existing Clerk configuration |

All new variables are server-only (never `NEXT_PUBLIC_`). Generate the signing
secret outside the repository with `openssl rand -hex 32`. Rotating it invalidates
outstanding previews. Do not log or paste credentials into tickets or PRs.
The application verifies the two database URLs target the same host/branch and
database (pooled/non-pooled hostname variants are accepted). It does not create a
second database. All preview/apply/cancel actions independently require Clerk
and a **verified** allowlisted email; registration or an unverified secondary
email grants nothing. Next.js Server Actions enforce same-origin POST checks;
do not weaken `allowedOrigins` to bypass that protection.

## Database setup and permissions

Back up and test restore first. Apply migrations 001–008 in numeric order on an
isolated development branch with the schema owner, not a runtime credential.
Create the dedicated login role `site_love_sync` through Neon role management
before applying 008, or provision a restricted PostgreSQL login using a secure
operator workflow. Do not grant it owner membership, `BYPASSRLS`, superuser or
CREATE on schemas. Migration 008 grants the following if the role exists:

```sql
grant usage on schema rsvp to site_love_sync;
grant select, insert on rsvp.guest_sync_runs to site_love_sync;
grant execute on function rsvp.guest_sync_snapshot() to site_love_sync;
grant execute on function rsvp.apply_guest_sync(uuid,text,text,text,jsonb,jsonb,integer)
  to site_love_sync;
```

If created later, apply those grants separately. Do **not** grant sync privileges
to the ordinary `site_love_app` RSVP role. Runtime sync receives no direct writes
to households, invitees or responses. Reviewed SECURITY DEFINER functions owned
by the migration owner have fixed `pg_catalog, rsvp` search paths and PUBLIC
execution revoked. Their write list excludes every protected response field.
Do not grant untrusted users CREATE in `rsvp` or ownership of these functions.

Migration 008:

- Makes `households.token_hash` nullable, with a constraint requiring disabled
  status whenever null. Existing non-null tokens are unaffected.
- Adds `guest_sync_members`: unique permanent external ID, source ID, internal
  household/invitee foreign keys, and minimized planning data. The composite FK
  ensures an invitee belongs to the mapped household.
- Adds `guest_sync_runs`: batch UUID, server-derived Clerk actor, source ID,
  timestamps, counts, duration, sanitized code, final status. No payload snapshots.
- Adds a minimal private snapshot function and transactional Apply function.
  Advisory locking serializes batches; short table locks also coordinate with
  RSVP writes. Snapshot comparison occurs after locks. Failed SQL rolls back all
  guest writes; the server records a failure separately when the database allows.
- Keeps missing records, UUIDs, tokens, deadline, response_version, contact email,
  has_children, RSVP timestamps, responses, additional_guests and RSVP audit intact.

Preview is completely read-only, using a signed, actor-bound digest receipt rather
than persisting names or pending payloads. Apply accepts only this receipt and an
explicit confirmation, never a client-supplied diff. It re-derives every change.
Replay checks the final batch row before accessing Google. Cancellation and
failure insertion cannot overwrite an already committed SUCCESS.

## Conflicts and recovery

- Fix incomplete/invalid rows, duplicate IDs, owner inconsistencies and ambiguous
  companion names in the source, then preview again. One critical error blocks
  the whole batch; no partial import is allowed. Empty/oversized sources fail closed.
- Existing households without mappings block import. A maintainer must reconcile
  each existing invitee to a verified source UUID in a separate reviewed transaction;
  never auto-adopt by name or delete existing invitations to bypass the check.
- Renaming Party / family, merging/splitting households, changing named/child/+1
  type, or naming an existing companion requires manual reconciliation. Existing
  relationships are never reassigned by synchronization.
- Any change involving a replied household is blocked. Issued households also
  block name, membership and companion permission changes, even before a reply.
  Private planning updates on issued but unanswered households are permitted.
- Changes made directly in the database to owner, label, roster, name or companion
  permission are conflicts rather than silently overwritten.
- Missing rows are retained and listed for separate review. If another change
  affects that household, it is blocked until missing members are reconciled.
- If Google changes after Preview, or the relevant database snapshot changes,
  obtain a fresh preview. Sorting rows between Preview and Apply also invalidates
  the source digest; sorting before the next preview never changes permanent IDs.
- Apply reads Google immediately before the database transaction. Google and
  PostgreSQL have no shared transaction: edits made **after that read** are picked
  up by a subsequent preview. The committed batch always uses the approved values.
  Pause editing during Apply if a strict operational cutover is needed.
- After a response/network timeout, retry the same batch ID before starting another.
  If Neon is unreachable, neither success nor an audit write can be guaranteed;
  the UI reports unknown/unavailable. Check history after recovery.

### Invitation issuance is separate

**Do not run the existing `create:rsvp-invitations` generator on imported people.**
That command inserts new households and is not an activation tool for existing
imported records. Doing so would duplicate them. Before official invitation
issuance, implement/review an activation workflow that targets existing household
UUIDs, validates the roster, creates one private token/hash and QR, and activates
that same household atomically. This batch feature deliberately does not implement
or execute token/QR issuance. It remains a production operational prerequisite if
invitations will be issued after importing through this feature.

### Backup and rollback

`npm run backup:rsvp` dumps the entire rsvp schema, including mappings and runs.
Keep the dump encrypted/private and test restore on an isolated Neon branch.
Back up the Sheet's stable-ID column through private Google revision history too;
restoring a Sheet without matching IDs can break reconciliation. Never put either
backup in Git. A code rollback does not undo imports. Disable synchronization by
removing its credentials/sharing; preserve migration 008 while unissued households
exist. Do not restore an old database over newer RSVP replies or drop mapping
rows to force reimport. Use a reviewed corrective transaction and take a new backup.

## Development validation

No real guest fixture, credential or imported list belongs in source control.

```bash
npm ci
./scripts/test-guest-sync.sh
npm run lint
npm run build
```

The unit/workflow/Google/auth tests use Node's built-in runner and mocks. Optional
SQL integration uses a temporary PostgreSQL WASM engine installed **outside** the
project; it adds no production or package-lock dependency:

```bash
npm install --prefix /tmp/site-love-sql-test --no-save @electric-sql/pglite
PGLITE_TEST_MODULE=/tmp/site-love-sql-test/node_modules/@electric-sql/pglite \
  ./scripts/test-guest-sync.sh
```

The harness executes migrations and the real Apply SQL on fictional data. Only
`CREATE EXTENSION pgcrypto` is omitted because UUID generation is built in and
this WASM distribution lacks that extension. It is not a substitute for testing
Neon multi-connection locks, production roles, Clerk sessions or real Google auth.
Concurrency ordering is exercised with injected workflow dependencies; SQL tests
verify stale hashes, atomic rollback, replay and byte-for-byte RSVP preservation.

For end-to-end development: use a clean development Neon branch, apply migrations,
configure restricted roles and Clerk test users, create a separate fictional
workbook with the exact headers, run the ID menu, share it with a test service
account, set local secrets, and start `npm run dev`. Visit `/admin/guests`. Verify
Preview, Cancel, Apply, an unchanged second batch, a stale preview, a response
conflict, a failed request and a same-batch retry. Open two admin sessions for the
concurrent Apply test. Verify unauthorized users cannot render or invoke actions.
Check keyboard flow and 320/390/768/1024/1440px layouts. Do not seed a production
branch or run a batch against the real guest list during development.

Validation evidence: [guest-list-sync-validation.md](guest-list-sync-validation.md).

## Limits and activation checklist

- One configured workbook, exact English headers and Guest List tab; maximum
  5,000 data rows. Sheets reads use bounded timeouts and up to three HTTP attempts
  for 429/5xx. No schedulers, webhooks or automatic synchronization.
- The real workbook now has Sync UUID and Surname columns. Provisional rows and
  existing unmapped database households still require separate handling.
- All permanent-ID initialization is explicit and separate from Apply. The
  Surname column was added with user authorization; the code change does not
  write to the live workbook or Neon.
- Initial legacy mapping and changes to replied/issued household rosters require
  a maintainer; no self-service conflict resolver or deletion tool is included.
- Complete isolated Neon/Google/Clerk end-to-end tests, least-privilege review,
  human code review, backup/restore test, source cleanup, stable IDs and separate
  invitation activation before production use. No production deploy or migration
  is implied by merging this code.

## Proposed household evolution

See [Household design proposal](households-design.md) for the next stage: stable
household UUIDs, a separate Households sheet and explicit migration rules.
This is a proposal, not the active synchronization contract; current batches
still use the existing grouping and reconciliation protections.
