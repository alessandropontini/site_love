import { z } from "zod";
import type { GuestSheets, Snapshot } from "../guest-sync/model";
import { parseHouseholdSheets } from "../guest-sync/model";
import { buildSaveTheDateDraft, type SaveTheDateChannel } from "./message";
import { commitSaveTheDateValue, signSaveTheDateReceipt, verifySaveTheDateReceipt } from "./receipt";
import { planSaveTheDate } from "./planner";

export const saveTheDateStatuses = ["NOT_SENT", "READY", "SENT", "FAILED"] as const;
export type SaveTheDateStatus = (typeof saveTheDateStatuses)[number];
export type SaveTheDateState = { status: SaveTheDateStatus; version: number };
export type SaveTheDateRecordRequest = Omit<
  ReturnType<typeof verifySaveTheDateReceipt>,
  "purpose" | "expires"
> & { status: SaveTheDateStatus };
export type SaveTheDateRecordResult = {
  status: SaveTheDateStatus;
  version: number;
  replayed: boolean;
};

export type SaveTheDateWorkflowDependencies = {
  sourceId(): string;
  readSheets(): Promise<GuestSheets>;
  snapshot(): Promise<{ data: Snapshot; hash: string }>;
  state(source: string, externalHouseholdId: string): Promise<SaveTheDateState | null>;
  recorded(request: SaveTheDateRecordRequest): Promise<SaveTheDateRecordResult | null>;
  record(request: SaveTheDateRecordRequest): Promise<SaveTheDateRecordResult>;
  now?(): number;
};

function allowedTransitions(status: SaveTheDateStatus): SaveTheDateStatus[] {
  if (status === "SENT") return ["NOT_SENT"];
  return saveTheDateStatuses.filter((next) => next !== status);
}

async function loadContext(
  externalHouseholdId: string,
  channel: SaveTheDateChannel,
  dependencies: SaveTheDateWorkflowDependencies
) {
  const source = dependencies.sourceId();
  const [sheets, database, state] = await Promise.all([
    dependencies.readSheets(),
    dependencies.snapshot(),
    dependencies.state(source, externalHouseholdId)
  ]);
  const parsed = parseHouseholdSheets(sheets.guestList, sheets.households);
  const plan = planSaveTheDate(parsed, database.data, source);
  const matches = plan.households.filter((household) =>
    household.externalHouseholdId === externalHouseholdId
  );
  if (matches.length !== 1) throw new Error("STD_NOT_READY");
  const target = matches[0];
  const householdId = target.householdId;
  const contactGuestId = target.contactGuestId;
  const language = target.language;
  if (!target.eligibleForPreparation || !householdId || !contactGuestId || !language)
    throw new Error("STD_NOT_READY");
  const current = state ?? { status: "NOT_SENT" as const, version: 0 };
  const draft = buildSaveTheDateDraft(language, channel);
  const commitments = {
    source: commitSaveTheDateValue("source-v1", sheets),
    database: commitSaveTheDateValue("database-v1", database.data),
    draft: commitSaveTheDateValue("draft-v1", {
      text: draft.text,
      channel: draft.channel,
      language: draft.language,
      template: draft.templateVersion
    })
  };
  return { source, database, target, current, draft, commitments };
}

export async function prepareSaveTheDate(
  input: unknown,
  actor: string,
  dependencies: SaveTheDateWorkflowDependencies
) {
  const request = z.object({
    externalHouseholdId: z.uuid(),
    channel: z.enum(["sms", "imessage", "whatsapp", "email", "telegram", "instagram", "paper"])
  }).strict().safeParse(input);
  if (!request.success || !actor.trim() || actor.length > 255)
    throw new Error("INVALID_STD_PREPARATION");

  const context = await loadContext(request.data.externalHouseholdId, request.data.channel, dependencies);
  const receipt = signSaveTheDateReceipt({
    purpose: "save-the-date-v1",
    actor,
    source: context.source,
    externalHouseholdId: context.target.externalHouseholdId,
    householdId: context.target.householdId!,
    contactGuestId: context.target.contactGuestId!,
    language: context.draft.language,
    channel: context.draft.channel,
    expectedVersion: context.current.version,
    sourceCommitment: context.commitments.source,
    databaseCommitment: context.commitments.database,
    draftCommitment: context.commitments.draft,
    template: context.draft.templateVersion,
    expires: (dependencies.now?.() ?? Date.now()) + 30 * 60_000
  });
  return {
    receipt,
    household: {
      externalHouseholdId: context.target.externalHouseholdId,
      householdId: context.target.householdId,
      memberCount: context.target.memberCount
    },
    draft: context.draft,
    state: context.current,
    allowedStatuses: allowedTransitions(context.current.status)
  };
}

export async function recordSaveTheDate(
  input: unknown,
  actor: string,
  dependencies: SaveTheDateWorkflowDependencies
): Promise<SaveTheDateRecordResult> {
  const request = z.object({
    receipt: z.string().min(1).max(4096),
    status: z.enum(saveTheDateStatuses)
  }).strict().safeParse(input);
  if (!request.success) throw new Error("INVALID_STD_RECORD");

  const receipt = verifySaveTheDateReceipt(request.data.receipt, actor);
  const { purpose, expires, ...metadata } = receipt;
  void purpose;
  const recordRequest: SaveTheDateRecordRequest = {
    ...metadata,
    status: request.data.status
  };

  // Recover a committed result before expiry or source checks after a timeout.
  const completed = await dependencies.recorded(recordRequest);
  if (completed) return { ...completed, replayed: true };
  if (expires < (dependencies.now?.() ?? Date.now()) || receipt.source !== dependencies.sourceId())
    throw new Error("STD_PREVIEW_EXPIRED");

  const context = await loadContext(
    receipt.externalHouseholdId,
    receipt.channel,
    dependencies
  );
  if (context.current.version !== receipt.expectedVersion ||
    context.target.householdId !== receipt.householdId ||
    context.target.contactGuestId !== receipt.contactGuestId ||
    context.draft.language !== receipt.language ||
    context.draft.templateVersion !== receipt.template ||
    context.commitments.source !== receipt.sourceCommitment ||
    context.commitments.database !== receipt.databaseCommitment ||
    context.commitments.draft !== receipt.draftCommitment ||
    !allowedTransitions(context.current.status).includes(request.data.status))
    throw new Error("STD_PREVIEW_CHANGED");

  // The requested state is an administrator's manual declaration, never a send.
  return dependencies.record(recordRequest);
}
