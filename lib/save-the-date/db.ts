import "server-only";

import { neon } from "@neondatabase/serverless";
import type { SaveTheDateRecordRequest } from "./workflow";
import { createSaveTheDateStore } from "./persistence";

function databaseQuery() {
  const url = process.env.GUEST_SYNC_DATABASE_URL;
  if (!url || !process.env.DATABASE_URL)
    throw new Error("STD_DATABASE_NOT_CONFIGURED");
  const rsvp = new URL(process.env.DATABASE_URL);
  const sync = new URL(url);
  if (rsvp.hostname.replace("-pooler", "") !== sync.hostname.replace("-pooler", "") ||
    rsvp.pathname !== sync.pathname)
    throw new Error("STD_DATABASE_BRANCH_MISMATCH");
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(20000) } });
}

function store() {
  const client = databaseQuery();
  return createSaveTheDateStore((statement, parameters) => client.query(statement, parameters));
}

export function readSaveTheDateState(source: string, externalHouseholdId: string) {
  return store().state(source, externalHouseholdId);
}

export function readSaveTheDateStates(source: string) {
  return store().states(source);
}

export function readSaveTheDateEvents(source: string) {
  return store().events(source);
}

export function findRecordedSaveTheDate(request: SaveTheDateRecordRequest) {
  return store().recorded(request);
}

export function recordSaveTheDateInDatabase(request: SaveTheDateRecordRequest) {
  return store().record(request);
}
