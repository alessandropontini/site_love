"use client";
import { useState, useTransition } from "react";
import { applyGuests, cancelGuests, previewGuests } from "./actions";
import type { Plan } from "@/lib/guest-sync/model";
import styles from "./sync.module.css";

type Preview = { plan: Plan; receipt: string; databaseCount: number };
export default function GuestListSynchronization({
  databaseCount,
  lastSync
}: {
  databaseCount: number;
  lastSync: string | null;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("Ready for a manual preview.");
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
      <h1 id="sync-heading">Guest List Synchronization</h1>
      <p>Source: Google Sheets — THE LIST / Guest List</p>
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
          <dd>{databaseCount}</dd>
        </div>
        <div>
          <dt>Guest rows available in Google Sheets</dt>
          <dd>{preview?.plan.sourceCount ?? "Run Preview Sync"}</dd>
        </div>
      </dl>
      <p role="status" aria-live="polite">
        {pending ? "Working…" : message}
      </p>
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
      {preview && (
        <>
          <h2>Sync Preview</h2>
          <dl className={styles.metrics}>
            {Object.entries(preview.plan.counts).map(([name, count]) => (
              <div key={name}>
                <dt>
                  {
                    {
                      created: "New rows",
                      updated: "Updated rows",
                      unchanged: "Unchanged rows",
                      missing: "Missing from source",
                      errors: "Validation errors"
                    }[name]
                  }
                </dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
          <p>
            Counts include named adults, unnamed companion places and child
            places. Children and unnamed companions are not created as named
            RSVP guests. Missing rows are retained, never deleted.
          </p>
          {!!preview.plan.errors.length && (
            <ul className={styles.errors}>
              {preview.plan.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}
          <div className={styles.scroll}>
            <table>
              <caption>Proposed planning changes</caption>
              <thead>
                <tr>
                  <th>Guest / household</th>
                  <th>Operation</th>
                  <th>Current value</th>
                  <th>New value</th>
                  <th>Validation status</th>
                </tr>
              </thead>
              <tbody>
                {preview.plan.changes.map((change, i) => (
                  <tr key={i}>
                    <td>{change.guest}</td>
                    <td>{change.operation}</td>
                    <td>
                      <pre>
                        {change.current
                          ? JSON.stringify(
                              change.current,
                              (key, value) =>
                                key === "externalId" ? undefined : value,
                              2
                            )
                          : "—"}
                      </pre>
                    </td>
                    <td>
                      <pre>
                        {change.next
                          ? JSON.stringify(
                              change.next,
                              (key, value) =>
                                key === "externalId" ? undefined : value,
                              2
                            )
                          : "—"}
                      </pre>
                    </td>
                    <td>
                      {change.errors.join(" ") ||
                        (change.operation === "MISSING FROM SOURCE"
                          ? "Review separately; retained"
                          : "Valid")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!preview.plan.errors.length && (
            <label className={styles.confirm}>
              <input
                type="checkbox"
                checked={confirmed}
                disabled={pending}
                onChange={(e) => setConfirmed(e.target.checked)}
              />{" "}
              I have reviewed these changes and confirm applying this batch to
              the database.
            </label>
          )}
          <div className={styles.actions}>
            <button
              disabled={pending}
              onClick={() =>
                launch(async () => {
                  const result = await cancelGuests(preview.receipt);
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
            <button
              disabled={pending || !confirmed || !!preview.plan.errors.length}
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
              {unknown ? "Retry / Check Batch" : "Apply Changes"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
