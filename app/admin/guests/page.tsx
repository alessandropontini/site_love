import Link from "next/link";
import { requireRsvpAdmin } from "@/lib/admin/auth";
import { recentRuns, snapshot, lastSuccessfulSync } from "@/lib/guest-sync/db";
import GuestListSynchronization from "./GuestListSynchronization";
import styles from "./sync.module.css";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function GuestsPage() {
  await requireRsvpAdmin();
  let data;
  try {
    const [database, runs, lastSync] = await Promise.all([
      snapshot(),
      recentRuns(),
      lastSuccessfulSync()
    ]);
    data = { database, runs, lastSync };
  } catch {
    return (
      <main className={styles.page}>
        <Link href="/admin/rsvp">RSVP Dashboard</Link>
        <h1>Guest List Synchronization</h1>
        <p>
          Synchronization database unavailable. Configure
          GUEST_SYNC_DATABASE_URL and apply the migrations before continuing.
        </p>
      </main>
    );
  }
  return (
    <main className={styles.page}>
      <Link href="/admin/rsvp">RSVP Dashboard</Link>
      <GuestListSynchronization
        databaseCount={data.database.data.inviteeCount}
        lastSync={data.lastSync}
      />
      <section className={styles.panel}>
        <h2>Synchronization History</h2>
        <p>
          Latest 20 batches. Only counts and operational metadata are retained.
        </p>
        <div className={styles.scroll}>
          <table>
            <thead>
              <tr>
                <th>Batch / time</th>
                <th>Executed by</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Unchanged</th>
                <th>Missing</th>
                <th>Errors</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.map((run) => (
                <tr key={run.id}>
                  <td>
                    {run.id}
                    <br />
                    {new Date(run.created_at).toLocaleString("en-GB", {
                      timeZone: "Europe/Rome"
                    })}
                  </td>
                  <td>{run.actor_id}</td>
                  <td>
                    {run.status}
                    {run.error_code ? ` · ${run.error_code}` : ""}
                  </td>
                  <td>{run.created_records}</td>
                  <td>{run.updated_records}</td>
                  <td>{run.unchanged_records}</td>
                  <td>{run.missing_records}</td>
                  <td>{run.validation_errors}</td>
                  <td>{run.duration_ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.runs.length && <p>No synchronization batches yet.</p>}
      </section>
    </main>
  );
}
