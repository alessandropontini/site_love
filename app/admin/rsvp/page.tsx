import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

import styles from "@/app/admin/admin.module.css";
import { requireRsvpAdmin } from "@/lib/admin/auth";
import {
  invitationSourceLabels,
  mealPreferenceLabels
} from "@/lib/rsvp/display";
import { getAdminRsvpDashboard } from "@/lib/rsvp/db";
import { readManualResponseDashboardEvents } from "@/lib/rsvp-admin/db";
import type { ManualResponseDashboardEvent } from "@/lib/rsvp-admin/persistence";
import type { Attendance } from "@/lib/rsvp/types";

export const dynamic = "force-dynamic";

const attendanceLabels: Record<Attendance, string> = {
  yes: "Attending",
  no: "Not attending"
};

const mealLabels = mealPreferenceLabels.en;
const sourceLabels = invitationSourceLabels.en;
const guestTypeLabels = {
  named: "Named guest",
  plus_one: "+1"
} as const;
const manualProvenanceLabels: Record<ManualResponseDashboardEvent["provenance"], string> = {
  phone: "Phone",
  message: "Message",
  paper: "Paper",
  in_person: "In person"
};
const manualReasonLabels: Record<ManualResponseDashboardEvent["recordingReason"], string> = {
  initial_offsite_response: "Initial offline response",
  correction: "Correction"
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminRsvpPage() {
  const admin = await requireRsvpAdmin();
  const result = await getAdminRsvpDashboard();

  if (result.status === "unavailable") {
    return (
      <main className={styles.page}>
        <section className={styles.noticeCard}>
          <p className={styles.kicker}>RSVP Administration</p>
          <Link href="/admin/guests">Sync Guests</Link>
          <h1>Database not connected</h1>
          <p>
            Access is protected. Configure DATABASE_URL and apply the Neon migrations to view responses.
          </p>
        </section>
      </main>
    );
  }

  const { dashboard } = result;
  const manualAudit = await readManualResponseDashboardEvents()
    .then((events) => ({ status: "ready" as const, events }))
    .catch(() => ({ status: "unavailable" as const, events: [] }));
  const householdNames = new Map(
    dashboard.rows.map((row) => [row.householdId, row.householdName])
  );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Hello {admin.displayName}</p>
            <h1>RSVP Responses</h1>
          </div>
          <div className={styles.actions}>
            <Link className={styles.secondaryAction} href="/admin/guests">Sync Guests</Link>
            <Link className={styles.secondaryAction} href="/admin/invitations">Imported Invitations</Link>
            <Link className={styles.secondaryAction} href="/admin/save-the-date">Save the Date</Link>
            <Link className={styles.secondaryAction} href="/admin/rsvp/manual">Record offline RSVP</Link>
            <Link
              className={styles.primaryAction}
              href="/admin/rsvp/export"
              prefetch={false}
            >
              Export CSV
            </Link>
            <SignOutButton>
              <button className={styles.secondaryAction} type="button">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </header>

        <section aria-label="Response summary" className={styles.summary}>
          <article>
            <strong>{dashboard.summary.households}</strong>
            <span>Invited households</span>
          </article>
          <article>
            <strong>{dashboard.summary.householdsResponded}</strong>
            <span>Households with complete responses</span>
          </article>
          <article>
            <strong>{dashboard.summary.invitees}</strong>
            <span>Named guests</span>
          </article>
          <article>
            <strong>{dashboard.summary.attending}</strong>
            <span>Confirmed attendance</span>
          </article>
          <article>
            <strong>{dashboard.summary.householdsWithChanges}</strong>
            <span>Households with changes</span>
          </article>
        </section>

        <section
          aria-labelledby="invitation-source-heading"
          className={styles.sourceSummary}
        >
          <div>
            <p className={styles.kicker}>Private planning</p>
            <h2 id="invitation-source-heading">Invitation source</h2>
          </div>
          <dl>
            <div>
              <dt>Households invited by Bridget</dt>
              <dd>{dashboard.summary.householdsInvitedByBride}</dd>
            </div>
            <div>
              <dt>Households invited by Alessandro</dt>
              <dd>{dashboard.summary.householdsInvitedByGroom}</dd>
            </div>
            <div>
              <dt>Households invited by both</dt>
              <dd>{dashboard.summary.householdsInvitedByBoth}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.tableCard} aria-labelledby="offline-history-heading">
          <div className={styles.tableIntro}>
            <h2 id="offline-history-heading">Offline response history</h2>
            <p>Admin audit metadata only. It does not include RSVP answers, email, token, or request hash.</p>
          </div>
          {manualAudit.status === "unavailable" ? (
            <p className={styles.historyUnavailable} role="status">
              Offline response history is unavailable. The RSVP response dashboard remains available.
            </p>
          ) : manualAudit.events.length === 0 ? (
            <p className={styles.empty}>No offline responses have been recorded.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead><tr>
                  <th>Household</th><th>Admin Clerk ID</th><th>Received by</th>
                  <th>Reason</th><th>Revision</th><th>Recorded</th>
                </tr></thead>
                <tbody>
                  {manualAudit.events.map((event) => (
                    <tr key={`${event.householdId}-${event.revision}`}>
                      <td>{householdNames.get(event.householdId) ?? "Household not currently listed"}</td>
                      <td><code>{event.actorId}</code></td>
                      <td>{manualProvenanceLabels[event.provenance]}</td>
                      <td>{manualReasonLabels[event.recordingReason]}</td>
                      <td>{event.revision}</td>
                      <td>{formatDate(event.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableIntro}>
            <h2>Guest details</h2>
            <p>The export contains personal data. Share only when necessary.</p>
          </div>

          {dashboard.rows.length === 0 ? (
            <p className={styles.empty}>There are no invited households yet.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Household</th>
                    <th>Guest</th>
                    <th>Response</th>
                    <th>Menu</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.rows.map((row, index) => {
                    const firstRowForHousehold =
                      index === 0 ||
                      dashboard.rows[index - 1]?.householdId !== row.householdId;
                    const householdSize = Math.max(row.householdSize, 1);

                    return (
                      <tr key={`${row.householdId}-${row.inviteeId ?? "empty"}`}>
                        {firstRowForHousehold ? (
                          <td rowSpan={householdSize}>
                            <strong>{row.householdName}</strong>
                            <br />
                            <span className={styles.householdMeta}>
                              {row.householdSize === 0
                                ? "Household without named guests"
                                : row.householdSize === 1
                                ? "1 person in the household"
                                : `${row.householdSize} people in the household`}
                            </span>
                            <br />
                            <span
                              className={styles.sourceTag}
                              data-source={row.invitedBy}
                            >
                              {sourceLabels[row.invitedBy]}
                            </span>
                            <br />
                            <span className={styles.muted}>
                              {row.preferredLocale.toUpperCase()} ·{" "}
                              {row.householdStatus}
                            </span>
                            {row.contactEmail ? (
                              <>
                                <br />
                                <a
                                  className={styles.emailLink}
                                  href={`mailto:${row.contactEmail}`}
                                >
                                  {row.contactEmail}
                                </a>
                              </>
                            ) : null}
                            {row.hasChildren ? (
                              <span className={styles.guestDetail}>
                                Children attending · no identifying data collected
                              </span>
                            ) : null}
                            {row.allowPlusOne ? (
                              <span className={styles.guestDetail}>
                                One unnamed companion is authorized
                              </span>
                            ) : null}
                          </td>
                        ) : null}
                        <td>
                          {row.inviteeName ?? "—"}
                          {row.guestType ? (
                            <span className={styles.guestTypeBadge}>
                              {guestTypeLabels[row.guestType]}
                            </span>
                          ) : null}
                          {row.changedInLatestSubmission ? (
                            <span className={styles.changeBadge}>
                              Changed in the latest submission
                            </span>
                          ) : null}
                        </td>
                        <td>
                          {row.attendance ? (
                            <span
                              className={
                                row.attendance === "yes"
                                  ? styles.statusYes
                                  : styles.statusNo
                              }
                            >
                              {attendanceLabels[row.attendance]}
                            </span>
                          ) : (
                            <span className={styles.statusPending}>
                              Pending
                            </span>
                          )}
                        </td>
                        <td>
                          {row.mealPreference
                            ? mealLabels[row.mealPreference]
                            : row.attendance === "yes"
                              ? "To be selected later"
                              : "—"}
                        </td>
                        <td>{formatDate(row.responseUpdatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
