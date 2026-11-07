import type { RsvpInvitation, RsvpSubmission } from "../rsvp/types";
import { RSVP_PRIVACY_NOTICE_VERSION } from "../rsvp/privacy";
import { manualResponseInputSchema, type ManualResponseInput } from "./validation";

type Provenance = ManualResponseInput["provenance"];
type RecordingReason = ManualResponseInput["recordingReason"];
type MealPreference = NonNullable<RsvpSubmission["answers"][number]["mealPreference"]>;

export type ManualResponseDraft = {
  contactEmail: string;
  provenance: Provenance | "";
  recordingReason: RecordingReason | "";
  emailProvidedByRespondent: boolean;
  confirmed: boolean;
  answers: {
    inviteeId: string;
    attendance: "yes" | "no" | "";
    mealPreference: MealPreference | "";
  }[];
  includePlusOne: boolean;
  plusOne: {
    id: string | null;
    firstName: string;
    lastName: string;
    mealPreference: Exclude<MealPreference, "not_needed"> | "";
  };
  hasChildren: boolean;
};

export function expectedRecordingReason(invitation: RsvpInvitation): RecordingReason | null {
  const hasResponse = invitation.invitees.some((invitee) => invitee.attendance !== null);
  if (invitation.revision === 0 && !hasResponse) return "initial_offsite_response";
  if (invitation.revision > 0 && hasResponse) return "correction";
  return null;
}

export function createManualResponseDraft(invitation: RsvpInvitation): ManualResponseDraft {
  const existingPlusOne = invitation.plusOne;
  return {
    contactEmail: "",
    provenance: "",
    recordingReason: "",
    emailProvidedByRespondent: false,
    confirmed: false,
    answers: invitation.invitees.map((invitee) => ({
      inviteeId: invitee.id,
      attendance: invitee.attendance ?? "",
      mealPreference: invitee.attendance === "no"
        ? "not_needed"
        : invitee.mealPreference === "not_needed"
          ? ""
          : invitee.mealPreference ?? ""
    })),
    includePlusOne: existingPlusOne !== null,
    plusOne: {
      id: existingPlusOne?.id ?? null,
      firstName: existingPlusOne?.firstName ?? "",
      lastName: existingPlusOne?.lastName ?? "",
      mealPreference: existingPlusOne?.mealPreference ?? ""
    },
    hasChildren: invitation.hasChildren
  };
}

export function buildManualResponseInput(
  invitation: RsvpInvitation,
  draft: ManualResponseDraft,
  operationId: string
): ManualResponseInput | null {
  const expectedReason = expectedRecordingReason(invitation);
  if (!expectedReason || draft.recordingReason !== expectedReason) return null;
  const expectedInviteeIds = invitation.invitees.map((invitee) => invitee.id).sort();
  const submittedInviteeIds = draft.answers.map((answer) => answer.inviteeId).sort();
  if (
    expectedInviteeIds.length !== submittedInviteeIds.length ||
    expectedInviteeIds.some((id, index) => id !== submittedInviteeIds[index])
  ) return null;
  if (draft.includePlusOne && draft.plusOne.id !== (invitation.plusOne?.id ?? null)) return null;

  const input = {
    id: operationId,
    household: invitation.id,
    provenance: draft.provenance,
    recordingReason: draft.recordingReason,
    emailProvidedByRespondent: draft.emailProvidedByRespondent,
    confirmed: draft.confirmed,
    submission: {
      revision: invitation.revision,
      locale: invitation.locale,
      contactEmail: draft.contactEmail,
      answers: draft.answers.map((answer) => ({
        inviteeId: answer.inviteeId,
        attendance: answer.attendance,
        mealPreference: answer.mealPreference === "" ? null : answer.mealPreference
      })),
      plusOne: draft.includePlusOne ? {
        id: draft.plusOne.id,
        firstName: draft.plusOne.firstName,
        lastName: draft.plusOne.lastName,
        mealPreference: draft.plusOne.mealPreference === "" ? null : draft.plusOne.mealPreference
      } : null,
      hasChildren: draft.hasChildren,
      privacyNoticeVersion: RSVP_PRIVACY_NOTICE_VERSION
    }
  };
  const parsed = manualResponseInputSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
