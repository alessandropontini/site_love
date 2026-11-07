import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { saveTheDateChannels } from "./message";

const receiptSchema = z.object({
  purpose: z.literal("save-the-date-v1"),
  id: z.uuid(),
  actor: z.string().min(1).max(255),
  source: z.string().min(1).max(150),
  externalHouseholdId: z.uuid(),
  householdId: z.uuid(),
  contactGuestId: z.uuid(),
  language: z.enum(["it", "en"]),
  channel: z.enum(saveTheDateChannels),
  expectedVersion: z.number().int().min(0).max(999999999),
  sourceCommitment: z.string().regex(/^[0-9a-f]{64}$/),
  databaseCommitment: z.string().regex(/^[0-9a-f]{64}$/),
  draftCommitment: z.string().regex(/^[0-9a-f]{64}$/),
  template: z.literal("std-draft-v1"),
  expires: z.number().int()
}).strict();

export type SaveTheDateReceipt = z.infer<typeof receiptSchema>;

function secret() {
  const value = process.env.GUEST_SYNC_SIGNING_SECRET;
  if (!value || value.length < 32) throw new Error("STD_SIGNING_NOT_CONFIGURED");
  return value;
}

export function commitSaveTheDateValue(purpose: string, value: unknown) {
  return createHmac("sha256", secret())
    .update(`save-the-date:${purpose}:`)
    .update(JSON.stringify(value))
    .digest("hex");
}

export function signSaveTheDateReceipt(value: Omit<SaveTheDateReceipt, "id">) {
  const receipt = receiptSchema.parse({ ...value, id: randomUUID() });
  const body = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  const signature = createHmac("sha256", secret())
    .update(`save-the-date-receipt-v1:${body}`)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifySaveTheDateReceipt(token: string, actor: string) {
  if (token.length > 4096) throw new Error("INVALID_STD_RECEIPT");
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("INVALID_STD_RECEIPT");
  const actual = Buffer.from(parts[1], "base64url");
  const expected = createHmac("sha256", secret())
    .update(`save-the-date-receipt-v1:${parts[0]}`)
    .digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("INVALID_STD_RECEIPT");
  const receipt = receiptSchema.parse(JSON.parse(Buffer.from(parts[0], "base64url").toString()));
  if (receipt.actor !== actor) throw new Error("INVALID_STD_RECEIPT");
  return receipt;
}
