"use client";

import Script from "next/script";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef } from "react";

import type { RsvpInvitation, RsvpLocale } from "@/lib/rsvp/types";

import { submitRsvp, type RsvpActionState } from "./actions";
import styles from "../rsvp.module.css";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      "response-field-name": string;
    }
  ) => string;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const formCopy = {
  it: {
    attendance: "Parteciperai?",
    yes: "Sì, ci sarò",
    no: "No, non potrò esserci",
    meal: "Preferenza per il menu",
    standard: "Menu standard",
    vegetarian: "Vegetariano",
    vegan: "Vegano",
    children: "Menu bambini",
    notNeeded: "Non necessario",
    specialNeeds:
      "Per allergie o necessità di accessibilità, contattaci direttamente attraverso il canale con cui hai ricevuto l’invito.",
    privacy: "Come usiamo i dati RSVP",
    submit: "Salva la risposta",
    submitting: "Salvataggio…"
  },
  en: {
    attendance: "Will you attend?",
    yes: "Yes, I’ll be there",
    no: "No, I won’t be able to attend",
    meal: "Meal preference",
    standard: "Standard menu",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    children: "Children’s menu",
    notNeeded: "Not needed",
    specialNeeds:
      "For allergies or accessibility requirements, contact us directly through the channel used for your invitation.",
    privacy: "How we use RSVP data",
    submit: "Save response",
    submitting: "Saving…"
  }
} as const;

type RsvpFormProps = {
  token: string;
  invitation: RsvpInvitation;
  locale: RsvpLocale;
  turnstileSiteKey: string;
};

export function RsvpForm({
  token,
  invitation,
  locale,
  turnstileSiteKey
}: RsvpFormProps) {
  const copy = formCopy[locale];
  const initialState: RsvpActionState = {
    status: "idle",
    message: "",
    revision: invitation.revision,
    attempt: 0
  };
  const submitWithToken = submitRsvp.bind(null, token);
  const [state, formAction, pending] = useActionState(
    submitWithToken,
    initialState
  );
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  const renderTurnstile = useCallback(() => {
    if (
      !turnstileSiteKey ||
      !turnstileContainer.current ||
      !window.turnstile ||
      turnstileWidgetId.current
    ) {
      return;
    }

    turnstileWidgetId.current = window.turnstile.render(
      turnstileContainer.current,
      {
        sitekey: turnstileSiteKey,
        action: "rsvp_submit",
        "response-field-name": "cf-turnstile-response"
      }
    );
  }, [turnstileSiteKey]);

  useEffect(() => {
    if (state.attempt > 0 && turnstileWidgetId.current) {
      window.turnstile?.reset(turnstileWidgetId.current);
    }
  }, [state.attempt]);

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="revision" value={state.revision} />

      <div className={styles.inviteeList}>
        {invitation.invitees.map((invitee) => (
          <fieldset className={styles.inviteeCard} key={invitee.id}>
            <legend>{invitee.displayName}</legend>

            <div className={styles.fieldGroup}>
              <p className={styles.fieldLabel}>{copy.attendance}</p>
              <label className={styles.choice}>
                <input
                  defaultChecked={invitee.attendance === "yes"}
                  name={`attendance:${invitee.id}`}
                  required
                  type="radio"
                  value="yes"
                />
                <span>{copy.yes}</span>
              </label>
              <label className={styles.choice}>
                <input
                  defaultChecked={invitee.attendance === "no"}
                  name={`attendance:${invitee.id}`}
                  required
                  type="radio"
                  value="no"
                />
                <span>{copy.no}</span>
              </label>
            </div>

            <label className={styles.stackedField}>
              <span>{copy.meal}</span>
              <select
                defaultValue={invitee.mealPreference ?? "standard"}
                name={`meal:${invitee.id}`}
              >
                <option value="standard">{copy.standard}</option>
                <option value="vegetarian">{copy.vegetarian}</option>
                <option value="vegan">{copy.vegan}</option>
                <option value="children">{copy.children}</option>
                <option value="not_needed">{copy.notNeeded}</option>
              </select>
            </label>

          </fieldset>
        ))}
      </div>

      <p className={styles.privacyHint}>
        {copy.specialNeeds} <Link href="/privacy">{copy.privacy}</Link>.
      </p>

      {turnstileSiteKey ? (
        <div className={styles.turnstileWrap}>
          <Script
            onLoad={renderTurnstile}
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
          />
          <div ref={turnstileContainer} />
        </div>
      ) : null}

      <p
        aria-live="polite"
        className={
          state.status === "success" ? styles.successMessage : styles.formMessage
        }
        role={state.status === "error" ? "alert" : "status"}
      >
        {state.message}
      </p>

      <button className={styles.primaryAction} disabled={pending} type="submit">
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
