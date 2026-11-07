import { z } from "zod";
import type { GuestSheets, Snapshot } from "../guest-sync/model";
import { parseHouseholdSheets } from "../guest-sync/model";
import { previewImportedHouseholdActivation } from "./imported-household-activation";
import { hashRsvpToken } from "./token";
import {
  commitImportedActivationSource,
  createImportedActivationToken,
  signImportedActivationReceipt,
  verifyImportedActivationReceipt,
  type ImportedHouseholdActivationReceipt
} from "./imported-household-activation-receipt";

export type ImportedHouseholdActivationWorkflowDependencies = {
  sourceId(): string;
  readSheets(): Promise<GuestSheets>;
  snapshot(): Promise<{ data: Snapshot & { sources: string[] }; hash: string }>;
  committed(receipt: ImportedHouseholdActivationReceipt): Promise<boolean>;
  activate(receipt: ImportedHouseholdActivationReceipt): Promise<{ status: "active"; replayed: boolean }>;
  now?(): number;
  createToken?(): string;
};

const safeErrors = new Set([
  "INVALID_IMPORTED_ACTIVATION_PREPARATION",
  "INVALID_IMPORTED_ACTIVATION_CONFIRMATION",
  "INVALID_IMPORTED_ACTIVATION_RECEIPT",
  "IMPORTED_ACTIVATION_SIGNING_NOT_CONFIGURED",
  "IMPORTED_ACTIVATION_NOT_READY",
  "IMPORTED_ACTIVATION_PREVIEW_EXPIRED",
  "IMPORTED_ACTIVATION_PREVIEW_CHANGED",
  "IMPORTED_ACTIVATION_EVENT_REUSED",
  "IMPORTED_INVITATION_ALREADY_ACTIVATED",
  "IMPORTED_MAPPING_CHANGED",
  "IMPORTED_SOURCE_MODE_REQUIRED",
  "IMPORTED_HOUSEHOLD_EXCLUDED",
  "IMPORTED_HOUSEHOLD_INCOMPATIBLE",
  "IMPORTED_ROSTER_INCONSISTENT",
  "IMPORTED_ACTIVATION_DATABASE_NOT_CONFIGURED",
  "IMPORTED_ACTIVATION_DATABASE_BRANCH_MISMATCH"
]);

export function safeImportedActivationError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  return safeErrors.has(code) ? code : "IMPORTED_ACTIVATION_UNAVAILABLE";
}

export async function prepareImportedHouseholdActivation(
  input: unknown,
  actor: string,
  dependencies: ImportedHouseholdActivationWorkflowDependencies
) {
  const request = z.object({ externalHouseholdId: z.uuid() }).strict().safeParse(input);
  if (!request.success || !actor.trim() || actor.length > 255)
    throw new Error("INVALID_IMPORTED_ACTIVATION_PREPARATION");

  const source = dependencies.sourceId();
  const [sheets, database] = await Promise.all([dependencies.readSheets(), dependencies.snapshot()]);
  const parsed = parseHouseholdSheets(sheets.guestList, sheets.households);
  const preview = previewImportedHouseholdActivation(parsed, database.data, source);
  const matches = preview.households.filter((row) => row.externalHouseholdId === request.data.externalHouseholdId);
  if (matches.length !== 1 || !matches[0].eligible || preview.blockers.length > 0)
    throw new Error("IMPORTED_ACTIVATION_NOT_READY");

  const selected = matches[0];
  if (!selected.householdId) throw new Error("IMPORTED_ACTIVATION_NOT_READY");
  const token = (dependencies.createToken ?? createImportedActivationToken)();
  const receipt = signImportedActivationReceipt({
    actor,
    source,
    externalHouseholdId: selected.externalHouseholdId,
    householdId: selected.householdId,
    tokenHash: hashRsvpToken(token),
    sourceCommitment: commitImportedActivationSource(sheets),
    expires: (dependencies.now?.() ?? Date.now()) + 30 * 60_000
  });

  return {
    receipt,
    token,
    household: {
      externalHouseholdId: selected.externalHouseholdId,
      householdId: selected.householdId,
      label: selected.label,
      memberCount: selected.sourceMemberCount,
      namedInviteeCount: selected.namedInviteeCount
    }
  };
}

export async function confirmImportedHouseholdActivation(
  input: unknown,
  actor: string,
  dependencies: ImportedHouseholdActivationWorkflowDependencies
) {
  const request = z.object({ receipt: z.string().min(1).max(4096), confirmed: z.literal(true) }).strict().safeParse(input);
  if (!request.success) throw new Error("INVALID_IMPORTED_ACTIVATION_CONFIRMATION");
  const receipt = verifyImportedActivationReceipt(request.data.receipt, actor);

  // Recover a committed database transaction before expiry/freshness checks. The
  // journal compares the exact event, actor, mapping and hash without exposing it.
  if (await dependencies.committed(receipt)) return { status: "active" as const, replayed: true };
  if (receipt.expires < (dependencies.now?.() ?? Date.now()) || receipt.source !== dependencies.sourceId())
    throw new Error("IMPORTED_ACTIVATION_PREVIEW_EXPIRED");

  const sheets = await dependencies.readSheets();
  if (commitImportedActivationSource(sheets) !== receipt.sourceCommitment)
    throw new Error("IMPORTED_ACTIVATION_PREVIEW_CHANGED");

  // SQL revalidates the mapping, roster, state and RSVP activity atomically.
  return dependencies.activate(receipt);
}
