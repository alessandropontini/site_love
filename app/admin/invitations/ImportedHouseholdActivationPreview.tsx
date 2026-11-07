"use client";

import { useState, useTransition } from "react";

import { previewImportedInvitations } from "./actions";
import type { AdminImportedHouseholdActivationPreview } from "@/lib/rsvp/imported-household-activation-preview";
import styles from "./invitations.module.css";

export default function ImportedHouseholdActivationPreview() {
  const [preview, setPreview] = useState<AdminImportedHouseholdActivationPreview | null>(null);
  const [message, setMessage] = useState("No source or database data has been loaded.");
  const [pending, startTransition] = useTransition();

  function runPreview() {
    startTransition(async () => {
      setPreview(null);
      setMessage("Loading the read-only preview…");
      try {
        const result = await previewImportedInvitations();
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setPreview(result.preview);
        setMessage(
          result.preview.eligible
            ? "All mapped households passed the current eligibility checks."
            : "Review the blockers before any future activation decision."
        );
      } catch {
        setMessage("The preview could not be verified. Retry when services are available.");
      }
    });
  }

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
              <thead>
                <tr>
                  <th scope="col">Household</th>
                  <th scope="col">External Household UUID</th>
                  <th scope="col">Existing RSVP ID</th>
                  <th scope="col">Members</th>
                  <th scope="col">Named invitees</th>
                  <th scope="col">Review</th>
                </tr>
              </thead>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.households.length === 0 ? <p>No imported Household UUID records were found.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
