import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

import styles from "@/app/admin/admin.module.css";
import { requireRsvpAdmin } from "@/lib/admin/auth";
import {
  invitationSourceLabels,
  mealPreferenceLabels
} from "@/lib/rsvp/display";
import { getAdminRsvpDashboard } from "@/lib/rsvp/db";
import type { Attendance } from "@/lib/rsvp/types";

export const dynamic = "force-dynamic";

const attendanceLabels: Record<Attendance, string> = {
  yes: "Presente",
  no: "Assente"
};

const mealLabels = mealPreferenceLabels.it;
const sourceLabels = invitationSourceLabels.it;

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("it-IT", {
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
          <p className={styles.kicker}>Gestione RSVP</p>
          <h1>Database non collegato</h1>
          <p>
            L’accesso è protetto, ma per vedere le risposte devi ancora impostare
            DATABASE_URL e applicare le migrazioni Neon.
          </p>
        </section>
      </main>
    );
  }

  const { dashboard } = result;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Ciao {admin.displayName}</p>
            <h1>Risposte RSVP</h1>
          </div>
          <div className={styles.actions}>
            <Link
              className={styles.primaryAction}
              href="/admin/rsvp/export"
              prefetch={false}
            >
              Esporta CSV
            </Link>
            <SignOutButton>
              <button className={styles.secondaryAction} type="button">
                Esci
              </button>
            </SignOutButton>
          </div>
        </header>

        <section aria-label="Riepilogo risposte" className={styles.summary}>
          <article>
            <strong>{dashboard.summary.households}</strong>
            <span>Nuclei invitati</span>
          </article>
          <article>
            <strong>{dashboard.summary.householdsResponded}</strong>
            <span>Nuclei con risposta completa</span>
          </article>
          <article>
            <strong>{dashboard.summary.invitees}</strong>
            <span>Persone invitate</span>
          </article>
          <article>
            <strong>{dashboard.summary.attending}</strong>
            <span>Presenze confermate</span>
          </article>
          <article>
            <strong>{dashboard.summary.householdsWithChanges}</strong>
            <span>Nuclei con modifiche</span>
          </article>
        </section>

        <section
          aria-labelledby="invitation-source-heading"
          className={styles.sourceSummary}
        >
          <div>
            <p className={styles.kicker}>Organizzazione privata</p>
            <h2 id="invitation-source-heading">Provenienza degli inviti</h2>
          </div>
          <dl>
            <div>
              <dt>Nuclei invitati da Bridget</dt>
              <dd>{dashboard.summary.householdsInvitedByBride}</dd>
            </div>
            <div>
              <dt>Nuclei invitati da Alessandro</dt>
              <dd>{dashboard.summary.householdsInvitedByGroom}</dd>
            </div>
            <div>
              <dt>Nuclei invitati da entrambi</dt>
              <dd>{dashboard.summary.householdsInvitedByBoth}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.tableCard}>
          <div className={styles.tableIntro}>
            <h2>Dettaglio invitati</h2>
            <p>L’export contiene dati personali: condividilo solo se necessario.</p>
          </div>

          {dashboard.rows.length === 0 ? (
            <p className={styles.empty}>Non ci sono ancora nuclei invitati.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nucleo</th>
                    <th>Invitato</th>
                    <th>Risposta</th>
                    <th>Menu</th>
                    <th>Aggiornata</th>
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
                                ? "Nucleo senza componenti"
                                : row.householdSize === 1
                                ? "1 persona nel nucleo"
                                : `${row.householdSize} persone nello stesso nucleo`}
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
                          </td>
                        ) : null}
                        <td>
                          {row.inviteeName ?? "—"}
                          {row.changedInLatestSubmission ? (
                            <span className={styles.changeBadge}>
                              Modificata nell’ultimo invio
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
                              In attesa
                            </span>
                          )}
                        </td>
                        <td>
                          {row.mealPreference
                            ? mealLabels[row.mealPreference]
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
