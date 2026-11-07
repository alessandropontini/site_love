import Link from "next/link";

import styles from "@/app/admin/admin.module.css";
import { requireRsvpAdmin } from "@/lib/admin/auth";
import { getAdminRsvpDashboard } from "@/lib/rsvp/db";
import ManualResponseForm, { type ManualHouseholdChoice } from "./ManualResponseForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ManualRsvpPage() {
  await requireRsvpAdmin();
  const result = await getAdminRsvpDashboard();

  if (result.status === "unavailable") {
    return (
      <main className={styles.page}>
        <section className={styles.noticeCard}>
          <p className={styles.kicker}>RSVP Administration</p>
          <h1>Database not connected</h1>
          <p>Access is protected. Configure the RSVP database to review offline responses.</p>
          <Link href="/admin/rsvp">Back to RSVP responses</Link>
        </section>
      </main>
    );
  }

  const households = new Map<string, ManualHouseholdChoice>();
  for (const row of result.dashboard.rows) {
    if (!households.has(row.householdId)) {
      households.set(row.householdId, {
        id: row.householdId,
        name: row.householdName,
        size: row.householdSize,
        revision: row.responseVersion,
        status: row.householdStatus
      });
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Private administration · offline response</p>
            <h1>Record an RSVP</h1>
          </div>
          <div className={styles.actions}>
            <Link className={styles.secondaryAction} href="/admin/rsvp">RSVP responses</Link>
            <Link className={styles.secondaryAction} href="/admin/guests">Guest sync</Link>
          </div>
        </header>

        <p className={styles.muted}>
          Record an answer supplied by a respondent in person, by phone, message, or on paper.
          This does not send an invitation or notification.
        </p>
        <ManualResponseForm households={[...households.values()]} />
      </div>
    </main>
  );
}
