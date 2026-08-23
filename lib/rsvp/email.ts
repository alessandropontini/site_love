import "server-only";

import type { RsvpLocale } from "@/lib/rsvp/types";

export type ConfirmationEmailResult = "sent" | "not_configured" | "failed";

const confirmationCopy = {
  it: {
    subject: "Conferma RSVP — Alessandro & Bridget",
    body: [
      "Abbiamo registrato la tua risposta per il matrimonio di Alessandro e Bridget.",
      "",
      "La scelta del menu verrà richiesta più avanti. Potrai aggiornare la presenza usando lo stesso link personale ricevuto con l’invito.",
      "",
      "I dati RSVP, gli inviti operativi e i backup saranno cancellati entro l’11 agosto 2028, cioè 90 giorni dopo il matrimonio.",
      "",
      "Questa è una comunicazione organizzativa, non pubblicitaria."
    ].join("\n")
  },
  en: {
    subject: "RSVP confirmation — Alessandro & Bridget",
    body: [
      "We have recorded your response for Alessandro and Bridget’s wedding.",
      "",
      "Menu choices will be requested later. You can update attendance using the same personal link received with your invitation.",
      "",
      "RSVP data, operational invitations, and backups will be deleted by 11 August 2028, 90 days after the wedding.",
      "",
      "This is a practical wedding message, not advertising."
    ].join("\n")
  }
} as const;

export async function sendRsvpConfirmationEmail({
  to,
  householdId,
  revision,
  locale
}: {
  to: string;
  householdId: string;
  revision: number;
  locale: RsvpLocale;
}): Promise<ConfirmationEmailResult> {
  const enabled = process.env.RSVP_EMAIL_ENABLED === "1";
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RSVP_EMAIL_FROM;
  const replyTo = process.env.RSVP_EMAIL_REPLY_TO;

  if (!enabled || !apiKey || !from) {
    return "not_configured";
  }

  const copy = confirmationCopy[locale];
  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject: copy.subject,
    text: copy.body
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `rsvp-confirmation/${householdId}/${revision}`
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(6000)
    });

    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
