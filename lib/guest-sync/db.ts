import "server-only";
import { neon } from "@neondatabase/serverless";
import type { Plan, Snapshot } from "./model";
import type { Receipt } from "./receipt";
export type Run = {
  id: string;
  created_at: string;
  actor_id: string;
  status: string;
  created_records: number;
  updated_records: number;
  unchanged_records: number;
  missing_records: number;
  validation_errors: number;
  duration_ms: number;
  error_code: string | null;
};
function sql() {
  const url = process.env.GUEST_SYNC_DATABASE_URL;
  if (!url || !process.env.DATABASE_URL)
    throw new Error("SYNC_DATABASE_NOT_CONFIGURED");
  const normal = new URL(process.env.DATABASE_URL);
  const sync = new URL(url);
  if (
    normal.hostname.replace("-pooler", "") !==
      sync.hostname.replace("-pooler", "") ||
    normal.pathname !== sync.pathname
  )
    throw new Error("SYNC_MUST_USE_RSVP_DATABASE");
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(20000) } });
}
export async function snapshot() {
  const rows = await sql().query(
    "select data, md5(data::text) as hash from (select rsvp.guest_sync_snapshot() as data) s",
    []
  );
  return rows[0] as { data: Snapshot & { sources: string[] }; hash: string };
}
export async function recentRuns() {
  return (await sql().query(
    "select id, created_at::text, actor_id, status, created_records, updated_records, unchanged_records, missing_records, validation_errors, duration_ms, error_code from rsvp.guest_sync_runs order by created_at desc limit 20",
    []
  )) as Run[];
}
export async function getRun(receipt: Receipt) {
  const rows = await sql().query(
    "select status from rsvp.guest_sync_runs where id=$1 and actor_id=$2 and source_id=$3",
    [receipt.id, receipt.actor, receipt.source]
  );
  return rows[0]?.status as string | undefined;
}
export async function recordRun(
  receipt: Receipt,
  status: "FAILED" | "CANCELLED" | "CONFLICT",
  code: string,
  duration: number,
  errors = 0
) {
  // Never overwrite a committed SUCCESS if the client lost its response.
  await sql().query(
    `insert into rsvp.guest_sync_runs(id,actor_id,source_id,status,error_code,duration_ms,validation_errors)
    values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do nothing`,
    [receipt.id, receipt.actor, receipt.source, status, code, duration, errors]
  );
}
export async function applyPlan(
  receipt: Receipt,
  plan: Plan,
  duration: number
) {
  const rows = await sql().query(
    "select rsvp.apply_guest_sync($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9) as status",
    [
      receipt.id,
      receipt.actor,
      receipt.source,
      receipt.dbHash,
      JSON.stringify(plan.changes),
      JSON.stringify(plan.counts),
      duration,
      plan.contractVersion,
      plan.mode
    ]
  );
  return rows[0]?.status as string;
}

export async function lastSuccessfulSync() {
  const rows = await sql().query(
    "select max(created_at)::text as time from rsvp.guest_sync_runs where status='SUCCESS'",
    []
  );
  return rows[0]?.time as string | null;
}
