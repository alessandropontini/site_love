import { randomUUID } from "node:crypto";
import { buildPlan, hash, parseSheet } from "./model";
import type { Plan, Snapshot } from "./model";
import { signReceipt, verifyReceipt } from "./receipt";
import type { Receipt } from "./receipt";
export type Dependencies = {
  sourceId(): string;
  readSheet(): Promise<unknown[][]>;
  snapshot(): Promise<{ data: Snapshot & { sources: string[] }; hash: string }>;
  getRun(receipt: Receipt): Promise<string | undefined>;
  recordRun(
    receipt: Receipt,
    status: "FAILED" | "CANCELLED" | "CONFLICT",
    code: string,
    duration: number,
    errors?: number
  ): Promise<void>;
  applyPlan(receipt: Receipt, plan: Plan, duration: number): Promise<string>;
};
export async function preview(actor: string, deps: Dependencies) {
  const source = deps.sourceId();
  const [values, database] = await Promise.all([
    deps.readSheet(),
    deps.snapshot()
  ]);
  const plan = buildPlan(parseSheet(values), database.data);
  if (database.data.sources.some((s) => s !== source)) {
    plan.errors.push(
      "The database is linked to another spreadsheet. Source migration requires manual reconciliation."
    );
    plan.counts.errors++;
  }
  const receipt = signReceipt({
    id: randomUUID(),
    actor,
    source,
    sourceHash: hash(values),
    dbHash: database.hash,
    planHash: hash(plan),
    expires: Date.now() + 15 * 60_000
  });
  return { plan, receipt, databaseCount: database.data.inviteeCount };
}
export async function apply(token: string, actor: string, deps: Dependencies) {
  const started = Date.now();
  const receipt = verifyReceipt(token, actor);
  // Replay is checked before reading Google: a committed batch remains successful
  // even if Google is subsequently unavailable. No writes are repeated.
  const previous = await deps.getRun(receipt);
  if (previous) return previous;
  try {
    if (receipt.expires < Date.now() || receipt.source !== deps.sourceId()) {
      await deps.recordRun(
        receipt,
        "CONFLICT",
        "PREVIEW_EXPIRED",
        Date.now() - started
      );
      return (await deps.getRun(receipt)) ?? "CONFLICT";
    }
    const [values, database] = await Promise.all([
      deps.readSheet(),
      deps.snapshot()
    ]);
    const plan = buildPlan(parseSheet(values), database.data);
    if (
      hash(values) !== receipt.sourceHash ||
      database.hash !== receipt.dbHash ||
      hash(plan) !== receipt.planHash ||
      plan.errors.length ||
      database.data.sources.some((s) => s !== receipt.source)
    ) {
      await deps.recordRun(
        receipt,
        "CONFLICT",
        "PREVIEW_CHANGED",
        Date.now() - started,
        plan.errors.length
      );
      return (await deps.getRun(receipt)) ?? "CONFLICT";
    }
    // Database rechecks its snapshot under transaction locks, then applies and
    // records SUCCESS atomically. No client-provided change list is accepted.
    return await deps.applyPlan(receipt, plan, Date.now() - started);
  } catch {
    // A commit may have succeeded before a network timeout. Inspect its receipt.
    // If the database is unreachable, leave outcome unknown; never claim success.
    const committed = await deps.getRun(receipt);
    if (committed) return committed;
    await deps.recordRun(
      receipt,
      "FAILED",
      "APPLY_FAILED",
      Date.now() - started
    );
    return (await deps.getRun(receipt)) ?? "FAILED";
  }
}
export async function cancel(token: string, actor: string, deps: Dependencies) {
  const receipt = verifyReceipt(token, actor);
  await deps.recordRun(receipt, "CANCELLED", "ADMIN_CANCELLED", 0);
  return (await deps.getRun(receipt)) ?? "FAILED";
}
