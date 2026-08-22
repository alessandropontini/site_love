"use client";

import Image from "next/image";
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

import {
  mealPreferenceLabels,
  menuDishCopy,
  menuDishImages,
  menuProposalCopy,
  selectableMealPreferences,
  type MenuDishId
} from "@/lib/rsvp/display";
import type {
  MealPreference,
  RsvpInvitation,
  RsvpLocale
} from "@/lib/rsvp/types";

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
    specialNeeds:
      "Per allergie o necessità di accessibilità, contattaci direttamente attraverso il canale con cui hai ricevuto l’invito.",
    privacy: "Come usiamo i dati RSVP",
    savedAnswers:
      "Le scelte già salvate sono selezionate qui sotto. Puoi modificarle e confermare nuovamente.",
    confirmChanges:
      "Stai modificando una risposta già salvata. Vuoi confermare le nuove scelte?",
    noChanges: "Non hai modificato nessuna risposta già salvata.",
    submit: "Salva la risposta",
    submitting: "Salvataggio…"
  },
  en: {
    attendance: "Will you attend?",
    yes: "Yes, I’ll be there",
    no: "No, I won’t be able to attend",
    meal: "Meal preference",
    specialNeeds:
      "For allergies or accessibility requirements, contact us directly through the channel used for your invitation.",
    privacy: "How we use RSVP data",
    savedAnswers:
      "Your saved choices are selected below. You can edit and confirm them again.",
    confirmChanges:
      "You are changing a saved response. Do you want to confirm the new choices?",
    noChanges: "You have not changed any saved response.",
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

type SavedChoice = {
  attendance: "yes" | "no" | null;
  mealPreference: MealPreference | null;
};

export function RsvpForm({
  token,
  invitation,
  locale,
  turnstileSiteKey
}: RsvpFormProps) {
  const copy = formCopy[locale];
  const mealLabels = mealPreferenceLabels[locale];
  const menuCopy = menuProposalCopy[locale];
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
  const dishDialog = useRef<HTMLDialogElement>(null);
  const pendingAnswers = useRef<Record<string, SavedChoice> | null>(null);
  const [selectedDish, setSelectedDish] = useState<MenuDishId | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, SavedChoice>>(
    () =>
      Object.fromEntries(
        invitation.invitees.map((invitee) => [
          invitee.id,
          {
            attendance: invitee.attendance,
            mealPreference: invitee.mealPreference
          }
        ])
      )
  );
  const [attendanceByInvitee, setAttendanceByInvitee] = useState<
    Record<string, "yes" | "no" | null>
  >(() =>
    Object.fromEntries(
      invitation.invitees.map((invitee) => [invitee.id, invitee.attendance])
    )
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

  useEffect(() => {
    if (state.status === "success" && pendingAnswers.current) {
      setSavedAnswers(pendingAnswers.current);
      pendingAnswers.current = null;
    }
  }, [state.attempt, state.status]);

  useEffect(() => {
    if (selectedDish && dishDialog.current && !dishDialog.current.open) {
      dishDialog.current.showModal();
    }
  }, [selectedDish]);

  const hasSavedAnswers = Object.values(savedAnswers).some(
    (answer) => answer.attendance !== null
  );
  const selectedDishCopy = selectedDish
    ? menuDishCopy[locale][selectedDish]
    : null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const currentAnswers = Object.fromEntries(
      invitation.invitees.map((invitee) => {
        const attendance = formData.get(`attendance:${invitee.id}`);
        const normalizedAttendance: SavedChoice["attendance"] =
          attendance === "yes" || attendance === "no" ? attendance : null;
        const mealPreference =
          normalizedAttendance === "no"
            ? "not_needed"
            : (formData.get(`meal:${invitee.id}`) as MealPreference | null);

        return [
          invitee.id,
          {
            attendance: normalizedAttendance,
            mealPreference
          }
        ];
      })
    );
    const hasChanges = invitation.invitees.some((invitee) => {
      const saved = savedAnswers[invitee.id];
      const current = currentAnswers[invitee.id];

      return (
        saved?.attendance !== current?.attendance ||
        saved?.mealPreference !== current?.mealPreference
      );
    });

    if (hasSavedAnswers && !hasChanges) {
      event.preventDefault();
      window.alert(copy.noChanges);
      return;
    }

    if (hasSavedAnswers && !window.confirm(copy.confirmChanges)) {
      event.preventDefault();
      return;
    }

    pendingAnswers.current = currentAnswers;
  }

  return (
    <form action={formAction} className={styles.form} onSubmit={handleSubmit}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="revision" value={state.revision} />

      <section
        aria-labelledby="menu-proposal-heading"
        className={styles.menuProposal}
        id="menu-proposal"
      >
        <div className={styles.menuProposalHeader}>
          <p className={styles.menuKicker}>{menuCopy.kicker}</p>
          <h2 id="menu-proposal-heading">{menuCopy.title}</h2>
          <p>{menuCopy.intro}</p>
        </div>

        <div className={styles.menuGrid}>
          {menuCopy.menus.map((menu) => (
            <article className={styles.menuCard} key={menu.value}>
              <h3>{menu.title}</h3>
              <ul>
                {menu.courses.map((course) => (
                  <li key={course.dish}>
                    <button
                      aria-haspopup="dialog"
                      className={styles.dishButton}
                      onClick={() => setSelectedDish(course.dish)}
                      type="button"
                    >
                      <span>{course.label}</span>
                      <span className={styles.dishButtonHint}>
                        {menuCopy.viewDish}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className={styles.menuDraft}>{menuCopy.draft}</p>
        <p className={styles.veganNote}>{menuCopy.veganNote}</p>
      </section>

      {selectedDish && selectedDishCopy ? (
        <dialog
          aria-describedby="dish-dialog-description"
          aria-labelledby="dish-dialog-title"
          className={styles.dishDialog}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              event.currentTarget.close();
            }
          }}
          onClose={() => setSelectedDish(null)}
          ref={dishDialog}
        >
          <div className={styles.dishDialogCard}>
            <button
              className={styles.dishClose}
              onClick={() => dishDialog.current?.close()}
              type="button"
            >
              <span>{menuCopy.closeDish}</span>
              <span aria-hidden="true">×</span>
            </button>

            <div className={styles.dishImageFrame}>
              <Image
                alt={selectedDishCopy.imageAlt}
                className={styles.dishImage}
                height={1086}
                sizes="(max-width: 720px) 92vw, 720px"
                src={menuDishImages[selectedDish]}
                width={1448}
              />
            </div>

            <div className={styles.dishDialogBody}>
              <p className={styles.menuKicker}>{menuCopy.kicker}</p>
              <h3 id="dish-dialog-title">{selectedDishCopy.title}</h3>
              <p id="dish-dialog-description">
                {selectedDishCopy.description}
              </p>
              <h4>{menuCopy.ingredientsHeading}</h4>
              <p>{selectedDishCopy.ingredients}</p>
              <p className={styles.dishImageNote}>{menuCopy.imageNote}</p>
            </div>
          </div>
        </dialog>
      ) : null}

      {hasSavedAnswers ? (
        <p className={styles.savedAnswersNotice}>{copy.savedAnswers}</p>
      ) : null}

      <div className={styles.inviteeList}>
        {invitation.invitees.map((invitee) => {
          const attendance = attendanceByInvitee[invitee.id];
          const savedMeal =
            invitee.mealPreference && invitee.mealPreference !== "not_needed"
              ? invitee.mealPreference
              : "standard";

          return (
            <fieldset className={styles.inviteeCard} key={invitee.id}>
              <legend>{invitee.displayName}</legend>

              <div className={styles.fieldGroup}>
                <p className={styles.fieldLabel}>{copy.attendance}</p>
                <label className={styles.choice}>
                  <input
                    defaultChecked={invitee.attendance === "yes"}
                    name={`attendance:${invitee.id}`}
                    onChange={() =>
                      setAttendanceByInvitee((current) => ({
                        ...current,
                        [invitee.id]: "yes"
                      }))
                    }
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
                    onChange={() =>
                      setAttendanceByInvitee((current) => ({
                        ...current,
                        [invitee.id]: "no"
                      }))
                    }
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
                  aria-describedby="menu-proposal"
                  defaultValue={savedMeal}
                  disabled={attendance === "no"}
                  name={`meal:${invitee.id}`}
                  required={attendance === "yes"}
                >
                  {selectableMealPreferences.map((preference) => (
                    <option key={preference} value={preference}>
                      {mealLabels[preference]}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
          );
        })}
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
