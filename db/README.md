# RSVP database

The numbered files under `migrations/` create the private Postgres schema used
by the personal household RSVP flow and its administration audit. They contain
structure only: never add real guest
names, tokens, responses, QR codes, credentials, or exports to this directory.

Apply migrations through the protected Neon SQL editor or a controlled release
step after creating the production project. The application connects through
the server-only `DATABASE_URL` variable.

Use a dedicated application role with access only to the `rsvp` schema. The
owner connection is appropriate for applying migrations, not for the deployed
runtime. Grant the runtime role only `USAGE` on the schema and the table and
sequence privileges required by the application.

Apply migrations in numeric order. `002_admin_audit.sql` records administrative
exports without copying guest answers into the audit metadata;
`004_invitee_source.sql` is the transitional introduction of the private
bride/groom/both category; `005_household_invitation_source.sql` normalizes it
onto the household, ensuring every member of one invitation shares its source;
`006_attendance_phase.sql` adds the household contact email, one optional +1,
a minimal children yes/no flag and nullable meal choices for the
attendance-first phase. `007_household_plus_one_permission.sql` makes the +1 an
explicit per-household permission that is disabled by default.

For a local encrypted-disk backup, load `DATABASE_URL` into the shell and run
`npm run backup:rsvp`. The generated `backups/` directory is ignored by Git and
files are created with owner-only permissions. Move backups to an encrypted,
access-controlled location; do not email them or put them in a shared public
folder. Periodically test restoration into a separate Neon branch.

`008_guest_list_sync.sql` adds manual guest planning synchronization, permanent
source mappings, batch history and restricted functions. It permits null token
hashes only for disabled households; it does not issue tokens or touch existing
responses. Create the separate `site_love_sync` role before migration or apply
the documented grants afterwards. Its URL must point to the same database as
RSVP. See [the sync guide](../docs/guest-list-sync.md) before applying or rolling
back; do not grant its functions to the public RSVP runtime role.


`009_guest_sync_test_exclusions.sql` introduces sync contract v2, explicit
operator-only test exclusions and classification history. It does not classify
any existing household automatically. Eligibility rows default to false and a
composite FK prevents excluded households from acquiring source membership.
The seven-argument Apply entry point fails closed; application and schema must
be upgraded together with sync paused. Do not grant the classification function
or registry writes to runtime roles. Apply to DEVELOPMENT only after separate
approval and backup/restore verification; do not automatically deploy it to
production. See the sync guide for rollback and the exact operator contract.

`010_guest_sync_household_runtime.sql` upgrades synchronization to contract v3.
It registers existing sources as legacy, adds a one-to-one source Household UUID
mapping with a composite member foreign key, includes mappings and modes in the
snapshot, and adds explicit-mode transactional Apply. Existing Neon households
are never adopted or assigned a Household UUID by this migration. A reviewed,
owner-only reconciliation must map every existing member before changing a
source from legacy mode. Old 7/8-argument Apply signatures fail closed. Validate
on an isolated database first and follow `docs/guest-list-sync.md`; this
repository step does not apply the migration to Neon.

`011_guest_sync_household_reconciliation.sql` adds a privileged, owner-only
entrypoint for separately approved existing-household mappings. The caller must
provide the exact complete set of mapped guest UUIDs for one internal
household; the procedure verifies the roster under the sync lock, rejects
excluded or already mapped households, records a metadata-only event attributed
to the database login, and changes only the mapping table/member mapping
column. It does not update invitation or RSVP state. Runtime roles receive no
execute or audit-table access. Use only with an independently reviewed mapping
and an approved environment/backup procedure; the migration does not reconcile
any records by itself.

`012_save_the_date_tracking.sql` adds a versioned current state and an
append-only event journal for manually prepared Save the Date outcomes. Both
are keyed by the exact `(source_id, external_household_id)` mapping and retain
only household/contact UUIDs, server-asserted admin actor, channel/language,
template, status transitions and HMAC commitments. Message text, destination
values, tokens and RSVP answers are not stored. The function validates the
Household UUID mapping and named contact and commits state plus event atomically.
`site_love_sync` receives SELECT and function EXECUTE only; neither it nor
`site_love_app` receives direct write privileges. The SQL function does not
prove that a human sent a message; the Clerk-protected server action attests the
administrator's declaration. PGlite covers the migration and grants with
synthetic data. This repository change does not apply migration 012 to Neon.

`013_imported_household_invitation_activation.sql` adds the atomic activation
entrypoint for an existing imported household. It accepts only the exact
source/external/internal UUID mapping, a server-generated token hash and an
idempotency event ID. It rechecks Household UUID mode, persisted
membership/name consistency, active exclusions, disabled/unissued state and
absence of RSVP activity under the shared synchronization lock. It updates
only `households.token_hash` and `households.status`, preserving IDs, invitees,
membership, responses and existing audit rows. The append-only journal stores
the actor, mapping and a request hash, never the bearer token. Only the
server-only sync login may execute the function; it receives no direct table
write or event-journal access, and `site_love_app` is denied. PGlite tests use
fictional IDs and hashes. Do not apply migration 013 to Neon without separate
approval.

The same migration exposes `rsvp.imported_household_invitation_activation_committed`
to the sync role. It returns only whether an exact event/actor/mapping/hash
combination is already committed, allowing an administrator retry after a
network timeout to recover success before receipt expiry checks. It cannot
create or mutate an activation and exposes no journal contents. The RSVP app
role and public remain denied.

`014_manual_rsvp.sql` adds the database contract for an explicitly confirmed
response received by phone, message, paper or in person. It shares the current
household revision and RSVP response tables; an operation checks the complete
named roster and writes answers, response audit metadata and a replay journal
atomically. A structured reason distinguishes a first off-site response from a
correction. The journal contains actor, provenance, reason, revision and a
server-computed HMAC commitment, never response content, contact email or
token. The Clerk-protected Server Action derives the actor and binds every
validated request field to that HMAC; SQL cannot verify a Clerk session. The
`site_love_sync` role can execute the restricted functions and read the
metadata-only journal, but cannot directly write it; `site_love_app` remains
denied. Clerk/allowlist-protected server actions now call this adapter, while
the admin form is still a separate step. The migration has only been tested
locally with fictional data and must not be applied to Neon without separate
approval.
