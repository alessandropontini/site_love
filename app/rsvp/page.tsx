import Link from "next/link";

import styles from "./rsvp.module.css";

export default function RsvpInstructionsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.noticeCard} aria-labelledby="rsvp-heading">
        <p className={styles.kicker}>Alessandro &amp; Bridget</p>
        <h1 id="rsvp-heading">Conferma la tua presenza</h1>
        <p>
          Per aprire il tuo invito usa il QR code o il collegamento personale
          ricevuto insieme all’invito. Questo indirizzo non contiene un invito
          generico.
        </p>
        <p className={styles.englishCopy} lang="en">
          Use the personal QR code or link included with your invitation to
          open your RSVP.
        </p>
        <Link className={styles.secondaryAction} href="/">
          Torna al sito
        </Link>
      </section>
    </main>
  );
}
