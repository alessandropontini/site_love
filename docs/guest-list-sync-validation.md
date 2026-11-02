# Guest synchronization validation — 30 October 2026

Implemented on `feat/guest-list-batch-sync`; no production migration, real guest
import, spreadsheet mutation, invitation issuance, merge or deploy was performed.

## Results

- Node test runner: **47 passed, 0 failed, 0 skipped**, including subtests/groups.
- SQL integration: actual migrations/Apply executed in temporary PostgreSQL WASM
  using only fictional data. Tested the dedicated role's grants and denial of
  direct writes to replies/contact email. No Neon connection was used.
- `npm run lint`: passed.
- `npm run build`: passed (Next.js 16.3.2 / TypeScript checks).
- `git diff --check`: passed.
- Local HTTP smoke: `/` 200; `/admin/guests`, `/admin/rsvp` and export return 404
  without configured admin credentials, with private/no-store headers; invalid
  RSVP route renders the existing neutral unavailable page with private/no-store.
- Independent read-only Codex Work Mode review: **PASS WITH NOTES** after fixes.
  See `.agent/reports/guest-sync-20261030/independent-review.md`.
- Mandatory CLI review wrapper: **INFRASTRUCTURE BLOCKED** (Codex CLI absent).
  The wrapper's unrelated orchestration timeout smoke also returned 125 instead
  of expected 124 in this environment. These are not reported as passing.

## Requested scenario coverage

| Scenario | Evidence |
| --- | --- |
| Empty database / first import | Engine + SQL: disabled household, no token |
| Second unchanged import | JSONB round-trip SQL and canonical-hash regression |
| New guest | Engine insertion, stable mapping |
| Name change | Engine + SQL: same internal/external UUIDs |
| List owner change | Engine + SQL; mixed-owner validation and drift detection |
| New companion | Engine + SQL: permission, no extra named invitee |
| Household change | Explicit reconciliation conflict |
| Removed source row | SQL record retained; no deletion |
| Duplicate ID | Parser and identifier script block writes |
| Incomplete row | Server-side validation blocks whole batch |
| Google unavailable | Mocked network/timeout/auth/rate-limit errors |
| Database unavailable | Injected failure never reports success |
| Repeated import / request | SQL idempotence and batch replay recovery |
| Concurrent administrators | Workflow interleaving; SQL stale-snapshot rejection |
| Source changes after Preview | Signed receipt digest conflict |
| Confirmed household | SQL byte-for-byte RSVP state preservation; changes blocked |
| Row sorting | UUID-based no-change classification |
| Identifier assignment error | Executed Apps Script in mock sandbox; partial-write retry preserves saved UUIDs |

Additional tests cover transaction rollback after a mid-batch constraint failure,
Clerk verified-email allowlisting, tampered/expired/other-actor receipts,
cancellation, same-receipt races, key-order canonicalization, source truncation,
private-field minimization and manual database drift.

## Still required before production

Real multi-connection Neon lock tests, service-account authentication/sharing,
Clerk sessions and server-action/browser end-to-end checks, responsive/keyboard
inspection with authenticated fictional data, source cleanup, ID initialization,
backup/restore and local CLI review. SQL WASM tests are not real Neon concurrency
or browser tests. No external test credentials were provisioned automatically.

Use [guest-list-sync.md](guest-list-sync.md) for reproducible commands, configuration,
limits, separate invitation activation and the operator checklist.
