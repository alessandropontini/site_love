"use server";

import { refresh } from "next/cache";

import {
  getRsvpInvitation,
  saveRsvpAnswers
} from "@/lib/rsvp/db";
import type { MealPreference, RsvpLocale } from "@/lib/rsvp/types";
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
    saved: "Risposta salvata. Grazie!"
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
    saved: "Your response has been saved. Thank you!"
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
      `meal:${inviteeId}`
    ])
  );

  for (const key of formData.keys()) {
    if (
      (key.startsWith("attendance:") || key.startsWith("meal:")) &&
      !allowedAnswerKeys.has(key)
    ) {
      return true;
    }
  }

  return inviteeIds.some((inviteeId) => {
    const attendanceCount = formData.getAll(
      `attendance:${inviteeId}`
    ).length;
    const mealCount = formData.getAll(`meal:${inviteeId}`).length;

    return attendanceCount !== 1 || mealCount > 1;
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
      mealPreference: isAttending
        ? (readString(
            formData,
            `meal:${invitee.id}`
          ) as MealPreference)
        : "not_needed"
    };
  });

  const submission = rsvpSubmissionSchema.safeParse({
    revision: readString(formData, "revision"),
    locale,
    answers
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
    submission.data.answers
  );

  if (result.status === "saved") {
    refresh();

    return {
      status: "success",
      message: copy.saved,
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
