import type { Metadata } from "next";

import styles from "@/app/privacy/privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy RSVP — Alessandro & Bridget",
  description: "Come vengono usati e protetti i dati del flusso RSVP."
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <p className={styles.kicker}>Informazioni RSVP · aggiornate il 22 agosto 2026</p>
        <h1>Come usiamo i dati dell’invito</h1>
        <p className={styles.lead}>
          Il sito serve esclusivamente a organizzare il matrimonio di Alessandro
          e Bridget. La risposta è facoltativa e non viene usata per pubblicità,
          profilazione o vendita di dati.
        </p>

        <section>
          <h2>Dati raccolti</h2>
          <p>
            Per ogni persona invitata salviamo nome, presenza o assenza,
            preferenza tra i menu proposti e data dell’ultimo aggiornamento. Il
            link personale viene conservato nel database soltanto come hash. Il
            form non richiede email, telefono o note sanitarie libere.
          </p>
        </section>

        <section>
          <h2>Perché e chi può vederli</h2>
          <p>
            I dati servono a preparare posti e pasti. Possono consultarli solo
            Alessandro e Bridget tramite un’area separata con login e allowlist.
            Un export minimo può essere condiviso con location o catering quando
            strettamente necessario all’organizzazione.
          </p>
        </section>

        <section>
          <h2>Servizi tecnici e sicurezza</h2>
          <p>
            Vercel ospita l’applicazione, Neon conserva le risposte, Cloudflare
            Turnstile limita gli abusi e Clerk protegge soltanto l’area degli
            amministratori. I link RSVP non vengono inviati a strumenti di
            analytics. Usiamo HTTPS, token casuali, controlli server-side,
            intestazioni anti-indicizzazione, limiti di aggiornamento e backup
            ad accesso ristretto.
          </p>
        </section>

        <section>
          <h2>Conservazione e correzione</h2>
          <p>
            La regola operativa proposta è cancellare risposte, inviti, audit ed
            eventuali backup entro l’11 agosto 2028, cioè 90 giorni dopo il
            matrimonio. Fino ad allora il nucleo può correggere la risposta dal
            proprio link entro la scadenza RSVP oppure contattarci attraverso lo
            stesso canale con cui ha ricevuto l’invito.
          </p>
        </section>

        <section lang="en">
          <h2>English summary</h2>
          <p>
            We collect invited names, attendance, structured meal preferences,
            and update timestamps only to organise the wedding. We do not ask
            for email addresses, phone numbers, or free-text health notes. Access
            is restricted to Alessandro and Bridget, and the proposed deletion
            date is 11 August 2028. To correct or remove a response, contact us
            through the same channel used for the invitation.
          </p>
        </section>

        <p className={styles.legalNote}>
          Prima del lancio questa pagina va completata con il contatto definitivo,
          la base giuridica e le impostazioni territoriali/contrattuali dei
          fornitori, come indicato nella checklist di progetto.
        </p>
      </article>
    </main>
  );
}
