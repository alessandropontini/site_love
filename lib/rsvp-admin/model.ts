import { createHmac } from "node:crypto";
import { manualResponseInputSchema, type ManualResponseInput } from "./validation";

export { manualHouseholdIdSchema, manualResponseInputSchema } from "./validation";
export type { ManualResponseInput } from "./validation";
export type ManualResponseRequest = {
  id: string;
  household: string;
  actor: string;
  provenance: ManualResponseInput["provenance"];
  recordingReason: ManualResponseInput["recordingReason"];
  requestHash: string;
  submission: ManualResponseInput["submission"] & { confirmed: true };
};

export function createManualResponseRequest(input: unknown, actor: string): ManualResponseRequest {
  const parsed = manualResponseInputSchema.parse(input);
  if (!actor.trim() || actor.length > 255) throw new Error("MANUAL_INVALID_ACTOR");

  const request = {
    id: parsed.id,
    household: parsed.household,
    actor,
    provenance: parsed.provenance,
    recordingReason: parsed.recordingReason,
    submission: { ...parsed.submission, confirmed: true as const }
  };
  const signedBody = {
    ...request,
    emailProvidedByRespondent: parsed.emailProvidedByRespondent
  };
  const secret = process.env.GUEST_SYNC_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new Error("MANUAL_SIGNING_NOT_CONFIGURED");

  return {
    ...request,
    requestHash: createHmac("sha256", secret)
      .update("manual-rsvp-v1:")
      .update(JSON.stringify(signedBody))
      .digest("hex")
  };
}
