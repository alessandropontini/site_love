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
