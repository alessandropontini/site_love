"use client";

import { useMemo, useState, useTransition } from "react";

import { mealPreferenceLabels, selectableMealPreferences } from "@/lib/rsvp/display";
import type { RsvpInvitation } from "@/lib/rsvp/types";
import {
  buildManualResponseInput,
  createManualResponseDraft,
  expectedRecordingReason,
  type ManualResponseDraft
} from "@/lib/rsvp-admin/form";
import type { ManualResponseInput } from "@/lib/rsvp-admin/model";
import { loadManualResponseHousehold, saveManualResponse } from "./actions";
import styles from "./manual-rsvp.module.css";

export type ManualHouseholdChoice = {
  id: string;
  name: string;
  size: number;
  revision: number;
  status: "active" | "closed" | "disabled";
};

type ActionError = { ok: false; error: string };
type HouseholdResult = { ok: true; household: RsvpInvitation } | ActionError;
type SaveResult = { ok: true; result: { revision: number; replayed: boolean } } | ActionError;

const provenanceLabels = {
  phone: "Phone call",
  message: "Message",
  paper: "Paper response",
  in_person: "In person"
} as const;

const reasonLabels = {
  initial_offsite_response: "First response collected outside the website",
  correction: "Correction to an existing response"
} as const;
const VALIDATION_OPERATION_ID = "00000000-0000-4000-8000-000000000001";

function householdErrorMessage(code: string) {
  if (code === "MANUAL_NOT_FOUND") return "This household could not be loaded. Refresh the page and try again.";
  if (code === "MANUAL_INVALID_REQUEST") return "The household selection is invalid.";
  return "The household could not be loaded. Try again or contact the administrator.";
}

function saveErrorMessage(code: string) {
  if (code === "MANUAL_VERSION_CONFLICT") return "The RSVP changed since it was loaded. Reload the household and review the current answer.";
  if (code === "MANUAL_REASON_STATE_MISMATCH") return "This response state is no longer eligible. Reload the household before continuing.";
  if (code === "MANUAL_UNCHANGED") return "There is no change to record. Reload the household to review its current state.";
  if (code === "MANUAL_NOT_FOUND") return "The household is no longer available. Reload the household list.";
  return "The response was rejected. Reload the household to review the current state.";
}

export default function ManualResponseForm({ households }: { households: ManualHouseholdChoice[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [invitation, setInvitation] = useState<RsvpInvitation | null>(null);
  const [draft, setDraft] = useState<ManualResponseDraft | null>(null);
  const [frozenInput, setFrozenInput] = useState<ManualResponseInput | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [requiresReload, setRequiresReload] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = households.find((household) => household.id === selectedId);
  const expectedReason = invitation ? expectedRecordingReason(invitation) : null;
  const request = useMemo(() => {
    if (!invitation || !draft) return null;
    return buildManualResponseInput(invitation, draft, VALIDATION_OPERATION_ID);
  }, [invitation, draft]);

  function updateDraft(update: (current: ManualResponseDraft) => ManualResponseDraft) {
    setDraft((current) => current ? update(current) : current);
    setError("");
  }

  function loadHousehold() {
    if (!selectedId) return;
    setError("");
    setNotice("");
    setSaved(false);
    setFrozenInput(null);
    setRequiresReload(false);
    setInvitation(null);
    setDraft(null);
    startTransition(async () => {
      try {
        const result = await loadManualResponseHousehold(selectedId) as HouseholdResult;
        if (!result.ok) {
          setError(householdErrorMessage(result.error));
          return;
        }
        setInvitation(result.household);
        setDraft(createManualResponseDraft(result.household));
      } catch {
        setError("The household could not be loaded. Try again or contact the administrator.");
      }
    });
  }

  function submit() {
    if (!invitation || !draft || !request || frozenInput || isPending) return;
    const confirmedRequest = buildManualResponseInput(invitation, draft, crypto.randomUUID());
    if (!confirmedRequest) return;
    const immutable = structuredClone(confirmedRequest);
    setFrozenInput(immutable);
    setError("");
    startTransition(async () => {
      try {
        const result = await saveManualResponse(immutable) as SaveResult;
        if (result.ok) {
          setSaved(true);
          setNotice(result.result.replayed
            ? "The response was already recorded. No second change was applied."
            : "The response was recorded successfully.");
          return;
        }
        if (result.error === "MANUAL_UNAVAILABLE") {
          setError("The result is uncertain. Retry the exact same request; do not edit the response.");
          return;
        }
        setFrozenInput(null);
        setRequiresReload(true);
        setError(saveErrorMessage(result.error));
      } catch {
        setError("The result is uncertain. Retry the exact same request; do not edit the response.");
      }
    });
  }

  function retry() {
    if (!frozenInput || isPending || saved) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await saveManualResponse(frozenInput) as SaveResult;
        if (result.ok) {
          setSaved(true);
          setNotice(result.result.replayed
            ? "The response was already recorded. No second change was applied."
            : "The response was recorded successfully.");
          return;
        }
        if (result.error === "MANUAL_UNAVAILABLE") {
          setError("The result is still uncertain. Retry the exact same request or stop and ask an administrator to verify it.");
          return;
        }
        setFrozenInput(null);
        setRequiresReload(true);
        setError(saveErrorMessage(result.error));
      } catch {
        setError("The result is still uncertain. Retry the exact same request or stop and ask an administrator to verify it.");
      }
    });
  }

  const locked = isPending || frozenInput !== null || saved || requiresReload;
  const attendanceIncomplete = Boolean(draft?.answers.some((answer) => !answer.attendance));

  return (
    <section className={styles.card} aria-labelledby="manual-rsvp-heading">
      <h2 id="manual-rsvp-heading">Select and review a household</h2>
      <div className={styles.selection}>
        <label htmlFor="manual-household">Existing household</label>
        <select id="manual-household" value={selectedId} onChange={(event) => {
          setSelectedId(event.target.value);
          setInvitation(null);
          setDraft(null);
          setFrozenInput(null);
          setSaved(false);
          setNotice("");
          setError("");
        }} disabled={locked}>
          <option value="">Choose a household</option>
          {households.map((household) => (
            <option key={household.id} value={household.id} disabled={household.status !== "active"}>
              {household.name} · {household.size} named · {household.status} · v{household.revision}
            </option>
          ))}
        </select>
        <button type="button" onClick={loadHousehold} disabled={!selected || isPending || frozenInput !== null}>
          {isPending && !invitation ? "Loading…" : "Load household for review"}
        </button>
      </div>

      {selected?.status !== "active" && selected ? (
        <p className={styles.warning} role="status">This household is {selected.status}; the database will reject incompatible states.</p>
      ) : null}

      {invitation && draft ? (
        <div className={styles.review}>
          <div className={styles.householdHeading}>
            <div><p className={styles.eyebrow}>Review before recording</p><h3>{invitation.householdName}</h3></div>
            <span>{invitation.locale.toUpperCase()} · revision {invitation.revision}</span>
          </div>

          {!expectedReason ? (
            <p className={styles.warning} role="alert">This household has an incompatible response state. No changes can be recorded here.</p>
          ) : (
            <>
              <p className={styles.notice}>The existing guest IDs and household membership are retained. For a correction, the current answers are shown for deliberate review.</p>
              <fieldset className={styles.fieldset} disabled={locked}>
                <legend>Named guests</legend>
                {draft.answers.map((answer, index) => {
                  const invitee = invitation.invitees[index];
                  if (!invitee) return null;
                  return (
                    <div className={styles.guest} key={answer.inviteeId}>
                      <h4>{invitee.displayName}</h4>
                      <label htmlFor={`attendance-${answer.inviteeId}`}>Attendance</label>
                      <select id={`attendance-${answer.inviteeId}`} value={answer.attendance} onChange={(event) => {
                        const attendance = event.target.value as "yes" | "no" | "";
                        updateDraft((current) => ({
                          ...current,
                          answers: current.answers.map((item) => item.inviteeId === answer.inviteeId
                            ? { ...item, attendance, mealPreference: attendance === "no" ? "not_needed" : item.mealPreference === "not_needed" ? "" : item.mealPreference }
                            : item)
                        }));
                      }}>
                        <option value="">Choose</option><option value="yes">Attending</option><option value="no">Not attending</option>
                      </select>
                      {answer.attendance === "yes" ? <>
                        <label htmlFor={`meal-${answer.inviteeId}`}>Meal preference</label>
                        <select id={`meal-${answer.inviteeId}`} value={answer.mealPreference} onChange={(event) => {
                          const mealPreference = event.target.value as ManualResponseDraft["answers"][number]["mealPreference"];
                          updateDraft((current) => ({ ...current, answers: current.answers.map((item) => item.inviteeId === answer.inviteeId ? { ...item, mealPreference } : item) }));
                        }}>
                          <option value="">Choose</option>
                          {selectableMealPreferences.map((meal) => <option key={meal} value={meal}>{mealPreferenceLabels[invitation.locale][meal]}</option>)}
                        </select>
                      </> : null}
                    </div>
                  );
                })}
              </fieldset>

              {invitation.allowPlusOne ? (
                <fieldset className={styles.fieldset} disabled={locked}>
                  <legend>Additional guest</legend>
                  <label className={styles.check}><input type="checkbox" checked={draft.includePlusOne} onChange={(event) => updateDraft((current) => ({ ...current, includePlusOne: event.target.checked }))} /> A permitted +1 is attending</label>
                  {draft.includePlusOne ? <div className={styles.grid}>
                    <label>First name<input value={draft.plusOne.firstName} maxLength={80} onChange={(event) => updateDraft((current) => ({ ...current, plusOne: { ...current.plusOne, firstName: event.target.value } }))} /></label>
                    <label>Last name<input value={draft.plusOne.lastName} maxLength={80} onChange={(event) => updateDraft((current) => ({ ...current, plusOne: { ...current.plusOne, lastName: event.target.value } }))} /></label>
                    <label>Meal preference<select value={draft.plusOne.mealPreference} onChange={(event) => updateDraft((current) => ({ ...current, plusOne: { ...current.plusOne, mealPreference: event.target.value as ManualResponseDraft["plusOne"]["mealPreference"] } }))}>
                      <option value="">Choose</option>{selectableMealPreferences.map((meal) => <option key={meal} value={meal}>{mealPreferenceLabels[invitation.locale][meal]}</option>)}
                    </select></label>
                  </div> : null}
                </fieldset>
              ) : null}

              <fieldset className={styles.fieldset} disabled={locked}>
                <legend>Response details</legend>
                <div className={styles.grid}>
                  <label>Contact email supplied by respondent<input type="email" autoComplete="off" maxLength={254} value={draft.contactEmail} onChange={(event) => updateDraft((current) => ({ ...current, contactEmail: event.target.value }))} /></label>
                  <label>How was the response received?<select value={draft.provenance} onChange={(event) => updateDraft((current) => ({ ...current, provenance: event.target.value as ManualResponseDraft["provenance"] }))}>
                    <option value="">Choose</option>{Object.entries(provenanceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select></label>
                  <label>Recording reason<select value={draft.recordingReason} onChange={(event) => updateDraft((current) => ({ ...current, recordingReason: event.target.value as ManualResponseDraft["recordingReason"] }))}>
                    <option value="">Choose</option>{expectedReason ? <option value={expectedReason}>{reasonLabels[expectedReason]}</option> : null}
                  </select></label>
                </div>
                <label className={styles.check}><input type="checkbox" checked={draft.emailProvidedByRespondent} onChange={(event) => updateDraft((current) => ({ ...current, emailProvidedByRespondent: event.target.checked }))} /> The respondent supplied this email address for their RSVP.</label>
                <label className={styles.check}><input type="checkbox" checked={draft.hasChildren} onChange={(event) => updateDraft((current) => ({ ...current, hasChildren: event.target.checked }))} /> Children will attend (no names or ages are collected).</label>
              </fieldset>

              <label className={styles.confirm}><input type="checkbox" checked={draft.confirmed} disabled={locked} onChange={(event) => updateDraft((current) => ({ ...current, confirmed: event.target.checked }))} /> I reviewed this response with the respondent and confirm it may be recorded.</label>
              <div className={styles.summary}>
                <strong>Review summary</strong>
                <span>{draft.answers.filter((answer) => answer.attendance === "yes").length} attending · {draft.answers.filter((answer) => answer.attendance === "no").length} not attending</span>
                <span>{draft.provenance ? provenanceLabels[draft.provenance] : "Provenance not selected"} · {draft.recordingReason ? reasonLabels[draft.recordingReason] : "Reason not selected"}</span>
                <span>Email: {draft.contactEmail.trim() || "not supplied"}</span>
              </div>
            </>
          )}

          {frozenInput && !saved ? (
            <button className={styles.primary} type="button" onClick={retry} disabled={isPending}>{isPending ? "Retrying…" : "Retry the exact same request"}</button>
          ) : !saved && expectedReason ? (
            <button className={styles.primary} type="button" onClick={submit} disabled={isPending || locked || !request || attendanceIncomplete}>
              {isPending ? "Recording…" : "Confirm and record RSVP"}
            </button>
          ) : null}
        </div>
      ) : null}

      {notice ? <p className={styles.success} role="status">{notice}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {requiresReload ? <button className={styles.secondary} type="button" onClick={loadHousehold} disabled={isPending || !selectedId}>Reload household for review</button> : null}
    </section>
  );
}
