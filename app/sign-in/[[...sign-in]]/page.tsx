import { ClerkProvider, SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

import styles from "@/app/admin/admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accesso sposi — Alessandro & Bridget",
  robots: { index: false, follow: false, nocache: true }
};

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className={styles.page}>
        <section className={styles.noticeCard}>
          <p className={styles.kicker}>Area privata</p>
          <h1>Accesso non ancora configurato</h1>
          <p>Completa la configurazione Clerk prima di usare quest’area.</p>
        </section>
      </main>
    );
  }

  return (
    <ClerkProvider telemetry={false}>
      <main className={styles.signInPage}>
        <SignIn
          forceRedirectUrl="/admin/rsvp"
          transferable={false}
          withSignUp={false}
        />
      </main>
    </ClerkProvider>
  );
}
