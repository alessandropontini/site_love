# Step 5 — proposta di riconciliazione dei dati esistenti

Stato aggiornato al 1 novembre 2026: migrazione 009 e classificazione dei due
nuclei applicate a DEVELOPMENT dopo autorizzazione esplicita all’esecuzione.
Le sezioni di analisi e preparazione sotto documentano le fasi precedenti;
l’esito operativo aggiornato è riportato in fondo.

## Esito dell’inventario

Sono presenti 2 nuclei, 4 invitati, 4 risposte RSVP, nessun accompagnatore e
zero mappature guest_sync_members. Entrambi i nuclei hanno inviti già emessi.
Uno corrisponde al fixture documentato nel runbook locale; per entrambi la
classificazione test è stata confermata esplicitamente dall’utente.
Non sono invitati reali da adottare nella lista Google Sheets.

Nessuna corrispondenza esatta tra nomi/nuclei e foglio; confronto soltanto
informativo, mai una chiave di associazione. Non associare questi record alle
righe reali né creare invitati o Sync UUID fittizi per aggirare il blocco.
L’inventario con gli ID esatti rimane privato fuori dal repository.

Le connessioni RSVP e sync configurate puntano allo stesso endpoint/database.
Il nome del branch Neon non è stato verificato via pannello/control plane;
verificare DEVELOPMENT prima di una scrittura futura. Il ruolo disponibile non
può leggere audit_events: lo storico non è stato ispezionato né modificato.
Non sono stati letti/esportati token o hash dei token; la presenza di inviti è
stata verificata dal booleano issued dello snapshot minimizzato.

## Esclusione esplicita dalla sync

Conservare i record nelle tabelle attuali e introdurre un registro di esclusione
per Household ID. Solo i due ID contenuti nell’inventario privato potranno essere
classificati come test dopo approvazione della scrittura. Non usare nomi, prefissi
TEST, etichette DA ELIMINARE, stato disabled o assenza di corrispondenze per
escludere automaticamente un nucleo.

Il registro proposto conserva:

- household_id, FK e chiave univoca sul nucleo interno;
- classificazione test e motivo non contenente dati personali;
- amministratore autorizzante e data di registrazione;
- eventuale revoca tracciata, senza perdere la storia delle decisioni.

Questa classificazione riguarda la sola sincronizzazione organizzativa. Non
cambia status, token_hash, invitati, risposte, additional_guests, contatti,
response_version, updated_at o storico RSVP. Non nasconde automaticamente i test
nelle altre dashboard: se necessario, tale filtro sarà una modifica esplicita.

## Invarianti richieste all’implementazione

1. Ogni nucleo non mappato continua a bloccare import, salvo esclusione esplicita
   attiva e autorizzata per il suo ID. Un terzo nucleo sconosciuto deve bloccare.
2. Un nucleo escluso non può contemporaneamente essere mappato alla sorgente.
   Il vincolo deve essere verificato anche in SQL, non soltanto dal planner.
3. La sync non può creare nuove associazioni, aggiornare o adottare un nucleo
   escluso, nemmeno mediante etichetta coincidente o un piano manipolato. Una
   collisione di etichetta con un test escluso deve bloccare la Preview senza
   adottare il test o creare un duplicato silenzioso.
4. Stato e revisione delle esclusioni fanno parte dello snapshot/hash. Qualsiasi
   cambiamento tra Preview e Apply invalida la ricevuta; SQL ricontrolla sotto
   lock coerenti con la registrazione/revoca delle esclusioni.
5. Il ruolo sync può leggere l’esclusione tramite snapshot, ma non dichiarare o
   revocare autonomamente un test. Scritture del registro riservate a un percorso
   amministrativo esplicitamente autorizzato e tracciato.
6. Preview distingue i nuclei di test esclusi dal totale database; non presenta
   come errore il diverso conteggio tra invitati reali e dati di prova.
7. Revocare un’esclusione senza mappatura ripristina il blocco prudenziale. Il
   rollback non elimina mai nuclei o risposte per rendere possibile un import.

La migrazione 009 aggiunge il registro e aggiorna snapshot/Apply insieme, con
compatibilità di versione verificata, senza modificare 008 già applicata.
La migrazione non contiene ID reali e non attiva esclusioni:
la registrazione dei due ID è una transazione distinta soggetta ad approvazione.

## Procedura proposta prima delle scritture

1. Implementare e revisionare codice, migrazione e test con dati fittizi locali.
2. Verificare esplicitamente il branch DEVELOPMENT e preparare backup privato
   con ripristino verificato, comprendente ID, hash token, risposte e audit.
3. Presentare migrazione e transazione di classificazione esatta per approvazione.
4. Dopo approvazione, rileggere e bloccare gli ID nella stessa transazione,
   verificare che composizione/mappature non siano cambiate e registrare le sole
   esclusioni. Nessuna modifica alle tabelle RSVP esistenti.
5. Confrontare ID, dati RSVP, hash token e audit prima/dopo; preservare la storia.
6. Eseguire Preview in sola lettura. Nessun Apply Changes in questa lavorazione.

I due record non devono ricevere Household UUID del foglio: sono fuori dalla
lista reale. La mappa proposta allo step 4 rimane non applicata e non è necessaria
per stabilire che questi due nuclei sono test. L’evoluzione dei nuclei reali
verso UUID esterni resta distinta da questa eccezione di sincronizzazione.

## Criteri di verifica

- Esclusione esatta e nessuna esclusione nominale/implicita; nucleo ignoto bloccato.
- Rifiuto di mappatura su esclusione e di esclusione su nucleo già mappato.
- Rifiuto di piani manipolati diretti ai test e di tentativi del ruolo sync di
  modificare il registro; eventi di conferma/revoca conservati.
- Ricevute obsolete e concorrenza tra import, esclusione e revoca.
- Preservazione byte per byte di ID, token_hash, risposte e audit.
- Revoca/rollback con blocco prudenziale, nessuna cancellazione.

## Verifiche eseguite e limiti

Le transazioni di lettura hanno verificato transaction_read_only=on. Non sono
state eseguite migrazioni, classificazioni, associazioni, cancellazioni, import,
modifiche al foglio o operazioni di produzione. Le due letture SQL sono separate:
non costituiscono la fotografia transazionale per una futura modifica.
La progettazione è stata seguita dall’implementazione locale descritta sotto.
Nessuna funzionalità è dichiarata attiva sul database remoto.


Revisione indipendente Codex della proposta: PASS WITH NOTES, nessun blocco
progettuale. Confermate le esigenze di lock comuni tra Apply/esclusione/revoca,
storia delle decisioni e invalidazione delle Preview, blocco delle collisioni
nominali e verifica DEVELOPMENT/audit prima di scrivere. Il revisore ha letto
solo questo documento, senza dati privati o accesso live. `git diff --check`
passato nella fase di proposta. Le verifiche runtime dell’implementazione sono riportate sotto.


## Implementazione locale del registro

Preparata la migrazione 009, senza riscrivere 008 e senza dati reali al suo
interno. Crea stato iniziale non escluso per ciascun household, registro eventi,
funzione operatore e vincolo FK composto che impedisce l’appartenenza alla
sorgente per un nucleo escluso. Il ruolo sync non può classificare o revocare.
La funzione Apply usa contratto 2 e controlli SQL indipendenti; la firma precedente
è bloccata. La Preview senza la migrazione mostra un errore di versione, non
permette di applicare il batch e mostra conteggi separati per i test esclusi.

L’operazione esatta sui due nuclei è stata preparata in un file SQL privato fuori
dal repository. Nessun ID reale è hardcoded nella migrazione o nei test. Il file
verifica roster/revisioni, usa lock coerenti e confronta il contenuto RSVP prima
e dopo la sola classificazione. Rimangono da verificare il branch DEVELOPMENT,
accesso owner/audit e backup con ripristino prima dell’approvazione/esecuzione.
Il tentativo tramite Safari non ha risposto. La console Neon aperta nel browser
integrato richiede l’accesso; il branch non è quindi verificato. Nessuna
impostazione del servizio è stata modificata.

La modifica del foglio per i nuclei reali rimane sospesa secondo l’istruzione
dell’utente. Nessuna riconciliazione dei test con righe reali e nessun Apply.


### Esito della validazione locale

Tutti i 92 test sono passati, senza errori o test saltati. Passati anche
TypeScript, lint, build di produzione e controllo degli spazi nel diff.
Lo script operatore privato è stato provato su UUID e dati fittizi in PGlite:
confronto dei dati protetti prima/dopo superato e riesecuzione bloccata.
Nessuna connessione esterna è stata usata per questa prova.

La revisione indipendente Codex dell’implementazione ha dato PASS WITH NOTES,
senza difetti da correggere. Restano da verificare concorrenza su connessioni
PostgreSQL reali, permessi dei ruoli distribuiti e Preview autenticata nel browser.
La validazione locale non sostituisce verifica DEVELOPMENT, accesso owner/audit
e backup con ripristino prima di qualsiasi scrittura remota autorizzata.


## Esecuzione su DEVELOPMENT completata

L’utente ha fornito localmente DATABASE_OWNER_URL e confermato che proviene dal
branch DEVELOPMENT. Via SQL sono stati verificati ruolo owner, accesso audit e
corrispondenza endpoint/database con entrambe le connessioni applicative.
Il nome del branch è confermato dall’utente, non dal control plane Neon.

Creati backup privati custom e SQL sotto backups/ (ignorato da Git, accesso
riservato). Il backup SQL è stato ripristinato in PGlite e il contenuto di tutte
le 8 tabelle è stato confrontato con il database sorgente tramite digest.
Il ripristino su server PostgreSQL completo resta una verifica distinta.

Migrazione 009 e classificazione dei due ID approvati eseguite in una sola
transazione, con lock e confronto integrale prima/dopo delle tabelle households,
invitees, responses, additional_guests e audit_events. Confronto superato e
commit riuscito. La verifica successiva tramite ruolo sync conferma contratto 2,
2 esclusioni attive a revisione 1 e zero mappature. Verificati 4 invitati,
4 risposte e 2 eventi di classificazione.

Nessun Apply Changes, import, modifica al foglio, emissione di inviti o token,
commit Git, push o deploy. Preview autenticata nel browser e prove concorrenti
su più connessioni rimangono non eseguite.


## Preview live dopo la migrazione

Eseguita da terminale la logica corrente workflow.preview dell’app, con lettura
Google Sheets tramite service account e snapshot Neon in transazione read-only.
Esito: contratto 2, zero errori, 62 righe sorgente proposte come INSERT in
29 nuclei, zero UPDATE e zero MISSING FROM SOURCE; 11 righe provvisorie saltate.
I 2 nuclei di prova e i loro 4 invitati risultano correttamente esclusi.
Nessun Apply eseguito. Il dettaglio nominativo rimane in un file privato fuori
dal repository; la ricevuta temporanea non è stata esportata.
Questo verifica il percorso di pianificazione, non autenticazione e rendering
della pagina admin. Il raggruppamento nuclei usa ancora Party / family:
l’evoluzione verso Household UUID esterni resta separata e non applicata.


## Import DEVELOPMENT autorizzato e completato

Dopo la Preview l’utente ha richiesto di ripopolare DEVELOPMENT, precisando che
le successive modifiche agli invitati devono essere recepite. Creato un nuovo
backup privato e verificato il ripristino PGlite confrontando tutte le 10 tabelle.
Eseguiti nuova Preview e Apply tramite le funzioni correnti dell’app: SUCCESS.
Importate 62 righe sorgente in 29 nuovi nuclei; tutti disabilitati e senza token.
I 2 nuclei test restano esclusi e le 4 risposte esistenti sono presenti.
Le righe sorgente comprendono 39 adulti nominativi e posti anonimi; il database
contiene ora 43 invitees nominativi, inclusi i 4 test, non 62 nuovi nominativi.

Preview successiva: 62 NO CHANGE, zero INSERT, UPDATE, MISSING o errori.
Prova in memoria sullo snapshot reale: modificando Guest name e Surname di un
adulto, con Sync UUID invariato, si ottiene un solo UPDATE della stessa identità
e dello stesso nucleo. Nessuna modifica al foglio per questa prova.

Le modifiche del foglio richiedono una nuova Preview e Apply; non è attiva una
sincronizzazione automatica. Restano le protezioni su RSVP, inviti emessi,
cambi di nucleo/tipo e conflitti con modifiche effettuate direttamente nel DB.
Nessun invito/token generato, nessun deploy o commit Git.

## Migrazione 011 — procedura di mapping Household UUID

La successiva implementazione aggiunge un entrypoint owner-only per associare,
su approvazione separata, un Household UUID esterno a un household interno già
presente. La procedura richiede l'intera lista dei Sync UUID attualmente
mappati al household interno, confrontata in modo esatto sotto lock; non usa
nomi o etichette, non modifica lo stato RSVP e registra un evento senza dati
personali. Mapping ripetuto con stesso UUID e roster è idempotente.

La funzione è stata testata solo con dati fittizi in PGlite. Non è stata
eseguita su Neon e non cambia lo stato dei due household test esclusi descritti
sopra. Prima di qualsiasi mapping reale occorrono una mappa completa
indipendentemente verificata, conferma dell'ambiente DEVELOPMENT e backup con
ripristino; questa implementazione non costituisce approvazione a eseguire tali
passi.
