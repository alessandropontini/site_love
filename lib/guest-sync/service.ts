import "server-only";
import * as database from "./db";
import { readSheet, readSheets, sourceId } from "./google";
import { apply, cancel, preview } from "./workflow";
const deps = {
  ...database,
  readSheet,
  readSheets,
  sourceId,
  mode: () => process.env.GUEST_SYNC_MODE === "household_uuid" ? "household_uuid" as const : "legacy" as const
};
export const previewSync = (actor: string) => preview(actor, deps);
export const applySync = (receipt: string, actor: string) =>
  apply(receipt, actor, deps);
export const cancelSync = (receipt: string, actor: string) =>
  cancel(receipt, actor, deps);
