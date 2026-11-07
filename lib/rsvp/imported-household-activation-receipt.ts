import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const receiptSchema = z.object({
  purpose: z.literal("imported-household-activation-v1"),
  id: z.uuid(),
  actor: z.string().min(1).max(255),
  source: z.string().min(1).max(150),
  externalHouseholdId: z.uuid(),
  householdId: z.uuid(),
  tokenHash: z.string().regex(/^[0-9a-f]{64}$/),
  sourceCommitment: z.string().regex(/^[0-9a-f]{64}$/),
  expires: z.number().int()
}).strict();

export type ImportedHouseholdActivationReceipt = z.infer<typeof receiptSchema>;

function secret() {
  const value = process.env.GUEST_SYNC_SIGNING_SECRET;
  if (!value || value.length < 32) throw new Error("IMPORTED_ACTIVATION_SIGNING_NOT_CONFIGURED");
  return value;
}

export function commitImportedActivationSource(value: unknown) {
  return createHmac("sha256", secret())
    .update("imported-household-source-v1:")
    .update(JSON.stringify(value))
    .digest("hex");
}

export function createImportedActivationToken() {
  return randomBytes(32).toString("base64url");
}

export function signImportedActivationReceipt(
  value: Omit<ImportedHouseholdActivationReceipt, "id" | "purpose">
) {
  const receipt = receiptSchema.parse({
    ...value,
    id: randomUUID(),
    purpose: "imported-household-activation-v1"
  });
  const body = Buffer.from(JSON.stringify(receipt)).toString("base64url");
  const signature = createHmac("sha256", secret())
    .update(`imported-household-activation-receipt-v1:${body}`)
    .digest("base64url");
  return `${body}.${signature}`;
}

export function verifyImportedActivationReceipt(value: string, actor: string) {
  if (value.length > 4096) throw new Error("INVALID_IMPORTED_ACTIVATION_RECEIPT");
  const [body, signature, extra] = value.split(".");
  if (!body || !signature || extra !== undefined) throw new Error("INVALID_IMPORTED_ACTIVATION_RECEIPT");
  const actual = Buffer.from(signature, "base64url");
  const expected = createHmac("sha256", secret())
    .update(`imported-household-activation-receipt-v1:${body}`)
    .digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("INVALID_IMPORTED_ACTIVATION_RECEIPT");
  const receipt = receiptSchema.parse(JSON.parse(Buffer.from(body, "base64url").toString()));
  if (receipt.actor !== actor) throw new Error("INVALID_IMPORTED_ACTIVATION_RECEIPT");
  return receipt;
}
