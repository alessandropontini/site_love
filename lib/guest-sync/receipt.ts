import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
const receiptSchema = z
  .object({
    id: z.uuid(),
    actor: z.string().min(1).max(255),
    source: z.string().max(150),
    sourceHash: z.string().length(64),
    dbHash: z.string().length(32),
    planHash: z.string().length(64),
    expires: z.number().int()
  })
  .strict();
export type Receipt = z.infer<typeof receiptSchema>;
function secret() {
  const value = process.env.GUEST_SYNC_SIGNING_SECRET;
  if (!value || value.length < 32)
    throw new Error("SYNC_SIGNING_SECRET_MISSING");
  return value;
}
export function signReceipt(value: Receipt) {
  const body = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function verifyReceipt(token: string, actor: string): Receipt {
  if (token.length > 4096) throw new Error("INVALID_RECEIPT");
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("INVALID_RECEIPT");
  const signature = Buffer.from(parts[1], "base64url");
  const expected = createHmac("sha256", secret()).update(parts[0]).digest();
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(signature, expected)
  )
    throw new Error("INVALID_RECEIPT");
  const value = receiptSchema.parse(
    JSON.parse(Buffer.from(parts[0], "base64url").toString())
  );
  if (value.actor !== actor) throw new Error("INVALID_RECEIPT");
  return value;
}
