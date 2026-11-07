import Link from "next/link";

import adminStyles from "@/app/admin/admin.module.css";
import { requireRsvpAdmin } from "@/lib/admin/auth";
import ImportedHouseholdActivationPreview from "./ImportedHouseholdActivationPreview";
import styles from "./invitations.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ImportedInvitationsPage() {
  await requireRsvpAdmin();

  return (
    <main className={adminStyles.page}>
      <div className={adminStyles.shell}>
        <Link href="/admin/rsvp">RSVP Dashboard</Link>
        <header className={adminStyles.header}>
          <div>
            <p className={adminStyles.kicker}>Private administration</p>
            <h1>Imported invitation activation</h1>
          </div>
        </header>

        <section className={styles.panel} aria-labelledby="activation-heading">
          <h2 id="activation-heading">Review existing households</h2>
          <p>
            This preview checks approved Household UUID mappings and compares
            each imported roster with the existing RSVP records.
          </p>
          <p className={styles.notice}>
            Preview only. It does not activate households, create invitations,
            generate tokens or QR codes, or send communications.
          </p>
          <ImportedHouseholdActivationPreview />
        </section>
      </div>
    </main>
  );
}
