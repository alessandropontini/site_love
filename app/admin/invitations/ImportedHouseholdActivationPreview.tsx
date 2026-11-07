"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

import { confirmImportedInvitation, prepareImportedInvitation, previewImportedInvitations } from "./actions";
import type { AdminImportedHouseholdActivationPreview } from "@/lib/rsvp/imported-household-activation-preview";
import styles from "./invitations.module.css";

type Preparation = {
  receipt: string;
  token: string;
  household: {
    externalHouseholdId: string;
    householdId: string;
    label: string;
    memberCount: number;
    namedInviteeCount: number;
  };
};

export default function ImportedHouseholdActivationPreview() {
  const [preview, setPreview] = useState<AdminImportedHouseholdActivationPreview | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [activated, setActivated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [message, setMessage] = useState("No source or database data has been loaded.");
  const [pending, startTransition] = useTransition();

  function runPreview() {
    startTransition(async () => {
      setPreview(null);
      setSelectedId("");
      setPreparation(null);
      setActivated(false);
      setConfirmed(false);
      setQrDataUrl("");
      setMessage("Loading the read-only preview…");
      try {
        const result = await previewImportedInvitations();
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setPreview(result.preview);
        setMessage(result.preview.eligible
          ? "All mapped households passed the current eligibility checks."
          : "Review the blockers before preparing an activation.");
      } catch {
        setMessage("The preview could not be verified. Retry when services are available.");
      }
    });
  }

  function prepare() {
    if (!selectedId) return;
    startTransition(async () => {
      setPreparation(null);
      setActivated(false);
      setConfirmed(false);
      setQrDataUrl("");
      setMessage("Rechecking the selected mapping and preparing a private activation…");
      try {
        const result = await prepareImportedInvitation({ externalHouseholdId: selectedId });
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setPreparation(result.preparation);
        setMessage("Prepared for review. No database change has been made.");
      } catch {
        setMessage("Preparation failed. No database change has been made.");
      }
    });
  }

  function generateQr() {
    if (!privateUrl) return;
    startTransition(async () => {
      setMessage("Rendering the private QR in this browser…");
      try {
        const { renderPrivateInvitationQr } = await import("@/lib/rsvp/private-invitation-qr");
        setQrDataUrl(await renderPrivateInvitationQr(privateUrl, window.location.origin));
        setMessage("Private QR is ready in this page. It has not been saved to the project or sent.");
      } catch {
        setMessage("The private QR could not be rendered. The RSVP URL remains available.");
      }
    });
  }

  async function copyPrivateUrl() {
    try {
      await navigator.clipboard.writeText(privateUrl);
      setMessage("Private RSVP URL copied to clipboard. Keep it confidential; no message was sent.");
    } catch {
      setMessage("Copy was unavailable. Select and copy the private RSVP URL manually.");
    }
  }

  function confirmActivation() {
    if (!preparation || !confirmed || activated) return;
    startTransition(async () => {
      setMessage("Confirming activation. Keep this page open while the result is pending.");
      try {
        const result = await confirmImportedInvitation({ receipt: preparation.receipt, confirmed: true });
        if (!result.ok) {
          setMessage(`${result.error}. The private token remains in this page for review or retry.`);
          return;
        }
        setActivated(true);
        setMessage(result.result.replayed
          ? "The committed activation was recovered. No message was sent."
          : "Household activated. No message was sent.");
      } catch {
        setMessage("The result could not be verified. Retry here with the same review; the database operation is idempotent.");
      }
    });
  }

  const privateUrl = activated && preparation
    ? `${typeof window === "undefined" ? "" : window.location.origin}/rsvp/${preparation.token}`
    : "";

  return (
    <div aria-busy={pending}>
      <p className={styles.status} role="status" aria-live="polite">
        {pending ? "Working…" : message}
      </p>
      <button className={styles.button} type="button" disabled={pending} onClick={runPreview}>
        {pending ? "Loading preview…" : preview ? "Refresh preview" : "Preview imported invitations"}
      </button>

      {preview ? (
        <div className={styles.results}>
          <dl className={styles.metrics}>
            <div><dt>Eligible households</dt><dd>{preview.eligibleHouseholds}</dd></div>
            <div><dt>Blocked households</dt><dd>{preview.blockedHouseholds}</dd></div>
          </dl>
          {preview.blockers.length > 0 ? (
            <section aria-labelledby="preview-blockers-heading">
              <h3 id="preview-blockers-heading">Source-level blockers</h3>
              <ul className={styles.blockers}>
                {preview.blockers.map((blocker, index) => <li key={`${index}-${blocker}`}>{blocker}</li>)}
              </ul>
            </section>
          ) : null}
          <div className={styles.tableScroll}>
            <table>
              <thead><tr>
                <th scope="col">Household</th>
                <th scope="col">External Household UUID</th>
                <th scope="col">Existing RSVP ID</th>
                <th scope="col">Members</th>
                <th scope="col">Named invitees</th>
                <th scope="col">Review</th>
              </tr></thead>
              <tbody>
                {preview.households.map((household) => (
                  <tr key={household.externalHouseholdId}>
                    <th scope="row">{household.label}</th>
                    <td>{household.externalHouseholdId}</td>
                    <td>{household.householdId ?? "No unique mapping"}</td>
                    <td>{household.sourceMemberCount}</td>
                    <td>{household.namedInviteeCount}</td>
                    <td>
                      <strong data-eligible={household.eligible}>
                        {household.eligible ? "Eligible for review" : "Blocked"}
                      </strong>
                      {household.blockers.length > 0 ? (
                        <ul className={styles.blockers}>
                          {household.blockers.map((blocker, index) => <li key={`${index}-${blocker}`}>{blocker}</li>)}
                        </ul>
                      ) : null}
                      {household.eligible ? (
                        <button type="button" className={styles.selectButton} disabled={pending}
                          aria-label={`Select ${household.label}`} onClick={() => {
                            setSelectedId(household.externalHouseholdId);
                            setPreparation(null);
                            setActivated(false);
                            setConfirmed(false);
                            setQrDataUrl("");
                          }}>Select</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.households.length === 0 ? <p>No imported Household UUID records were found.</p> : null}
          </div>
          <section className={styles.review} aria-labelledby="activation-review-heading">
            <h3 id="activation-review-heading">Prepare one activation for review</h3>
            <label htmlFor="activation-household">Eligible imported household</label>
            <select id="activation-household" value={selectedId} disabled={pending}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setPreparation(null);
                setActivated(false);
                setConfirmed(false);
                setQrDataUrl("");
              }}>
              <option value="">Choose a household</option>
              {preview.households.filter((household) => household.eligible).map((household) => (
                <option key={household.externalHouseholdId} value={household.externalHouseholdId}>
                  {household.label} · {household.externalHouseholdId} · {household.sourceMemberCount} members
                </option>
              ))}
            </select>
            <button className={styles.button} type="button" disabled={pending || !selectedId} onClick={prepare}>
              Prepare private activation
            </button>
            <p>The raw token stays only in this page&apos;s memory. Preparation does not activate the household.</p>
          </section>
        </div>
      ) : null}

      {preparation ? (
        <section className={styles.review} aria-labelledby="confirm-activation-heading">
          <h3 id="confirm-activation-heading">Review before activation</h3>
          <p>{preparation.household.label}: {preparation.household.memberCount} members and {preparation.household.namedInviteeCount} named invitees.</p>
          <p>Existing RSVP household ID: {preparation.household.householdId}. Household and invitee IDs remain unchanged.</p>
          <p>Confirmation activates this existing household and creates a private RSVP link. SITE LOVE will not send it.</p>
          {!activated ? (
            <>
              <label className={styles.confirmation}>
                <input type="checkbox" checked={confirmed} disabled={pending}
                  onChange={(event) => setConfirmed(event.target.checked)} />
                <span>I reviewed this exact household mapping and authorize activation.</span>
              </label>
              <button className={styles.button} type="button" disabled={pending || !confirmed} onClick={confirmActivation}>
                Confirm activation
              </button>
            </>
          ) : (
            <>
              <label htmlFor="activated-private-url">Private RSVP URL (keep confidential; no message was sent)</label>
              <input id="activated-private-url" className={styles.privateUrl} readOnly value={privateUrl} />
              <div className={styles.handoffActions}>
                <button className={styles.button} type="button" onClick={copyPrivateUrl}>Copy private URL</button>
                {!qrDataUrl ? (
                  <button className={styles.button} type="button" disabled={pending} onClick={generateQr}>Generate private QR</button>
                ) : (
                  <a className={styles.download} href={qrDataUrl} download="site-love-rsvp-invitation.png">Download private QR</a>
                )}
              </div>
              {qrDataUrl ? <Image className={styles.qr} src={qrDataUrl} width={512} height={512} unoptimized alt="Private RSVP QR code" /> : null}
              <p>The URL and QR are shown only in this admin page. Save the downloaded file in a private location. Nothing is sent automatically.</p>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
