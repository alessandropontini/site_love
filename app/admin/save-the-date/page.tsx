import Link from "next/link";

import adminStyles from "@/app/admin/admin.module.css";
import { requireRsvpAdmin } from "@/lib/admin/auth";
import SaveTheDateReview from "./SaveTheDateReview";
import styles from "./save-the-date.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SaveTheDatePage() {
  await requireRsvpAdmin();

  return (
    <main className={adminStyles.page}>
      <div className={adminStyles.shell}>
        <Link href="/admin/rsvp">RSVP Dashboard</Link>
        <header className={adminStyles.header}>
          <div>
            <p className={adminStyles.kicker}>Private administration</p>
            <h1>Save the Date review</h1>
          </div>
        </header>

        <section className={styles.panel} aria-labelledby="save-the-date-heading">
          <h2 id="save-the-date-heading">Imported household planning</h2>
          <p>
            Review the exact Household UUID mapping, prepare one draft, then
            separately record a manual outcome. SITE LOVE never sends the message.
          </p>
          <p className={styles.notice}>
            Loading the preview reads the configured source and database. No
            household, invitation, token, QR code or RSVP answer is changed.
          </p>
          <SaveTheDateReview />
        </section>
      </div>
    </main>
  );
}
