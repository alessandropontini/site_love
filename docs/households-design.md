# STEP 4 — Nuclei familiari: proposta di schema e implementazione

Stato strutturale registrato al 30 ottobre 2026: struttura approvata e creata nel foglio originale. Households contiene le sette intestazioni previste; Guest List contiene Household UUID e Host Sync UUID nelle colonne P e Q. Nessun nucleo o identificativo assegnato: le celle dati nuove erano vuote alla verifica. Verificati intestazioni, formato e convalide tramite rilettura API. La modalità non è attivata nel runtime e non è integrata con Preview/Apply. Nessuna migrazione applicata. Il codice nome/cognome resta invariato.

## Step 9C.1 — lettura e validazione preparatoria

Implementato sul branch `feat/roadmap-recovery-20261106` dopo il commit
`9c9b2fb`:

- `lib/guest-sync/google.ts` espone `readSheets()` per leggere entrambe le schede
  con lo scope Google `spreadsheets.readonly`; `readSheet()` conserva il
  contratto legacy a singola scheda usato dal workflow corrente.
- `lib/guest-sync/model.ts` definisce le intestazioni e il parser isolato
  `parseHouseholdSheets()`. La selezione passa da `parseGuestSheets(...,
  "household_uuid")`; l’omissione della modalità seleziona sempre `legacy`.
- Il parser controlla UUID household mancanti/duplicati, riferimenti sconosciuti,
  proprietario ed etichetta non coerenti, UUID guest duplicati, relazioni Host e
  referente, posti incompleti, roster minimo e riferimenti a bambini/+1 anonimi.
  Gli UUID distinti con la stessa etichetta rimangono distinti e producono un
  avviso; l’UUID, non l’etichetta, è la chiave del modello.
- Rinomina dell’etichetta con UUID invariato produce la stessa identità di
  sorgente; il confronto con la mappatura persistita è rimandato agli step
  9C.2/9C.3. Il parser non deduce un referente o un ospitante.
- Email e telefono vengono validati ma esclusi dall’oggetto restituito. Il
  modello non è collegato a snapshot DB, Preview o Apply e non importa dati in
  Neon.
- Nuove colonne e nuova scheda non attivano automaticamente la modalità; il
  flusso legacy continua a chiamare `readSheet()` e `parseSheet()`.

Test fittizi in `tests/guest-sync/households.test.cjs` e il test dell’adapter
Google in `tests/guest-sync/google.test.cjs` coprono struttura e compatibilità.
Questa consegna non implementa la migrazione, la riconciliazione dei nuclei
esistenti, la modalità household nel batch Preview/Apply, né l’attivazione degli
inviti. Nessuna lettura/scrittura del foglio reale o di Neon è stata eseguita.

## Step 9C.2 — integrazione della modalità nella Preview

Implementato sul branch `feat/roadmap-recovery-20261106`:

- `GUEST_SYNC_MODE=household_uuid` seleziona esplicitamente il lettore a due
  schede e il parser; in assenza del valore esatto resta attivo il percorso
  legacy. Non viene effettuato fallback se la modalità UUID è selezionata ma la
  scheda Households non è disponibile o valida.
- `buildPlan()` usa Household UUID per separare i nuclei. Etichette identiche
  non fondono gruppi. Le righe Preview mostrano il conteggio sorgente; le note
  chiariscono che i nuclei nuovi non sono creati né adottati durante Preview.
- Nuclei Neon già mappati si correlano soltanto attraverso Sync UUID già
  persistiti. Mapping ambiguo, nucleo senza mapping, roster divergente, cambio
  di appartenenza, risposta o invito emesso producono errori bloccanti. Non si
  adottano record per nome, cognome o etichetta.
- La ricevuta HMAC vincola modalità e contenuto di entrambe le schede; Apply
  rilegge le due schede e ricalcola il piano prima di procedere. Il flusso legacy
  resta il default.
- La modalità UUID non mostra conferma e non consente Apply finché il runtime DB
  basato sul mapping non è completato. La scrittura Neon per nuovi nuclei, il
  mapping UUID esterno → ID Neon e le relative garanzie transazionali sono 9C.3.
  L'ambiente reale non è stato contattato e nessuna migrazione è stata applicata.

Test fittizi aggiunti per identità separate, blocco di adozione per etichetta e
invalidazione della ricevuta se cambia una delle due schede. La suite locale
risulta 90 pass e 2 test PostgreSQL saltati per assenza del database isolato.

## Verifica dello step 4 — 31 ottobre 2026

Rilettura del foglio originale in sola lettura: Households contiene soltanto le
sette intestazioni; Household UUID e Host Sync UUID sono ancora vuoti. Guest
name resta il nome proprio e Surname il cognome: nessuna colonna First name da
aggiungere. Il commit degli step 1–3 è `c457862`.

La proposta concreta comprende 29 nuclei e 62 Sync UUID distinti: 39 adulti
nominativi, 19 posti +1 e 4 posti bambino. Le 11 righe provvisorie rimangono
escluse. Ogni gruppo ha un proprietario coerente e ogni gruppo con +1 ha un solo
adulto nominativo. Questi controlli verificano la struttura, non confermano che
le appartenenze organizzative siano quelle desiderate dagli sposi.

La mappa completa è stata preparata come documento privato fuori dal repository,
con appartenenze per Sync UUID e 19 collegamenti ospitante proposti da confermare.
Non riportare qui nomi, elenco UUID, recapiti o copie del foglio. Nessun nuovo
UUID è stato generato o scritto. La proposta lascia vuoti referente, contatti e
lingua; non ricava il referente automaticamente dalla presenza di un solo adulto.

L'assegnazione dei nuclei proposta è una scrittura organizzativa sul foglio,
non un import e non una riconciliazione con Neon. L'attivazione nel runtime
richiede gli interventi della sezione implementazione, verificati separatamente.
In particolare, finché il codice attuale raggruppa per Party / family, non
rinominare o spostare nuclei assumendo che le nuove colonne siano già operative.

## Principio

Un household rappresenta le persone destinatarie dello stesso invito, anche se hanno cognomi diversi o non convivono. Due gruppi con lo stesso cognome non sono automaticamente un unico household. La parentela non determina l'appartenenza: conta la decisione organizzativa degli sposi.

Ogni invitato/posto mantiene il proprio Sync UUID. Un nuovo Household UUID esterno identifica il nucleo nel foglio. L'ID interno rsvp.households.id e gli ID degli invitati in Neon rimangono distinti e vengono conservati: nessuno viene rigenerato o derivato da nomi, cognomi o numeri di riga.

## Scheda Households proposta

Una riga per nucleo; intestazioni esatte:

| Campo | Obbligatorietà | Regola |
| --- | --- | --- |
| Household UUID | Obbligatorio per nuclei pronti alla sincronizzazione | UUID permanente assegnato una volta, protetto; nessuna formula dipendente dalla posizione. |
| Party / family | Obbligatorio | Etichetta leggibile, massimo 120 caratteri. Può essere rinominata secondo le protezioni descritte sotto; non è una chiave. |
| List owner | Obbligatorio | Ale, Bridget o Both; unica fonte organizzativa per il nucleo. |
| Contact guest UUID | Facoltativo durante la preparazione | Sync UUID di un adulto nominativo appartenente al nucleo. Nessun bambino o posto +1 anonimo può essere referente. |
| Contact email | Facoltativo | Un solo indirizzo organizzativo per nucleo, massimo 254 caratteri; da compilare esplicitamente. |
| Contact phone | Facoltativo | Testo, non numero; conservare prefisso internazionale. Nessuna deduzione automatica di prefissi. |
| Language | Facoltativo durante la preparazione | it oppure en, da scegliere esplicitamente; deve essere definita prima delle comunicazioni. Non ricavarla dal nome o dal proprietario della lista. |

Contact guest UUID identifica il destinatario umano quando noto, senza ricopiarne nome e cognome. Email e telefono rimangono dati organizzativi nel foglio in questa fase; non sono importati nel database RSVP. Non sovrascrivono contact_email fornita da un invitato nella risposta. Gestione canali, recapiti social, indirizzo cartaceo e stati degli invii saranno definiti negli step 7–8. Non servono servizi a pagamento per questa struttura.

## Guest List

Le colonne sono già presenti in coda; mantenerle senza spostare o rigenerare Sync UUID:

- Household UUID: riferimento alla riga Households; obbligatorio per ogni riga completa in modalità nuova.
- Host Sync UUID: facoltativo; per un posto +1 indica l'adulto nominativo ospitante dello stesso nucleo. Non è un nome e non viene dedotto dalla stringa Plus-one of.

Conservare Guest name, Surname, Guest type e tutti i campi esistenti. Party / family e List owner restano inizialmente come colonne compatibili: devono corrispondere alla riga Households. Successivamente potranno diventare formule protette di sola visualizzazione, dopo verifica degli script e delle formule dipendenti. Non mantenere due fonti modificabili e silenziosamente discordanti: ogni divergenza blocca la Preview, senza scegliere automaticamente il valore vincente.

Le 11 righe provvisorie non ricevono Household UUID o Host Sync UUID automaticamente. I nuovi campi vuoti non cambiano la classificazione. Una bozza con nome/cognome ma senza dati organizzativi rimane esclusa; UUID o collegamenti già presenti su una riga incompleta devono generare un errore da correggere, non far sparire la riga dal piano.

## Casi gestiti

| Caso | Struttura e comportamento |
| --- | --- |
| Singolo | Un Household UUID e un adulto nominativo. Un eventuale +1 è un posto aggiuntivo esplicito. |
| Coppia | Due Sync UUID nello stesso household; nessun +1 implicito. |
| Famiglia con bambini | Adulti e posti bambino condividono il household; il sito continua a scartare nomi/cognomi dei bambini. Il numero di posti organizzativi non modifica la risposta RSVP has_children. |
| Adulto con accompagnatore sconosciuto | Due Sync UUID, stesso household; il posto mantiene Plus-one of <host>, senza identità nominativa in Neon. Host Sync UUID collega esplicitamente l'adulto. |
| Accompagnatore conosciuto in seguito | Conservare Sync UUID e Household UUID del posto. Transizione esplicita e verificata, non normale aggiornamento del nome: vedere sotto. |
| Più adulti | Più Sync UUID nello stesso household; nessuna fusione basata sui cognomi. |

Il sistema attuale permette un solo accompagnatore sconosciuto per un nucleo con un solo adulto nominativo. È un limite anche del form e dell'indice SQL su additional_guests, non solo del parser. Mantenerlo nella prima versione: più adulti senza +1 sono ammessi, mentre più accompagnatori anonimi o +1 in nuclei con più adulti richiedono un'evoluzione RSVP separata. Non dichiararli supportati modificando soltanto la validazione.

## Quando il +1 diventa una persona nominativa

- Prima dell'emissione e senza risposte: proporre una specifica operazione di identificazione da approvare, mantenendo lo stesso Sync UUID e nucleo. Creare un invitee_id solo perché il posto anonimo non ne possedeva uno, senza creare un secondo posto o nucleo. Rimuovere il permesso +1 consumato. Conservare il collegamento all'ospitante come provenienza organizzativa.
- Dopo emissione o risposta, oppure se esiste già un additional_guest: bloccare la conversione automatica. Riconciliare in una procedura dedicata che preservi token, risposta e ID dell'accompagnatore. Non duplicare additional_guests in invitees né cancellarlo per aggirare il problema.
- Il nome dell'accompagnatore raccolto tramite RSVP rimane autorevole in Neon. Il foglio non lo sovrascrive.

## Modifiche a gruppi già mappati

- UUID uguale, sola etichetta cambiata: stesso nucleo, mai un nuovo INSERT. Prima versione: aggiornamento consentito soltanto se non emesso e senza risposte; negli altri casi revisione manuale.
- Household UUID diverso per uno stesso Sync UUID: spostamento di appartenenza, sempre bloccato in un normale batch; richiede riconciliazione esplicita.
- Fusioni o divisioni: procedura separata con mappa degli ID, nessuna adozione per nome.
- Due etichette uguali con UUID diversi: nuclei distinti; segnalazione di possibile duplicato per revisione, senza fonderli.
- Righe o nuclei mancanti dal foglio: mantenuti nel database e segnalati. Nessuna cancellazione automatica.
- Il referente deve esistere nel medesimo nucleo; Host Sync UUID non può riferire se stesso, un altro posto anonimo, un bambino o un altro household.

## Passaggio dalla struttura attuale

1. Preparare l'elenco candidato dei gruppi attuali e dei rispettivi Sync UUID; le etichette servono solo a proporre il raggruppamento iniziale. Gli sposi confermano le appartenenze, senza associazioni basate sul cognome.
2. Struttura già predisposta e riverificata. Lasciare recapiti, lingua e referente non confermati vuoti. Prima di assegnare dati, verificare nuovamente entrambe le schede.
3. Dopo conferma dell'elenco candidato, assegnare un UUID per nucleo e compilare i riferimenti sulle sole righe approvate. Salvare e verificare la mappa per Sync UUID, mai per numero di riga. Nessun UUID invitato cambia.
4. Sospendere gli edit collaborativi durante l'assegnazione; la scrittura su due schede non va presentata come transazione con Neon. Prima di scrivere, rileggere entrambe, verificare ID e appartenenze, poi eseguire readback. In caso di risultato incerto recuperare gli ID già persistiti, senza rigenerarli.
5. Conservare una modalità legacy finché la nuova struttura non è completa. Attivare la modalità Household UUID solo esplicitamente. Una volta attivata, assenza della scheda, UUID mancanti o struttura parziale bloccano il batch: nessun ritorno silenzioso al raggruppamento per nome.
6. I nuclei Neon preesistenti privi di mappatura continuano a bloccare l'import. La loro associazione è lo step 5 e richiede verifica e approvazione separata; la creazione di Households non li riconcilia.

## Implementazione prevista nel progetto

| Area | Intervento |
| --- | --- |
| lib/guest-sync/google.ts | **9C.1 preparato:** `readSheets()` legge Guest List e Households; `readSheet()` mantiene il contratto legacy. Il workflow attuale non usa ancora la nuova lettura. |
| lib/guest-sync/model.ts | **9C.1 preparato:** schema e validazione household standalone, link UUID e minimizzazione dei recapiti. Integrazione con piano e protezioni transazionali resta successiva. |
| lib/guest-sync/workflow.ts e receipt.ts | Firma della modalità/schema e impronta delle due sorgenti; rilettura e confronto al momento dell'Apply. Modifiche a una delle due schede invalidano la Preview. Non presumere una transazione condivisa Google/Neon. |
| lib/guest-sync/db.ts e nuova migrazione numerata | Mappatura unica fra source_id + Household UUID e household_id interno; estendere snapshot e Apply, sostituendo la ricerca del gruppo per etichetta con la chiave stabile. Non riscrivere 008 già applicata. |
| scripts/guest-sync-identifiers.gs | Operazione distinta per i nuclei, con assegnazione idempotente solo su mappa approvata. Testare su dati fittizi prima di installare o eseguire sul foglio originale. |
| /admin/guests | Mostrare nucleo, membri, UUID di collegamento quando necessario alla revisione, errori e cambi di etichetta/appartenenza; tutto riservato agli amministratori. |
| tests/guest-sync | Casi sotto elencati; `households.test.cjs` copre il parser preparatorio. Conservare la suite legacy e aggiungere i casi di integrazione 9C.2/9C.3. |

La nuova tabella di mappatura proposta ha chiave primaria (source_id, external_household_id), FK household_id verso rsvp.households e vincolo univoco su household_id per evitare alias multipli. La migrazione futura deve garantire che ogni guest_sync_member si riferisca alla stessa associazione di nucleo (FK composta o vincolo equivalente), non affidarsi solo al parser. I dati organizzativi della scheda Households appartengono alla mappatura di sincronizzazione; campi RSVP, token e risposte restano esclusi dalle scritture.

Non assegnare automaticamente Household UUID ai nuclei già presenti in Neon nella migrazione SQL. Verificare prima le mappature esistenti, poi applicare l'associazione approvata in una transazione separata. Aggiornare ruolo limitato, snapshot, hash e controlli SQL insieme, impedendo l'uso del nuovo piano con una funzione Apply precedente.

## Verifiche prima dell'attivazione

- Singolo, coppia, bambini, +1 e nuclei con più adulti.
- Omonimi e nuclei con uguale etichetta ma UUID diversi; nessuna fusione.
- Rinomina del nucleo con identità e membri invariati; differenza dai trasferimenti.
- UUID nucleo/invitato assenti o duplicati, collegamenti orfani e incrociati.
- Referente e ospitante validi nello stesso nucleo; cicli e auto-riferimenti rifiutati.
- Modalità legacy e nuova, passaggio esplicito, schema parziale e scheda mancante.
- Modifica di ciascuna scheda tra Preview e Apply, ordinamento, riesecuzione e concorrenza tra amministratori.
- Conversione +1 prima dell'emissione; blocco dopo emissione/risposta e nessuna duplicazione.
- Conservazione byte per byte di risposte, token, ID e storico RSVP su database di test.
- Migrazione su database locale fittizio; su Neon DEVELOPMENT soltanto dopo autorizzazione esplicita. Mai PRODUCTION.
- TypeScript, lint, build e revisione indipendente quando il codice è pronto.

## Prossima decisione

La struttura Households e le due nuove colonne di Guest List sono state approvate e create. Resta da confermare la mappa concreta delle appartenenze. L'approvazione alla creazione della struttura non autorizza automaticamente l'assegnazione dei 29 nuclei candidati, la migrazione Neon, la riconciliazione dei record esistenti, Apply Changes o inviti/token. La mappa concreta delle appartenenze verrà presentata prima della sua scrittura.


## Contratto di attivazione e compatibilità

L'introduzione della modalità Household UUID dovrà essere esplicita e persistente
per sorgente. La semplice presenza delle intestazioni o di una prima cella
compilata non è sufficiente ad attivarla. Lo snapshot e la ricevuta dovranno
contenere la versione del contratto e la modalità; una funzione SQL precedente
deve rifiutare un piano nuovo, non ignorarne i campi.

Per invitati già importati dalla modalità legacy, compilare Household UUID nel
foglio non autorizza l'adozione automatica in Neon. Si prepara una mappa distinta
tra UUID esterno e household_id interno, usando gli UUID invitato già mappati
come evidenza e verificando che tutti i membri appartengano allo stesso nucleo.
L'associazione è una scrittura di riconciliazione soggetta ad approvazione.
Nessuna associazione deve basarsi sulla sola etichetta o sul cognome.

Per nuclei nuovi, più gruppi con uguale etichetta e UUID diversi devono restare
separati anche nell'Apply SQL, sostituendo la ricerca corrente per etichetta.
La nuova tabella e i vincoli vanno preparati in una migrazione successiva a 008,
che resta immutata. Nessuna applicazione su Neon senza approvazione separata.

Il collegamento Host Sync UUID è una relazione organizzativa esplicita. La
stringa Plus-one of resta compatibile con il parser ma non è la chiave di tale
relazione. Il passaggio da posto anonimo a persona identificata resta bloccato
nel batch ordinario finché non esiste una procedura dedicata che preservi posto,
UUID, eventuale additional_guest e risposte. Non estendere il numero di +1
consentiti senza aggiornare coerentemente SQL e form RSVP.

## Esito e prossima azione

Completata la progettazione dello step 4 e preparata la mappa privata da
approvare. Implementazione runtime per Household UUID e migrazione ancora da
realizzare; nessuna pretesa di supporto già attivo. Prima scrittura proposta:
29 righe Households, 62 riferimenti Household UUID e 19 riferimenti Host Sync
UUID, solo dopo conferma delle appartenenze e rilettura delle sorgenti.
La riconciliazione dei due nuclei Neon segnalati resta lo step 5 separato.


Verifica documentale finale: `git diff --check` passato; controllati unicità e
formato dei 62 UUID, assenza di collisioni delle etichette anche ignorando le
maiuscole e copertura completa degli UUID nella mappa privata. Revisione
indipendente Codex della progettazione: PASS WITH NOTES, nessun blocco.
Il revisore non ha ricevuto la mappa privata né dati reali degli invitati.
Note: confermare esplicitamente i 19 ospitanti, rileggere prima di scrivere,
recuperare UUID già persistiti in caso di errore e verificare il contratto della
futura modalità anche lato SQL. Nessun nuovo test runtime necessario per questo
aggiornamento documentale; restano validi come evidenza del commit precedente
i 76 test e i controlli già registrati, non come test di una modalità UUID nuova.
