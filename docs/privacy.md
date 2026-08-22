# Privacy e conservazione RSVP

Questa guida traduce in scelte operative i principi di minimizzazione,
limitazione della finalità, conservazione limitata, integrità e riservatezza
richiamati dal [Garante Privacy](https://www.garanteprivacy.it/home/principi-fondamentali-del-trattamento)
e dall'[articolo 5 GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/2016-05-04/eng).
Non sostituisce una verifica legale della situazione concreta.

## Dati ammessi

- nome mostrato nell'invito;
- appartenenza al nucleo invitato;
- presenza o assenza;
- scelta strutturata del menu;
- lingua, scadenza e timestamp tecnici;
- token casuale soltanto come hash server-side;
- audit tecnico privo del contenuto della risposta.

Il form non raccoglie email, telefono, indirizzo, documento, data di nascita,
testo libero su allergie, disabilità o salute. Le esigenze particolari vengono
gestite direttamente fuori dal sito. Se in futuro si volesse raccoglierle
online, servono una decisione separata sulla necessità, la base giuridica,
l'informativa, il consenso ove applicabile e gli accessi.

## Accessi e condivisione

- Gli invitati vedono soltanto il proprio nucleo tramite token personale.
- Il possesso del token consente modifica fino alla scadenza: va trattato come
  una credenziale e può essere revocato/reemesso.
- Gli sposi accedono tramite Clerk e allowlist email. Ogni pagina, route di
  export e azione server verifica autonomamente l'autorizzazione.
- Location o catering ricevono soltanto l'export minimo necessario e tramite un
  canale privato concordato. Non ricevono token, audit o accessi al database.
- Non sono ammessi analytics, session replay o pixel pubblicitari sulle route
  RSVP.

## Conservazione proposta

Data matrimonio: 13 maggio 2028. Regola proposta: cancellare database RSVP,
audit, manifest, QR operativi, export e backup entro l'11 agosto 2028, 90 giorni
dopo l'evento. Confermare questa data prima del lancio e impostare un promemoria
operativo; il codice non deve fingere che la cancellazione sia automatica.

Prima della cancellazione:

1. verificare se esistono richieste di correzione o cancellazione aperte;
2. eliminare copie CSV e file temporanei da computer e servizi condivisi;
3. eliminare lo schema/database di produzione o anonimizzare ciò che serve
   davvero conservare;
4. eliminare backup, manifest e QR;
5. annotare data e responsabile dell'operazione senza conservare le risposte.

## Elementi da completare prima del lancio

- identità completa e contatto del titolare o dei titolari;
- base giuridica applicabile al caso concreto;
- destinatari effettivi e responsabili del trattamento;
- regioni scelte, eventuali trasferimenti extra SEE e relative garanzie;
- data/criterio definitivo di conservazione;
- modalità per accesso, rettifica, cancellazione e reclamo;
- testi italiano e inglese approvati della pagina `/privacy`.

La pagina pubblica attuale è una spiegazione trasparente provvisoria. Non
considerare chiusa la checklist finché questi elementi non sono stati verificati
e sostituiti con informazioni definitive.

## Risposta a un incidente

1. Revocare o ruotare immediatamente credenziali/database se sospette.
2. Disabilitare il nucleo o sostituire il token quando un link viene condiviso.
3. Conservare soltanto evidenze tecniche necessarie, senza copiare liste o token
   nei ticket.
4. Verificare accessi Clerk, log Vercel, audit Neon ed export recenti.
5. Valutare con una persona competente obblighi e tempi di comunicazione agli
   interessati e all'autorità; non improvvisare una notifica pubblica.
