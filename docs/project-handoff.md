# SITE LOVE — AI project handoff

This is a dated continuation index for Codex or another AI continuing SITE LOVE.
It does not replace `AGENTS.md`, current user instructions, the roadmap, or a
fresh check of GitHub.

## Snapshot verified 7 November 2026

- Repository: `alessandropontini/site_love`.
- Task branch: `feat/roadmap-recovery-20261106`.
- Remote checkpoint at verification: `20068ddd8c9d4bf6d4806f72343c3aff039fd8b2`.
- GitHub Actions run: [RSVP PostgreSQL validation](https://github.com/alessandropontini/site_love/actions/runs/42381118585), conclusion `success`.
- Step 8 implementation bullets 8.1–8.6e are present. Step 8 is operationally **partial** until the external checks below are completed.

Always query the current branch head before using this snapshot. The branch may
advance, and a temporary Work checkout is not the owner's Mac checkout.

## Completed verification evidence

- Guest-sync/RSVP/Save-the-Date suite: 174 passed, 0 failed, 0 skipped using fictional fixtures and PGlite.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run build -- --webpack`: passed on the application checkpoint before the PostgreSQL workflow commit; that later commit changed only test infrastructure and documentation.
- GitHub Actions on the checkpoint above: PostgreSQL 16 applied migrations 001–015, two separate `psql` clients raced the same activation, exactly one call committed and one replayed, and the existing RSVP backup command restored the RSVP schema into an ephemeral database with the synthetic household IDs and mapping intact.
- `git diff --check` and `bash -n scripts/test-rsvp-postgres-integration.sh`: passed for the workflow checkpoint.
- Static, non-independent inspection of admin proxy/auth/allowlist, page and Server Action boundaries found no issue in the inspected scope. This is not an independent review and not an authenticated browser walkthrough.

## Remaining gates and authorization boundary

1. Clerk authenticated browser walkthrough: not run because this checkout has no Clerk test instance or test credentials. Do not invent credentials or claim a mock login is a real Clerk test.
2. Restore and rollback rehearsal on a separate Neon test branch: not run. The owner has not authorized writes or migrations to Neon, including DEVELOPMENT.
3. No 8.7 functional product bullet is defined in the repository. Do not invent a new user-facing feature; use the roadmap and ask for a product decision only when the next implementation scope depends on one.

No real Google Sheets reads/writes, real household mappings, bearer invitation
tokens, QR files, communications, live migrations, merge, deployment, or
promotion were made for this checkpoint. The only migrations applied by the CI
job ran against its disposable PostgreSQL 16 service with fictional fixtures.

## Instructions for the next AI

1. Read `AGENTS.md`, this handoff, `docs/roadmap-recovery-audit.md`, and the guide relevant to the task before editing.
2. Verify checkout path, branch, worktree status, remote URL and remote branch head. Preserve unrelated or untracked user files; do not use `git reset`, force push, or cleanup commands to remove them.
3. Treat PGlite, native PostgreSQL CI, Clerk, and Neon evidence as four different things. PGlite tests database logic; GitHub Actions provides native PostgreSQL 16 concurrency and local dump/restore evidence; neither proves a Clerk browser flow or Neon branch restore.
4. Follow the current request and `AGENTS.md` for allowed actions. User-authorized task-branch commits and pushes are expected checkpoints; merge, deployment, credentials and live data operations remain outside that standing authorization.
5. Work one bullet at a time. Before moving to another bullet, inspect the exact diff, update `CHANGELOG.md` and the affected guide, run the relevant checks, commit, push, and verify the exact remote SHA. Never report a local commit as published.
6. For any independent Codex review, run the actual Codex provider workflow. If the Codex CLI is missing, report `INFRASTRUCTURE BLOCKED`; do not simulate an independent reviewer.

## Suggested continuation

The PostgreSQL concurrency and synthetic backup/restore gate is complete. The
only remaining Step 8 checks require Clerk test access or Neon write access,
which are outside the current authorization. An AI can continue independent
static review or documentation work, but should not mark those gates complete
or invent a functional Step 9 task without a documented scope.

The owner-facing preparation for those two manual checks is in
[`step-8-manual-validation-runbook.md`](step-8-manual-validation-runbook.md).
It is procedural only: it does not configure Clerk, connect to Neon/Sheets,
create test data, or authorize a live operation.

The current architecture, locally developable scopes, and proposed follow-up
for token revocation/reissue are in
[`step-8-architecture-roadmap.md`](step-8-architecture-roadmap.md). The
revocation/reissue item is not approved implementation scope; document the
product rules first. There is no other defined Step 8.7 feature.
