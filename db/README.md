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
exports without copying guest answers into the audit metadata.

For a local encrypted-disk backup, load `DATABASE_URL` into the shell and run
`npm run backup:rsvp`. The generated `backups/` directory is ignored by Git and
files are created with owner-only permissions. Move backups to an encrypted,
access-controlled location; do not email them or put them in a shared public
folder. Periodically test restoration into a separate Neon branch.
