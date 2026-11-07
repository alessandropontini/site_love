import "server-only";

import { neon } from "@neondatabase/serverless";

import type { ManualResponseRequest } from "./model";
import { createManualResponseStore } from "./persistence";

function store() {
  const url = process.env.GUEST_SYNC_DATABASE_URL;
  if (!url || !process.env.DATABASE_URL) throw new Error("MANUAL_DATABASE_NOT_CONFIGURED");

  const rsvp = new URL(process.env.DATABASE_URL);
  const sync = new URL(url);
  if (
    rsvp.hostname.replace("-pooler", "") !== sync.hostname.replace("-pooler", "") ||
    rsvp.pathname !== sync.pathname
  ) {
    throw new Error("MANUAL_DATABASE_BRANCH_MISMATCH");
  }

  const client = neon(url, { fetchOptions: { signal: AbortSignal.timeout(20_000) } });
  return createManualResponseStore((statement, parameters) => client.query(statement, parameters));
}

export function readManualResponseHousehold(id: string) {
  return store().household(id);
}

export function recordManualResponse(request: ManualResponseRequest) {
  return store().record(request);
}
