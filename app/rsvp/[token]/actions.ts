"use server";

import { refresh } from "next/cache";

import {
  getRsvpInvitation,
  saveRsvpAnswers
} from "@/lib/rsvp/db";
import { sendRsvpConfirmationEmail } from "@/lib/rsvp/email";
import { RSVP_PRIVACY_NOTICE_VERSION } from "@/lib/rsvp/privacy";
import type { RsvpLocale } from "@/lib/rsvp/types";
import { verifyRsvpTurnstile } from "@/lib/rsvp/turnstile";
import { rsvpSubmissionSchema } from "@/lib/rsvp/validation";

export type RsvpActionState = {
  status: "idle" | "success" | "error";
  message: string;
  revision: number;
  attempt: number;
};

const actionCopy = {
  it: {
    invalid: "Il link non è valido o non è più attivo.",
    validation: "Controlla le risposte indicate e riprova.",
    protection: "Verifica di sicurezza non riuscita. Riprova.",
    conflict:
      "La risposta è stata modificata da un’altra pagina. Ricarica prima di riprovare.",
    rateLimited: "Troppi aggiornamenti ravvicinati. Attendi un’ora e riprova.",
    unchanged: "Non hai modificato nessuna risposta già salvata.",
    unavailable: "Il servizio RSVP non è disponibile in questo momento.",
    saved: "Presenza salvata e conferma inviata via email. Grazie!",
    savedEmailPending:
      "Presenza salvata. L’email automatica non è ancora attiva nella versione di prova.",
    savedEmailFailed:
      "Presenza salvata, ma non siamo riusciti a inviare l’email di conferma. Non serve reinviare il modulo."
  },
  en: {
    invalid: "This link is invalid or no longer active.",
    validation: "Check the selected answers and try again.",
    protection: "Security verification failed. Please try again.",
    conflict:
      "This RSVP was changed in another page. Refresh before trying again.",
    rateLimited: "Too many updates. Wait one hour and try again.",
    unchanged: "You have not changed any saved response.",
    unavailable: "The RSVP service is temporarily unavailable.",
    saved: "Attendance saved and confirmation email sent. Thank you!",
    savedEmailPending:
      "Attendance saved. Automatic email is not active yet in this trial version.",
    savedEmailFailed:
      "Attendance was saved, but we could not send the confirmation email. You do not need to submit the form again."
  }
} as const;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readLocale(formData: FormData): RsvpLocale {
  return readString(formData, "locale") === "en" ? "en" : "it";
}

function hasUnexpectedAnswerFields(
  formData: FormData,
  inviteeIds: string[]
) {
  const allowedAnswerKeys = new Set(
    inviteeIds.flatMap((inviteeId) => [
      `attendance:${inviteeId}`,
    ])
  );

  for (const key of formData.keys()) {
    if (
      key.startsWith("attendance:") &&
      !allowedAnswerKeys.has(key)
    ) {
      return true;
    }
  }

  return inviteeIds.some((inviteeId) => {
    const attendanceCount = formData.getAll(
      `attendance:${inviteeId}`
    ).length;
    return attendanceCount !== 1;
  });
}

export async function submitRsvp(
  token: string,
  previousState: RsvpActionState,
  formData: FormData
): Promise<RsvpActionState> {
  const locale = readLocale(formData);
  const copy = actionCopy[locale];
  const lookup = await getRsvpInvitation(token);

  if (lookup.status === "invalid") {
    return {
      ...previousState,
      status: "error",
      message: copy.invalid,
      attempt: previousState.attempt + 1
    };
  }

  if (lookup.status !== "ready") {
    return {
      ...previousState,
      status: "error",
      message: copy.unavailable,
      attempt: previousState.attempt + 1
    };
  }

  if (
    hasUnexpectedAnswerFields(
      formData,
      lookup.invitation.invitees.map((invitee) => invitee.id)
    )
  ) {
    return {
      ...previousState,
      status: "error",
      message: copy.validation,
      attempt: previousState.attempt + 1
    };
  }

  const answers = lookup.invitation.invitees.map((invitee) => {
    const attendance = readString(
      formData,
      `attendance:${invitee.id}`
    );
    const isAttending = attendance === "yes";

    return {
      inviteeId: invitee.id,
      attendance,
      mealPreference: isAttending ? null : "not_needed"
    };
  });

  const contactEmail = readString(formData, "contactEmail")
    .trim()
    .toLowerCase();
  const confirmedEmail = readString(formData, "contactEmailConfirm")
    .trim()
    .toLowerCase();
  const plusOneRequested = readString(formData, "plusOneEnabled") === "yes";

  if (plusOneRequested && !lookup.invitation.allowPlusOne) {
    return {
      ...previousState,
      status: "error",
      message: copy.validation,
      attempt: previousState.attempt + 1
    };
  }

  const plusOneEnabled =
    lookup.invitation.allowPlusOne && plusOneRequested;
  const plusOne = plusOneEnabled
    ? {
        id: readString(formData, "plusOneId") || null,
        firstName: readString(formData, "plusOneFirstName"),
        lastName: readString(formData, "plusOneLastName"),
        mealPreference: null
      }
    : null;
  const hasChildren = readString(formData, "hasChildren") === "yes";

  if (
    contactEmail !== confirmedEmail ||
    readString(formData, "privacyAcknowledgement") !== "yes"
  ) {
    return {
      ...previousState,
      status: "error",
      message: copy.validation,
      attempt: previousState.attempt + 1
    };
  }

  const submission = rsvpSubmissionSchema.safeParse({
    revision: readString(formData, "revision"),
    locale,
    contactEmail,
    answers,
    plusOne,
    hasChildren,
    privacyNoticeVersion: RSVP_PRIVACY_NOTICE_VERSION
  });

  if (!submission.success) {
    return {
      ...previousState,
      status: "error",
      message: copy.validation,
      attempt: previousState.attempt + 1
    };
  }

  const protectedSubmission = await verifyRsvpTurnstile(
    formData.get("cf-turnstile-response")
  );

  if (!protectedSubmission) {
    return {
      ...previousState,
      status: "error",
      message: copy.protection,
      attempt: previousState.attempt + 1
    };
  }

  const result = await saveRsvpAnswers(
    lookup.invitation,
    submission.data.revision,
    submission.data
  );

  if (result.status === "saved") {
    const emailResult = await sendRsvpConfirmationEmail({
      to: submission.data.contactEmail,
      householdId: lookup.invitation.id,
      revision: result.revision,
      locale
    });
    refresh();

    return {
      status: "success",
      message:
        emailResult === "sent"
          ? copy.saved
          : emailResult === "failed"
            ? copy.savedEmailFailed
            : copy.savedEmailPending,
      revision: result.revision,
      attempt: previousState.attempt + 1
    };
  }

  const message =
    result.status === "conflict"
      ? copy.conflict
      : result.status === "unchanged"
        ? copy.unchanged
        : result.status === "rate_limited"
          ? copy.rateLimited
          : copy.unavailable;

  return {
    ...previousState,
    status: "error",
    message,
    attempt: previousState.attempt + 1
  };
}
