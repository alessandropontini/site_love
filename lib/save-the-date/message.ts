import { getEditorialContent, type EditorialLocale } from "../editorialConfig";

export const saveTheDateChannels = [
  "sms",
  "imessage",
  "whatsapp",
  "email",
  "telegram",
  "instagram",
  "paper"
] as const;

export type SaveTheDateChannel = (typeof saveTheDateChannels)[number];

export const saveTheDateTemplateVersion = "std-draft-v1";

export type SaveTheDateDraft = {
  channel: SaveTheDateChannel;
  language: EditorialLocale;
  templateVersion: typeof saveTheDateTemplateVersion;
  text: string;
};

/** Builds reviewable copy only; it has no recipient, transport, or send action. */
export function buildSaveTheDateDraft(
  language: EditorialLocale,
  channel: SaveTheDateChannel
): SaveTheDateDraft {
  const content = getEditorialContent(language).footer;
  const text = language === "it"
    ? `Save the Date\n\nCi sposiamo! Tieni libera questa data: ${content.date}.\n${content.place}.\n\nL'invito con tutti i dettagli arriverà più avanti. Per ora non serve confermare la presenza.\n\n${content.names}`
    : `Save the Date\n\nWe're getting married! Please save the date: ${content.date}.\n${content.place}.\n\nYour invitation with all the details will follow. No RSVP is needed yet.\n\n${content.names}`;

  return { channel, language, templateVersion: saveTheDateTemplateVersion, text };
}
