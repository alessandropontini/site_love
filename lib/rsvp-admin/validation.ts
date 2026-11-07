import { z } from "zod";

import { rsvpSubmissionSchema } from "../rsvp/validation";

export const manualResponseInputSchema = z.object({
  id: z.uuid(),
  household: z.uuid(),
  provenance: z.enum(["phone", "message", "paper", "in_person"]),
  recordingReason: z.enum(["initial_offsite_response", "correction"]),
  emailProvidedByRespondent: z.literal(true),
  confirmed: z.literal(true),
  submission: rsvpSubmissionSchema
}).strict();

export const manualHouseholdIdSchema = z.uuid();

export type ManualResponseInput = z.infer<typeof manualResponseInputSchema>;
