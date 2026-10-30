import "server-only";
import * as database from "./db";
import { readSheet, sourceId } from "./google";
import { apply, cancel, preview } from "./workflow";
const deps = { ...database, readSheet, sourceId };
export const previewSync = (actor: string) => preview(actor, deps);
export const applySync = (receipt: string, actor: string) =>
  apply(receipt, actor, deps);
export const cancelSync = (receipt: string, actor: string) =>
  cancel(receipt, actor, deps);
