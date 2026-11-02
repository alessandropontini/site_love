"use client";

import { useState, useTransition } from "react";
import { applyGuests, cancelGuests, previewGuests } from "./actions";
import type { Plan } from "@/lib/guest-sync/model";
import styles from "./sync.module.css";
import PreviewDetails from "./PreviewDetails";

type Preview = {
  plan: Plan;
  receipt: string;
  databaseCount: number;
};

export default function GuestListSynchronization({
  databaseCount,
  lastSync
}: {
  databaseCount: number;
  lastSync: string | null;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState(
    "Ready for a manual preview."
  );
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [unknown, setUnknown] = useState(false);

  const launch = (action: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await action();
      } catch {
        setMessage(
          "The request was interrupted. Retry the same action to check its outcome."
        );
        setUnknown(true);
      }
    });

  return (
    <section
      className={styles.panel}
      aria-labelledby="sync-heading"
      aria-busy={pending}
    >
      <h1 id="sync-heading">
        Guest List Synchronization
      </h1>

      <p>
        Source: Google Sheets — THE LIST / Guest List
      </p>

      {/* ========================================= */}
      {/* SYNCHRONIZATION OVERVIEW                  */}
      {/* ========================================= */}

      <dl className={styles.metrics}>
        <div>
          <dt>Last successful synchronization</dt>
          <dd>
            {lastSync
              ? new Date(lastSync).toLocaleString("en-GB", {
                  timeZone: "Europe/Rome"
                })
              : "Never"}
          </dd>
        </div>

        <div>
          <dt>Current named guests in database</dt>
          <dd>{preview?.databaseCount ?? databaseCount}</dd>
        </div>

        <div>
          <dt>Total guest rows in Google Sheets</dt>
          <dd>
            {preview
              ? preview.plan.sourceCount +
                preview.plan.skippedRows.length
              : "Run Preview Sync"}
          </dd>
        </div>

        <div>
          <dt>Rows considered for synchronization</dt>
          <dd>
            {preview?.plan.sourceCount ?? "—"}
          </dd>
        </div>

        <div>
          <dt>Provisional rows skipped</dt>
          <dd>
            {preview?.plan.skippedRows.length ?? "—"}
          </dd>
        </div>
      </dl>

      {/* ========================================= */}
      {/* OPERATION STATUS                         */}
      {/* ========================================= */}

      <p role="status" aria-live="polite">
        {pending ? "Working…" : message}
      </p>

      {/* ========================================= */}
      {/* PREVIEW BUTTON                           */}
      {/* ========================================= */}

      {!preview && (
        <button
          disabled={pending}
          onClick={() =>
            launch(async () => {
              setUnknown(false);

              const result = await previewGuests();

              if (!result.ok) {
                setMessage(result.error);
                return;
              }

              setPreview(result.preview);
              setConfirmed(false);

              setMessage(
                result.preview.plan.errors.length
                  ? "Validation failed. Fix the source and run a new preview."
                  : "Preview ready. Review every change before applying."
              );
            })
          }
        >
          Preview Sync
        </button>
      )}

      {/* ========================================= */}
      {/* SYNCHRONIZATION PREVIEW                  */}
      {/* ========================================= */}

      {preview && (
        <>
          <h2>Sync Preview</h2>

          {/* ===================================== */}
          {/* SKIPPED ROWS                         */}
          {/* ===================================== */}

          {preview.plan.skippedRows.length > 0 && (
            <details>
              <summary>
                Show skipped rows (
                {preview.plan.skippedRows.length})
              </summary>

              <p>
                These provisional rows will not be imported
                into the database.
              </p>

              <p>
                The original rows will remain unchanged
                in Google Sheets.
              </p>

              <p>
                <strong>Google Sheets row numbers:</strong>{" "}
                {preview.plan.skippedRows.join(", ")}
              </p>
            </details>
          )}

          {/* ===================================== */}
          {/* PREVIEW METRICS                      */}
          {/* ===================================== */}

          <dl className={styles.metrics}>
            {Object.entries(preview.plan.counts).map(
              ([name, count]) => (
                <div key={name}>
                  <dt>
                    {
                      {
                        created: "New rows",
                        updated: "Updated rows",
                        unchanged: "Unchanged rows",
                        missing: "Missing from source",
                        errors: "Blocking errors"
                      }[name]
                    }
                  </dt>

                  <dd>{count}</dd>
                </div>
              )
            )}
          </dl>

          {/* ===================================== */}
          {/* EXPLANATORY INFORMATION             */}
          {/* ===================================== */}

          <p>
            Excluded test households: {preview.plan.excludedHouseholds}.
            Named guests in excluded test households: {preview.plan.excludedInvitees}.
            These records remain in the database with their invitations and RSVP responses.
          </p>

          <p>
            Preview is read-only. To synchronize later Sheet edits, keep each Sync UUID unchanged and run a new Preview, then Apply Changes.
          </p>

          <p>
            Counts include named adults, unnamed companion
            places and child places.
          </p>

          <p>
            Children and unnamed companions are not created
            as named RSVP guests.
          </p>

          <p>
            Missing rows are retained, never deleted.
          </p>

          <p>
            Provisional rows are excluded from this
            synchronization. They remain available in
            Google Sheets for future completion.
          </p>

          {/* ===================================== */}
          {/* VALIDATION ERRORS                   */}
          {/* ===================================== */}

          {!!preview.plan.errors.length && (
            <div role="alert"><h3>Blocking errors — nothing can be applied</h3><ul className={styles.errors}>
              {preview.plan.errors.map((error, i) => (
                <li key={i}>
                  {error}
                </li>
              ))}
            </ul></div>
          )}

          {/* ===================================== */}
          {/* PROPOSED CHANGES TABLE              */}
          {/* ===================================== */}

          <PreviewDetails plan={preview.plan} />

          {/* ===================================== */}
          {/* EXPLICIT CONFIRMATION               */}
          {/* ===================================== */}

          {!preview.plan.errors.length && (
            <label className={styles.confirm}>
              <input
                type="checkbox"
                checked={confirmed}
                disabled={pending}
                onChange={(e) =>
                  setConfirmed(e.target.checked)
                }
              />{" "}
              I have reviewed these changes and confirm
              applying this batch to the database.
            </label>
          )}

          {/* ===================================== */}
          {/* ACTION BUTTONS                      */}
          {/* ===================================== */}

          <div className={styles.actions}>

            {/* CANCEL */}

            <button
              disabled={pending}
              onClick={() =>
                launch(async () => {
                  const result = await cancelGuests(
                    preview.receipt
                  );

                  if (!result.ok) {
                    setMessage(result.error);
                    return;
                  }

                  setPreview(null);
                  setConfirmed(false);

                  setMessage(
                    result.status === "SUCCESS"
                      ? "This batch had already completed successfully."
                      : `Batch ${result.status.toLowerCase()}.`
                  );
                })
              }
            >
              Cancel
            </button>

            {/* APPLY CHANGES */}

            <button
              disabled={
                pending ||
                !confirmed ||
                !!preview.plan.errors.length
              }
              onClick={() =>
                launch(async () => {
                  const result = await applyGuests({
                    receipt: preview.receipt,
                    confirmed: true
                  });

                  if (!result.ok) {
                    setUnknown(true);
                    setMessage(result.error);
                    return;
                  }

                  setUnknown(false);
                  setPreview(null);
                  setConfirmed(false);

                  setMessage(
                    result.status === "SUCCESS"
                      ? "Synchronization completed. The database transaction and history were committed successfully."
                      : result.status === "CONFLICT"
                        ? "The preview is no longer valid. Nothing from this batch was imported. Run Preview Sync again."
                        : `Batch ${result.status.toLowerCase()}. Review the source and run a new preview.`
                  );
                })
              }
            >
              {unknown
                ? "Retry / Check Batch"
                : "Apply Changes"}
            </button>

          </div>
        </>
      )}
    </section>
  );
}