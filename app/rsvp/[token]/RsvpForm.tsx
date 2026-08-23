"use client";

import Link from "next/link";
import Script from "next/script";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent
} from "react";

import type { RsvpInvitation, RsvpLocale } from "@/lib/rsvp/types";
import { RSVP_PRIVACY_NOTICE_VERSION } from "@/lib/rsvp/privacy";

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
    contactHeading: "Contatto per le conferme",
    contactIntro:
      "Useremo questa email soltanto per confermare la risposta, inviare il menu quando sarà pronto e ricordare eventuali scadenze.",
    email: "Email",
    confirmEmail: "Conferma email",
    attendance: "Parteciperai?",
    yes: "Sì, ci sarò",
    no: "No, non potrò esserci",
    plusOneHeading: "Accompagnatore o accompagnatrice (+1)",
    plusOneIntro:
      "Questo invito consente un accompagnatore non già indicato tra i nomi. Se la persona è già elencata sopra, non aggiungerla di nuovo.",
    plusOneToggle: "Aggiungo un +1",
    firstName: "Nome",
    lastName: "Cognome",
    childrenHeading: "Figli",
    childrenIntro:
      "Indica soltanto se parteciperanno figli. Non raccogliamo nomi, cognomi, età o date di nascita.",
    hasChildren: "Sì, parteciperanno anche figli",
    privacyAcknowledgement:
      "Dichiaro di aver letto l’informativa sul trattamento dei dati. Questa presa visione non costituisce consenso a pubblicità o ad altri usi.",
    privacy: "Leggi come usiamo i dati RSVP",
    menuLater:
      "La scelta del menu verrà richiesta più avanti attraverso questo stesso link.",
    specialNeeds:
      "Per allergie, salute o necessità di accessibilità, contattaci direttamente: non inserirle in questo modulo.",
    savedAnswers:
      "La risposta già salvata è visibile qui sotto. Puoi aggiornarla e confermare nuovamente.",
    confirmChanges:
      "Stai aggiornando una risposta già salvata. Vuoi confermare le nuove informazioni?",
    submit: "Conferma la presenza",
    submitting: "Salvataggio…"
  },
  en: {
    contactHeading: "Contact for confirmations",
    contactIntro:
      "We will use this email only to confirm your response, send the menu when it is ready, and remind you of practical deadlines.",
    email: "Email",
    confirmEmail: "Confirm email",
    attendance: "Will you attend?",
    yes: "Yes, I’ll be there",
    no: "No, I won’t be able to attend",
    plusOneHeading: "Guest (+1)",
    plusOneIntro:
      "This invitation allows one companion who is not already named above. If the person is already listed, do not add them again.",
    plusOneToggle: "I am adding a +1",
    firstName: "First name",
    lastName: "Last name",
    childrenHeading: "Children",
    childrenIntro:
      "Only indicate whether children will attend. We do not collect names, surnames, ages, or dates of birth.",
    hasChildren: "Yes, children will also attend",
    privacyAcknowledgement:
      "I confirm that I have read the data processing notice. This acknowledgement is not consent to advertising or any unrelated use.",
    privacy: "Read how we use RSVP data",
    menuLater:
      "Menu choices will be requested later through this same link.",
    specialNeeds:
      "For allergies, health, or accessibility requirements, contact us directly; do not enter them in this form.",
    savedAnswers:
      "Your saved response is shown below. You can update and confirm it again.",
    confirmChanges:
      "You are updating a saved response. Do you want to confirm the new information?",
    submit: "Confirm attendance",
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
  const [plusOneEnabled, setPlusOneEnabled] = useState(
    invitation.allowPlusOne && Boolean(invitation.plusOne)
  );

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

  const hasSavedResponse =
    Boolean(invitation.contactEmail) ||
    invitation.invitees.some((invitee) => invitee.attendance !== null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (hasSavedResponse && !window.confirm(copy.confirmChanges)) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className={styles.form} onSubmit={handleSubmit}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="revision" value={state.revision} />

      {hasSavedResponse ? (
        <p className={styles.savedAnswersNotice}>{copy.savedAnswers}</p>
      ) : null}

      <section className={styles.detailsSection} aria-labelledby="contact-heading">
        <div className={styles.sectionHeading}>
          <h2 id="contact-heading">{copy.contactHeading}</h2>
          <p>{copy.contactIntro}</p>
        </div>
        <div className={styles.twoColumnFields}>
          <label className={styles.stackedField}>
            <span>{copy.email}</span>
            <input
              autoComplete="email"
              defaultValue={invitation.contactEmail ?? ""}
              inputMode="email"
              maxLength={254}
              name="contactEmail"
              required
              type="email"
            />
          </label>
          <label className={styles.stackedField}>
            <span>{copy.confirmEmail}</span>
            <input
              autoComplete="email"
              defaultValue={invitation.contactEmail ?? ""}
              inputMode="email"
              maxLength={254}
              name="contactEmailConfirm"
              required
              type="email"
            />
          </label>
        </div>
      </section>

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
          </fieldset>
        ))}
      </div>

      {invitation.allowPlusOne ? (
        <section className={styles.detailsSection} aria-labelledby="plus-one-heading">
          <div className={styles.sectionHeading}>
            <h2 id="plus-one-heading">{copy.plusOneHeading}</h2>
            <p>{copy.plusOneIntro}</p>
          </div>
          <label className={styles.choice}>
            <input
              checked={plusOneEnabled}
              name="plusOneEnabled"
              onChange={(event) => setPlusOneEnabled(event.target.checked)}
              type="checkbox"
              value="yes"
            />
            <span>{copy.plusOneToggle}</span>
          </label>
          {plusOneEnabled ? (
            <div className={styles.twoColumnFields}>
              <input
                name="plusOneId"
                type="hidden"
                value={invitation.plusOne?.id ?? ""}
              />
              <label className={styles.stackedField}>
                <span>{copy.firstName}</span>
                <input
                  autoComplete="off"
                  defaultValue={invitation.plusOne?.firstName ?? ""}
                  maxLength={80}
                  name="plusOneFirstName"
                  required
                  type="text"
                />
              </label>
              <label className={styles.stackedField}>
                <span>{copy.lastName}</span>
                <input
                  autoComplete="off"
                  defaultValue={invitation.plusOne?.lastName ?? ""}
                  maxLength={80}
                  name="plusOneLastName"
                  required
                  type="text"
                />
              </label>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={styles.detailsSection} aria-labelledby="children-heading">
        <div className={styles.sectionHeading}>
          <h2 id="children-heading">{copy.childrenHeading}</h2>
          <p>{copy.childrenIntro}</p>
        </div>
        <label className={styles.choice}>
          <input
            defaultChecked={invitation.hasChildren}
            name="hasChildren"
            type="checkbox"
            value="yes"
          />
          <span>{copy.hasChildren}</span>
        </label>
      </section>

      <div className={styles.formNotes}>
        <p>{copy.menuLater}</p>
        <p>{copy.specialNeeds}</p>
      </div>

      <label className={styles.privacyChoice}>
        <input name="privacyAcknowledgement" required type="checkbox" value="yes" />
        <span>{copy.privacyAcknowledgement}</span>
      </label>
      <p className={styles.privacyHint}>
        <Link href={locale === "en" ? "/privacy/en" : "/privacy"}>
          {copy.privacy}
        </Link>{" "}
        · versione {RSVP_PRIVACY_NOTICE_VERSION}.
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
