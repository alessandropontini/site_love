import type { Metadata } from "next";

import styles from "@/app/privacy/privacy.module.css";
import { RSVP_PRIVACY_NOTICE_VERSION } from "@/lib/rsvp/privacy";

export const metadata: Metadata = {
  title: "Informativa dati RSVP — Alessandro & Bridget",
  description:
    "Informativa sul trattamento dei dati usati per gli inviti e le risposte RSVP."
};

const controllerNames =
  process.env.NEXT_PUBLIC_PRIVACY_CONTROLLER_NAMES?.trim() ||
  "Alessandro e Bridget";
const privacyContactEmail =
  process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim() || "";
const privacyConfigurationComplete = Boolean(
  process.env.NEXT_PUBLIC_PRIVACY_CONTROLLER_NAMES?.trim() &&
    privacyContactEmail
);
const isTrialMode = process.env.NEXT_PUBLIC_RSVP_TRIAL_MODE !== "0";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <p className={styles.kicker}>
          Informativa RSVP · versione {RSVP_PRIVACY_NOTICE_VERSION}
        </p>
        <h1>Informativa sul trattamento dei dati personali</h1>
        <p className={styles.lead}>
          Questa informativa descrive in modo trasparente come vengono usati i
          dati necessari a gestire gli inviti e le risposte per il matrimonio
          del 13 maggio 2028. Non vengono svolte attività pubblicitarie,
          profilazione commerciale, vendita di dati o decisioni automatizzate.
        </p>

        <section>
          <h2>1. Organizzatori e recapito</h2>
          <p>
            Il trattamento è organizzato da <strong>{controllerNames}</strong>,
            in qualità di persone fisiche che curano il proprio matrimonio e,
            ove la normativa risultasse applicabile alla specifica operazione,
            di titolari del trattamento.
          </p>
          <p>
            Per domande, correzioni o richieste relative ai dati è possibile
            usare il canale privato con cui è stato ricevuto l’invito
            {privacyContactEmail ? (
              <>
                {" "}oppure scrivere a{" "}
                <a href={`mailto:${privacyContactEmail}`}>
                  {privacyContactEmail}
                </a>
              </>
            ) : null}
            . Non è stato nominato un responsabile della protezione dei dati
            (DPO), non ricorrendone i presupposti per questa attività personale.
          </p>
        </section>

        <section>
          <h2>2. Ambito personale e base del trattamento</h2>
          <p>
            L’attività è svolta da persone fisiche per finalità esclusivamente
            personali e familiari, senza collegamento con attività commerciali
            o professionali. È pertanto progettata per rientrare nell’ambito
            personale o domestico previsto dall’articolo 2, paragrafo 2,
            lettera c), e dal considerando 18 del Regolamento (UE) 2016/679.
          </p>
          <p>
            Questa informativa viene comunque fornita volontariamente secondo i
            criteri di trasparenza degli articoli 13 e 14. Qualora il GDPR fosse
            applicabile a una specifica operazione, la base giuridica sarebbe il
            legittimo interesse degli organizzatori a gestire un evento privato
            al quale l’interessato è invitato, ai sensi dell’articolo 6,
            paragrafo 1, lettera f). Tale interesse è limitato da minimizzazione,
            accesso riservato, durata prestabilita e possibilità di rispondere
            anche attraverso il canale privato dell’invito.
          </p>
          <p>
            La casella presente nel modulo documenta soltanto la lettura di
            questa informativa: non costituisce consenso per marketing o per
            finalità ulteriori.
          </p>
        </section>

        <section>
          <h2>3. Dati, fonti e persone interessate</h2>
          <p>
            Per ciascun nucleo possono essere trattati: nomi già inclusi
            nell’invito; provenienza organizzativa dell’invito; lingua; email di
            contatto; presenza o assenza; data e versione degli aggiornamenti;
            autorizzazione a un eventuale +1; nome e cognome del +1 soltanto se
            ammesso dallo specifico invito; indicazione sì/no sulla presenza di
            figli. In una fase successiva potranno essere richieste scelte di
            menu non sanitarie.
          </p>
          <p>
            I nomi degli invitati derivano dalla conoscenza personale degli
            organizzatori o dalle indicazioni familiari usate per comporre la
            lista. Email e risposte sono fornite dalla persona che compila il
            modulo. Per i figli non vengono raccolti nomi, cognomi, età o date
            di nascita. Il token del link personale è conservato nel database
            soltanto come hash non reversibile.
          </p>
        </section>

        <section>
          <h2>4. Finalità</h2>
          <p>I dati vengono utilizzati esclusivamente per:</p>
          <ul>
            <li>predisporre e distribuire gli inviti personali;</li>
            <li>registrare e consentire la modifica delle presenze;</li>
            <li>organizzare posti, capienza e successive scelte di menu;</li>
            <li>inviare conferme e promemoria strettamente organizzativi;</li>
            <li>proteggere il modulo da abusi e accessi non autorizzati;</li>
            <li>produrre un elenco minimo per location o catering, se necessario.</li>
          </ul>
        </section>

        <section>
          <h2>5. Conferimento e conseguenze del mancato invio</h2>
          <p>
            Rispondere online è facoltativo. Email e indicazione di presenza
            sono necessarie soltanto per registrare la risposta attraverso il
            sito e inviare comunicazioni organizzative. Chi non desidera usare
            il modulo può contattare gli organizzatori tramite il canale privato
            dell’invito. Il mancato conferimento non produce conseguenze diverse
            dall’impossibilità di gestire online la risposta.
          </p>
        </section>

        <section>
          <h2>6. +1, coppie e figli</h2>
          <p>
            Se due persone sono già nominate nell’invito, entrambe sono già
            incluse e non devono essere aggiunte come +1. Il campo +1 appare
            soltanto quando lo specifico nucleo è autorizzato a indicare un
            accompagnatore non ancora nominato. Chi inserisce nome e cognome di
            tale persona deve essere autorizzato a comunicarli e deve renderle
            disponibile questa informativa.
          </p>
          <p>
            Per i figli viene conservata esclusivamente l’indicazione sì/no
            della loro presenza. Il modulo non è rivolto direttamente ai minori
            e non chiede loro dati, account o azioni.
          </p>
        </section>

        <section>
          <h2>7. Destinatari e fornitori tecnici</h2>
          <p>
            I dati RSVP sono visibili soltanto agli organizzatori attraverso
            un’area amministrativa con login e lista di accesso. Possono essere
            comunicati, nel minimo necessario, a location e catering per
            organizzare presenze, posti e pasti; non vengono diffusi
            pubblicamente.
          </p>
          <p>
            Il sito usa Vercel per l’hosting e l’esecuzione dell’applicazione,
            Neon per il database configurato nella regione UE di Francoforte,
            Cloudflare Turnstile per la prevenzione degli abusi e Clerk per
            autenticare esclusivamente gli amministratori. Turnstile tratta
            segnali tecnici del dispositivo e della richiesta, ma non i campi
            RSVP inseriti nel modulo. Resend sarà utilizzato per le email
            organizzative solo dopo la sua attivazione e la verifica degli
            accordi applicabili.
          </p>
        </section>

        <section>
          <h2>8. Trasferimenti internazionali</h2>
          <p>
            Alcuni fornitori o loro subfornitori possono trattare dati tecnici o
            dati ospitati anche fuori dallo Spazio economico europeo. Ove il
            GDPR risulti applicabile, le garanzie dichiarate dai fornitori
            includono, secondo il servizio e il piano effettivamente attivato,
            decisioni di adeguatezza come l’EU-US Data Privacy Framework e/o le
            clausole contrattuali standard approvate dalla Commissione europea.
            Prima dell’uso con invitati reali gli organizzatori verificheranno
            che piani, DPA, subfornitori e meccanismi di trasferimento siano
            effettivamente applicabili agli account utilizzati.
          </p>
        </section>

        <section>
          <h2>9. Conservazione</h2>
          <p>
            I dati personali RSVP, le email, gli inviti operativi, i token, i
            QR, gli export e gli eventuali backup verranno cancellati entro
            l’11 agosto 2028, cioè 90 giorni dopo il matrimonio. Log tecnici o
            copie residue dei fornitori potranno seguire i tempi strettamente
            necessari alla sicurezza, al ripristino e agli obblighi previsti
            dai rispettivi servizi, dopodiché saranno cancellati o resi anonimi.
          </p>
        </section>

        <section>
          <h2>10. Sicurezza, cookie e dati esclusi</h2>
          <p>
            Sono utilizzati HTTPS, token personali casuali, hash non
            reversibili, controlli lato server, protezione anti-indicizzazione,
            limiti agli aggiornamenti, autenticazione separata e accessi
            amministrativi limitati. Le pagine RSVP non usano cookie
            pubblicitari, profilazione o analytics. Possono essere presenti
            soltanto tecnologie tecniche necessarie a sicurezza e accesso
            amministrativo.
          </p>
          <p>
            Non inserire allergie, diagnosi, disabilità o altre informazioni
            sanitarie. Se tali informazioni diventassero necessarie, verranno
            gestite separatamente con un canale e un’informazione specifici.
          </p>
        </section>

        <section>
          <h2>11. Diritti e reclamo</h2>
          <p>
            Ove applicabili, l’interessato può chiedere accesso, rettifica,
            cancellazione, limitazione, portabilità oppure opporsi al
            trattamento. La risposta può inoltre essere corretta dal link
            personale fino alla scadenza. Le richieste vanno inviate al
            recapito indicato nella sezione 1 e riceveranno riscontro senza
            ingiustificato ritardo.
          </p>
          <p>
            È possibile proporre reclamo al{" "}
            <a
              href="https://www.garanteprivacy.it/"
              rel="noreferrer"
              target="_blank"
            >
              Garante per la protezione dei dati personali
            </a>
            . Non vengono svolte decisioni automatizzate né profilazione.
          </p>
        </section>

        <section>
          <h2>12. Aggiornamenti</h2>
          <p>
            L’informativa può essere aggiornata se cambiano il modulo, i
            fornitori o le modalità organizzative. La versione letta al momento
            dell’invio viene registrata nell’audit tecnico della risposta,
            insieme alla data dell’operazione, senza creare un consenso per
            finalità ulteriori.
          </p>
        </section>

        <section lang="en">
          <h2>English version</h2>
          <p>
            The complete English notice is available on the{" "}
            <a href="/privacy/en">English privacy page</a>.
          </p>
        </section>

        {isTrialMode ? (
          <p className={styles.legalNote}>
            Versione di prova: il recapito indicato è provvisorio e il sito non
            deve ancora essere usato per invitati reali. Prima del lancio
            verificheremo identità e contatto definitivi, DPA, subfornitori e
            trasferimenti dei piani effettivamente utilizzati.
          </p>
        ) : !privacyConfigurationComplete ? (
          <p className={styles.legalNote}>
            Prima di raccogliere dati di invitati reali è obbligatorio
            configurare in Vercel i nomi completi degli organizzatori e un
            indirizzo email privacy diretto.
          </p>
        ) : null}
      </article>
    </main>
  );
}
