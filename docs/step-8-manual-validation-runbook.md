# Step 8 — runbook verifiche manuali

Questo runbook raccoglie le sole prove Step 8 che richiedono un ambiente
autenticato o un database Neon. È stato preparato senza contattare Clerk, Neon
o Google Sheets. Le verifiche locali con PostgreSQL 16 e fixture sintetiche
sono già passate nel workflow GitHub Actions; non sostituiscono le prove qui
descritte.

## Confini e prerequisiti

- Usare un'istanza Clerk di **sviluppo/test** e un branch Neon di **test**
  separato da DEVELOPMENT e Production. Non usare dati di invitati reali.
- Prima di creare il branch Neon, applicare migrazioni o collegare credenziali,
  ottenere un'approvazione esplicita separata: il checkpoint di codice non la
  concede.
- Preparare solo household fittizi, mapping UUID fittizi e risposte sintetiche.
  Non collegare Google Sheets per questo walkthrough. L'anteprima e la
  conferma d'attivazione che interrogano Sheets non fanno parte della prova
  Clerk isolata.
- Usare un browser di test e non registrare schermate, URL RSVP, token, QR,
  cookie, chiavi o stringhe di connessione in ticket, repository o chat.
- Conservare dump e manifest di test fuori dal repository, in una cartella
  cifrata e privata. Non copiare dati o artefatti reali per rendere la prova
  più comoda.

Se non sono disponibili un'istanza Clerk di test, un branch Neon isolato, le
credenziali temporanee e l'approvazione per le operazioni Neon, segnare la
prova corrispondente come **non eseguita**. Non sostituirla con mock e non
segnarla come superata.

## A. Walkthrough Clerk autenticato

### Preparazione manuale

1. Creare o selezionare l'istanza Clerk di test; disabilitare la registrazione
   pubblica e abilitare MFA per gli account amministrativi di test.
2. Creare due utenti di prova: uno con email verificata inserita nella
   `RSVP_ADMIN_EMAILS` dell'ambiente di test e uno non presente nell'allowlist.
   Non usare gli account personali di produzione.
3. Configurare localmente le variabili Clerk e gli endpoint di test necessari
   seguendo `.env.example` e `docs/deployment.md`. Inserire i segreti solo nel
   file locale non tracciato o nel secret store del provider; non condividerli.
4. Avviare il sito con la configurazione di test. Verificare con chi gestisce
   l'ambiente che le connessioni Sheets siano assenti o disabilitate e che il
   database, se necessario per il rendering, sia solo quello fittizio.

### Percorso e risultati attesi

Eseguire in una sessione browser pulita e annotare soltanto esito, data e SHA
del codice provato:

1. Senza login, aprire direttamente `/admin/invitations` e le route di azione
   admin applicabili. La richiesta deve essere rifiutata senza mostrare dati o
   eseguire letture/mutazioni.
2. Accedere con l'utente autenticato **fuori allowlist** e ripetere. Deve
   ricevere un rifiuto; autenticazione Clerk da sola non concede accesso.
3. Accedere con l'utente verificato **in allowlist**. La pagina protetta deve
   caricarsi senza esporre token, hash o dati non necessari.
4. Verificare la separazione dei controlli: aprire la pagina/preview non deve
   attivare un household né inviare comunicazioni. Non premere azioni che
   leggono Sheets o confermano un'attivazione in questo walkthrough isolato.
5. Disconnettersi e verificare che il browser non conservi una sessione
   amministrativa riutilizzabile.

Registrare per ciascun caso: browser/versione, SHA remoto, account di test per
ruolo (senza email), route, esito atteso/ottenuto e riferimento a eventuali log
sanitizzati. Non registrare URL con token, cookie, schermate contenenti dati o
valori dei secret. Un errore del provider, di configurazione o di rete è
**bloccato/non conclusivo**, non un pass.

Questa sezione verifica l'autenticazione e l'allowlist nel browser. Non prova
il flusso completo di attivazione importati, che richiede anche dati Sheets e
Neon autorizzati e resta fuori da questa prova.

## B. Restore e controllo rollback su branch Neon di test

Questa prova scrive nel database di destinazione. Eseguirla solo dopo
l'approvazione esplicita del proprietario per il branch Neon di test, per la
creazione del dump e per l'eventuale procedura di rollback. Non usare mai
Production o il branch DEVELOPMENT.

1. Nel pannello Neon creare/selezionare un branch chiamato chiaramente come
   test, isolato da Production e DEVELOPMENT. Verificare il nome del progetto,
   branch e database prima di copiare la stringa di connessione. Usare
   connessioni unpooled per dump e restore.
2. Popolare soltanto fixture fittizie rappresentative: mapping household,
   membri, stato invito e, se la verifica lo richiede, risposta e journal
   sintetici. Non importare il foglio reale.
3. Creare il backup con la procedura `Backup e ripristino` in
   `docs/operations-guide.md`, indicando una cartella cifrata fuori dal
   repository. Annotare branch sorgente, ora e nome file, mai la URL o i dati
   del dump.
4. Verificare nuovamente dal pannello Neon che la destinazione attiva sia il
   branch di test. Solo allora eseguire il `pg_restore` documentato in quella
   guida con `--clean --if-exists --no-owner --no-acl`. Queste opzioni
   sostituiscono oggetti omonimi nel database di destinazione: non eseguire il
   comando finché il branch non è verificato come isolato e sacrificabile.
5. Confrontare sul branch di test i conteggi e gli identificativi fittizi
   previsti: household, invitees, mapping Sync UUID, membership, risposte e
   storico. Verificare che i valori attesi siano conservati e che non siano
   comparsi record estranei. Evitare export o copie su disco non necessari.
6. Seguire la procedura di rollback concordata per il branch di test e
   controllare che il ripristino/ritorno allo stato concordato riesca. Non
   improvvisare `DROP`, restore o migrazioni su altri branch. Se non esiste una
   procedura rollback approvata, fermarsi dopo la verifica non distruttiva e
   lasciare il branch di test isolato per il proprietario.
7. Rimuovere in modo sicuro dump e fixture temporanee secondo la policy di
   conservazione concordata; non cancellare il branch finché il proprietario
   non ha verificato l'esito e autorizzato la pulizia.

Il controllo è superato solo se il restore termina senza errori, tutti gli
identificativi/mapping sintetici attesi coincidono, risposte e audit history
sono presenti e il controllo rollback approvato ha esito positivo. Salvare nel
verbale solo esito, branch test (nome non sensibile), timestamp, SHA del codice
e conteggi sintetici. Non allegare dump, stringhe di connessione o dati
personali.

## Esito da riportare

Per ciascuna prova, usare uno stato tra `PASS`, `FAIL`, `NON ESEGUITA` o
`BLOCCATA`, e indicare il motivo e lo SHA esatto del branch. La prova del
browser Clerk e il restore Neon restano due gate separati; un PASS dell'uno non
chiude l'altro né autorizza migrazioni, promozione, invii o produzione.
