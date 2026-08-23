import { z } from "zod";

import { RSVP_PRIVACY_NOTICE_VERSION } from "@/lib/rsvp/privacy";

export const rsvpSubmissionSchema = z
  .object({
    revision: z.coerce.number().int().min(0),
    locale: z.enum(["it", "en"]),
    contactEmail: z.string().trim().email().max(254),
    answers: z
      .array(
        z.object({
          inviteeId: z.string().uuid(),
          attendance: z.enum(["yes", "no"]),
          mealPreference: z
            .enum([
              "standard",
              "vegetarian",
              "vegan",
              "children",
              "not_needed"
            ])
            .nullable()
        })
      )
      .min(1)
      .max(25),
    plusOne: z
      .object({
        id: z.string().uuid().nullable(),
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().min(1).max(80),
        mealPreference: z
          .enum(["standard", "vegetarian", "vegan", "children"])
          .nullable()
      })
      .nullable(),
    hasChildren: z.boolean(),
    privacyNoticeVersion: z.literal(RSVP_PRIVACY_NOTICE_VERSION)
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

      if (answer.attendance === "yes" && answer.mealPreference === "not_needed") {
        context.addIssue({
          code: "custom",
          message: "Attending invitees cannot use the not-needed meal value"
        });
      }
    }

    const anyoneAttending = submission.answers.some(
      (answer) => answer.attendance === "yes"
    );

    if (!anyoneAttending && (submission.plusOne || submission.hasChildren)) {
      context.addIssue({
        code: "custom",
        message: "Additional guests require at least one attending named invitee"
      });
    }

  });
