# Privacy e conservazione RSVP

Questa guida traduce in scelte operative i principi di minimizzazione,
limitazione della finalità, conservazione limitata, integrità e riservatezza
richiamati dal [Garante Privacy](https://www.garanteprivacy.it/home/principi-fondamentali-del-trattamento)
e dall'[articolo 5 GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/2016-05-04/eng).
Non sostituisce una verifica legale della situazione concreta.

## Dati ammessi

- nome mostrato nell'invito;
- appartenenza al nucleo invitato;
- email di contatto del nucleo, usata soltanto per conferme e promemoria;
- provenienza organizzativa del nucleo invitato: sposa, sposo o entrambi;
- presenza o assenza;
- autorizzazione per nucleo e nome/cognome dell'eventuale +1 non già nominato;
- sola indicazione sì/no sulla presenza di figli, senza dati anagrafici;
- scelta strutturata del menu, soltanto nella seconda fase;
- lingua, scadenza e timestamp tecnici;
- token casuale soltanto come hash server-side;
- audit tecnico privo del contenuto della risposta.

Il form non raccoglie telefono, indirizzo, documento, data di nascita o testo
libero su allergie, disabilità o salute. Le esigenze particolari vengono
gestite direttamente fuori dal sito. Se in futuro si volesse raccoglierle
online, servono una decisione separata sulla necessità, la base giuridica,
l'informativa, il consenso ove applicabile e gli accessi.

Chi compila per un +1 deve essere autorizzato a comunicarne nome e cognome e
rendere disponibile l'informativa anche a quella persona. Il sito non raccoglie
nomi, età o date di nascita dei figli, non è offerto direttamente ai minori e
non crea account per loro.

Una coppia con entrambi i nomi già presenti nell'invito non usa il campo +1.
Il campo compare esclusivamente per i nuclei con `allow_plus_one = true`.

## Inquadramento GDPR da confermare

L'articolo 2, paragrafo 2, lettera c) e il considerando 18 GDPR escludono le
attività esclusivamente personali o domestiche senza connessione commerciale o
professionale. Un matrimonio privato può rientrare in questo ambito, mentre i
fornitori che mettono a disposizione i mezzi tecnici restano soggetti ai propri
obblighi. Poiché l'applicazione concreta dell'esenzione dipende dalle modalità
reali di utilizzo e condivisione, prima della raccolta reale va confermata con
una persona competente. In via prudenziale il progetto applica comunque
minimizzazione, trasparenza, sicurezza, diritti e cancellazione programmata.

Se il GDPR risulta applicabile al trattamento della coppia, l'informativa deve
indicare almeno: identità e contatto dei titolari; finalità e base giuridica;
eventuale interesse legittimo; dati obbligatori e conseguenze del mancato
conferimento; destinatari e responsabili; trasferimenti extra SEE e garanzie;
conservazione; diritti e reclamo al Garante; origine dei dati ricevuti da un
altro componente del nucleo; assenza di profilazione o decisioni automatizzate.
Il semplice checkbox “ho letto” documenta la presa visione e non viene descritto
come consenso.

Le informazioni su allergie o salute rientrano nelle categorie particolari
dell'articolo 9 GDPR. Per questo non vengono raccolte dal form. Se diventassero
necessarie, servirebbero una base dell'articolo 6, una condizione dell'articolo
9 (spesso consenso esplicito nel contesto concreto), accessi più ristretti e
un'informativa specifica.

Riferimenti ufficiali: [GDPR su EUR-Lex](https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX%3A32016R0679),
[principi del Garante](https://www.garanteprivacy.it/home/principi-fondamentali-del-trattamento),
[minori secondo EDPB](https://www.edpb.europa.eu/topics/key-gdpr-concepts/children_en)
e [linee guida cookie del Garante](https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/9677876).

## Accessi e condivisione

- Gli invitati vedono soltanto il proprio nucleo tramite token personale.
- La provenienza del nucleo è visibile soltanto agli sposi nella dashboard e
  nell'export privato; non viene mostrata nel form dell'invitato e non varia tra
  i componenti dello stesso nucleo.
- Il possesso del token consente modifica fino alla scadenza: va trattato come
  una credenziale e può essere revocato/reemesso.
- Gli sposi accedono tramite Clerk e allowlist email. Ogni pagina, route di
  export e azione server verifica autonomamente l'autorizzazione.
- Location o catering ricevono soltanto l'export minimo necessario e tramite un
  canale privato concordato. Non ricevono token, audit o accessi al database.
- Non sono ammessi analytics, session replay o pixel pubblicitari sulle route
  RSVP.

## Immagini del menu

Le fotografie illustrative dei piatti sono originali, statiche e conservate nel
repository senza EXIF o GPS. Non raffigurano persone, non incorporano dati RSVP
e non richiedono servizi fotografici o tracker esterni quando vengono aperte.

## Conservazione approvata

Data matrimonio: 13 maggio 2028. Tutti i dati personali RSVP, email, audit,
manifest, QR operativi, export e backup saranno cancellati entro l'11 agosto
2028, 90 giorni dopo l'evento. Impostare un promemoria operativo: il codice non
deve fingere che la cancellazione sia automatica.

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
- contratto, regione e conservazione effettiva di Resend prima di attivare le
  email automatiche, mantenendo disabilitati open e click tracking;
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
