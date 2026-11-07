import "server-only";

import { neon } from "@neondatabase/serverless";
import type { ImportedHouseholdActivationReceipt } from "./imported-household-activation-receipt";

function sql() {
  const url = process.env.GUEST_SYNC_DATABASE_URL;
  if (!url || !process.env.DATABASE_URL) throw new Error("IMPORTED_ACTIVATION_DATABASE_NOT_CONFIGURED");
  const rsvp = new URL(process.env.DATABASE_URL);
  const sync = new URL(url);
  if (rsvp.hostname.replace("-pooler", "") !== sync.hostname.replace("-pooler", "") ||
    rsvp.pathname !== sync.pathname)
    throw new Error("IMPORTED_ACTIVATION_DATABASE_BRANCH_MISMATCH");
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(20000) } });
}

function parameters(receipt: ImportedHouseholdActivationReceipt) {
  return [receipt.id, receipt.actor, receipt.source, receipt.externalHouseholdId,
    receipt.householdId, 0, receipt.tokenHash];
}

export async function wasImportedHouseholdActivationCommitted(
  receipt: ImportedHouseholdActivationReceipt
) {
  const rows = await sql().query(
    "select rsvp.imported_household_invitation_activation_committed($1,$2,$3,$4,$5,$6,$7) as committed",
    parameters(receipt)
  ) as { committed: boolean }[];
  return rows[0]?.committed === true;
}

export async function activateImportedHouseholdInvitation(
  receipt: ImportedHouseholdActivationReceipt
) {
  const rows = await sql().query(
    "select rsvp.activate_imported_household_invitation($1,$2,$3,$4,$5,$6,$7) as result",
    parameters(receipt)
  ) as { result: { status: "active"; replayed: boolean } }[];
  if (rows[0]?.result?.status !== "active") throw new Error("IMPORTED_ACTIVATION_UNAVAILABLE");
  return rows[0].result;
}
