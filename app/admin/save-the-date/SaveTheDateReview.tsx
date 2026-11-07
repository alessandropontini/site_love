"use client";

import { useState, useTransition } from "react";

import type {
  SaveTheDateAdminPreview,
  SaveTheDatePreparation
} from "@/lib/save-the-date/admin-actions";
import type { SaveTheDateStatus } from "@/lib/save-the-date/workflow";
import { canRecordManualStatus, manualConfirmationText } from "@/lib/save-the-date/presentation";
import {
  prepareSaveTheDateAction,
  previewSaveTheDate,
  recordSaveTheDateAction
} from "./actions";
import styles from "./save-the-date.module.css";

type Preparation = SaveTheDatePreparation;

const channels = [
  ["sms", "SMS"], ["imessage", "iMessage"], ["whatsapp", "WhatsApp"],
  ["email", "Email"], ["telegram", "Telegram"], ["instagram", "Instagram"],
  ["paper", "Paper"]
] as const;
const statuses: SaveTheDateStatus[] = ["READY", "SENT", "FAILED", "NOT_SENT"];

function errorText(code: string) {
  switch (code) {
    case "STD_NOT_READY": return "This household is blocked by the current mapping or roster checks.";
    case "STD_PREVIEW_EXPIRED": return "This review expired. Load a fresh preview before recording an outcome.";
    case "STD_PREVIEW_CHANGED": return "The source, mapping or RSVP snapshot changed. Load a fresh preview and review again.";
    case "STD_VERSION_CONFLICT": return "Another administrator changed this household. Load a fresh preview.";
    case "STD_INVALID_TRANSITION": return "That status change is not allowed from the current state.";
    default: return "The operation could not be verified. Retry after checking the latest status.";
  }
}

export default function SaveTheDateReview() {
  const [preview, setPreview] = useState<SaveTheDateAdminPreview | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [channel, setChannel] = useState<(typeof channels)[number][0]>("whatsapp");
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [status, setStatus] = useState<SaveTheDateStatus | "">("");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("No source or database data has been loaded.");
  const [pending, startTransition] = useTransition();

  function loadPreview() {
    startTransition(async () => {
      setPreparation(null);
      setSelectedId("");
      setStatus("");
      setConfirmed(false);
      setMessage("Loading a read-only review…");
      try {
        const result = await previewSaveTheDate();
        if (!result.ok) {
          setPreview(null);
          setMessage("The review is unavailable. No data was changed.");
          return;
        }
        setPreview(result.preview);
        setMessage("Review the UUID mapping, roster and current state before preparing one draft.");
      } catch {
        setPreview(null);
        setMessage("The review could not be verified. No data was changed.");
      }
    });
  }

  function prepareDraft() {
    if (!selectedId) return;
    startTransition(async () => {
      setPreparation(null);
      setStatus("");
      setConfirmed(false);
      setMessage("Rechecking the selected household and preparing a draft…");
      try {
        const result = await prepareSaveTheDateAction({ externalHouseholdId: selectedId, channel });
        if (!result.ok) {
          setMessage(errorText(result.error));
          return;
        }
        const prepared = result.preparation;
        setPreparation(prepared);
        const nextStatus = prepared.allowedStatuses.includes("READY")
          ? "READY" : prepared.allowedStatuses[0] ?? "";
        setStatus(nextStatus);
        setMessage("Draft ready for review. Nothing has been sent or recorded yet.");
      } catch {
        setMessage("The draft could not be prepared. No data was changed.");
      }
    });
  }

  function recordOutcome() {
    if (!preparation || !canRecordManualStatus(status, preparation.allowedStatuses, confirmed)) return;
    startTransition(async () => {
      setMessage("Recording the confirmed manual outcome…");
      try {
        const result = await recordSaveTheDateAction({ receipt: preparation.receipt, status });
        if (!result.ok) {
          setMessage(errorText(result.error));
          return;
        }
        setPreview((current) => current && ({
          ...current,
          households: current.households.map((household) => household.externalHouseholdId === selectedId
            ? { ...household, status: result.result.status, version: result.result.version }
            : household)
        }));
        setPreparation(null);
        setStatus("");
        setConfirmed(false);
        setMessage(result.result.replayed
          ? "The previous manual outcome was recovered. SITE LOVE did not send a message."
          : "The manual outcome was recorded. SITE LOVE did not send a message.");
      } catch {
        setMessage("The result could not be verified. Check the status before retrying; SITE LOVE sends no messages.");
      }
    });
  }

  const selected = preview?.households.find((household) => household.externalHouseholdId === selectedId);

  return (
    <div aria-busy={pending}>
      <p className={styles.status} role="status" aria-live="polite">{pending ? "Working…" : message}</p>
      <button className={styles.button} type="button" disabled={pending} onClick={loadPreview}>
        {pending ? "Working…" : preview ? "Refresh review" : "Load review"}
      </button>

      {preview && (
        <>
          <dl className={styles.metrics} aria-label="Review summary">
            <div><dt>Eligible households</dt><dd>{preview.eligibleHouseholds}</dd></div>
            <div><dt>Blocked households</dt><dd>{preview.blockedHouseholds}</dd></div>
          </dl>
          {preview.blockers.length > 0 && (
            <section aria-labelledby="source-blockers-heading">
              <h3 id="source-blockers-heading">Source blockers</h3>
              <ul className={styles.blockers}>{preview.blockers.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}

          <div className={styles.tableScroll}>
            <table>
              <thead><tr>
                <th scope="col">External Household UUID</th>
                <th scope="col">Existing RSVP household ID</th>
                <th scope="col">Members</th>
                <th scope="col">Manual status</th>
                <th scope="col">Review</th>
              </tr></thead>
              <tbody>
                {preview.households.map((household) => (
                  <tr key={household.externalHouseholdId}>
                    <th scope="row">{household.externalHouseholdId}</th>
                    <td>{household.householdId ?? "No unique mapping"}</td>
                    <td>{household.memberCount}</td>
                    <td>{household.status} · v{household.version}</td>
                    <td>
                      <strong data-eligible={household.eligibleForPreparation}>
                        {household.eligibleForPreparation ? "Eligible" : "Blocked"}
                      </strong>
                      {household.blockers.length > 0 && (
                        <ul className={styles.blockers}>{household.blockers.map((item) => <li key={item}>{item}</li>)}</ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.households.length === 0 && <p>No imported Household UUID records were found.</p>}
          </div>

          <section className={styles.reviewForm} aria-labelledby="draft-heading">
            <h3 id="draft-heading">Prepare one household draft</h3>
            <label htmlFor="save-date-household">Eligible household</label>
            <select id="save-date-household" value={selectedId} disabled={pending}
              onChange={(event) => { setSelectedId(event.target.value); setPreparation(null); setStatus(""); setConfirmed(false); }}>
              <option value="">Choose a household UUID</option>
              {preview.households.filter((household) => household.eligibleForPreparation).map((household) => (
                <option key={household.externalHouseholdId} value={household.externalHouseholdId}>
                  {household.externalHouseholdId} · {household.memberCount} members · {household.status}
                </option>
              ))}
            </select>
            <label htmlFor="save-date-channel">Manual channel</label>
            <select id="save-date-channel" value={channel} disabled={pending}
              onChange={(event) => { setChannel(event.target.value as typeof channel); setPreparation(null); setStatus(""); setConfirmed(false); }}>
              {channels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button className={styles.button} type="button" disabled={pending || !selected?.eligibleForPreparation}
              onClick={prepareDraft}>
              Prepare draft for review
            </button>
          </section>
        </>
      )}

      {preparation && (
        <section className={styles.draftCard} aria-labelledby="draft-review-heading">
          <h3 id="draft-review-heading">Review before recording</h3>
          <p>Household {preparation.household.externalHouseholdId} maps to existing RSVP ID {preparation.household.householdId}.</p>
          <p>{preparation.household.memberCount} household members · {preparation.draft.channel} · {preparation.draft.language} · {preparation.draft.templateVersion}</p>
          <label htmlFor="save-date-draft">Message draft</label>
          <textarea id="save-date-draft" rows={9} readOnly value={preparation.draft.text} />
          <p>Current status: {preparation.state.status} · version {preparation.state.version}</p>
          <label htmlFor="save-date-outcome">Manual outcome to record</label>
          <select id="save-date-outcome" value={status} disabled={pending}
            onChange={(event) => { setStatus(event.target.value as SaveTheDateStatus | ""); setConfirmed(false); }}>
            <option value="">Choose an outcome</option>
            {statuses.filter((candidate) => preparation.allowedStatuses.includes(candidate)).map((candidate) => (
              <option key={candidate} value={candidate}>{candidate}</option>
            ))}
          </select>
          {status && (
            <label className={styles.confirmation}>
              <input type="checkbox" checked={confirmed} disabled={pending}
                onChange={(event) => setConfirmed(event.target.checked)} />
              <span>{manualConfirmationText(status)}</span>
            </label>
          )}
          <button className={styles.button} type="button" disabled={pending || !canRecordManualStatus(status, preparation.allowedStatuses, confirmed)}
            onClick={recordOutcome}>
            Confirm and record manual outcome
          </button>
        </section>
      )}
    </div>
  );
}
