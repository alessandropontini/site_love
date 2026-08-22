import { z } from "zod";

export const rsvpSubmissionSchema = z
  .object({
    revision: z.coerce.number().int().min(0),
    locale: z.enum(["it", "en"]),
    answers: z
      .array(
        z.object({
          inviteeId: z.string().uuid(),
          attendance: z.enum(["yes", "no"]),
          mealPreference: z.enum([
            "standard",
            "vegetarian",
            "vegan",
            "children",
            "not_needed"
          ])
        })
      )
      .min(1)
      .max(25)
  })
  .superRefine((submission, context) => {
    const inviteeIds = new Set<string>();

    for (const answer of submission.answers) {
      if (inviteeIds.has(answer.inviteeId)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate invitee response"
        });
      }
      inviteeIds.add(answer.inviteeId);

      if (
        answer.attendance === "no" &&
        answer.mealPreference !== "not_needed"
      ) {
        context.addIssue({
          code: "custom",
          message: "Non-attending invitees cannot submit meal preferences"
        });
      }

      if (
        answer.attendance === "yes" &&
        answer.mealPreference === "not_needed"
      ) {
        context.addIssue({
          code: "custom",
          message: "Attending invitees must choose a meal preference"
        });
      }
    }
  });
