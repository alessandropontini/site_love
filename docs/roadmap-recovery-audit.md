# SITE LOVE — audit recupero roadmap, Step 9B

Data: 6 novembre 2026
Branch: `feat/roadmap-recovery-20261106`
Commit di riferimento: `8e5bbdd5f63519f67d9dd242e8323bcd1b6dc1cc`

### Addendum di riconciliazione — 7 novembre 2026

La punta remota rilevata durante l'audit includeva lo Step 8.2 (`3026cfb`);
gli Step 8.3–8.5 sono stati successivamente pubblicati fino al commit
`4095927`. La storia locale del branch `docs/household-uuid-plan` conserva i commit 012–015,
ma la sua base migrazione 010–011 differisce da quella remota attuale. Il branch
alternativo non è pubblicato su GitHub e il worktree registrato non è presente.
Gli asset temporanei non tracciati nel checkout non sono stati modificati.

## Avanzamento successivo all'audit

Il rilievo è uno snapshot storico al commit indicato. In seguito è stato
completato il runtime Household UUID (9C.1–9C.3) e aggiunta la migrazione 011
con procedura owner-only per mapping esatti e approvati (step 5). Le migrazioni
010–011 sono state verificate solo localmente con dati fittizi; nessun mapping
live è stato eseguito. La riconciliazione reale resta quindi da svolgere per
ogni household solo dopo approvazione esplicita, mappa verificata, conferma
DEVELOPMENT e backup/ripristino. Gli artefatti storici 012–015 sono stati
recuperati nella storia locale di `docs/household-uuid-plan`; dipendono da una
diversa base Household UUID e non sono stati integrati. Nel branch di lavoro
012–014 sono stati poi reimplementati o adattati separatamente; il grant 015
resta da valutare.

## Scopo e limiti

Questo audit confronta codice, migrazioni, test e documentazione versionati. Non implementa né ricostruisce funzionalità; non legge o scrive Google Sheets o Neon; non consulta dati reali, credenziali, token o esportazioni. La parte grafica resta fuori perimetro.

Il repository documenta esplicitamente gli step 1–3, 4, 5 e 6, ma non contiene una definizione canonica completa della roadmap 1–8. Gli step 7–8 sono ricondotti qui ai sistemi Save the Date, inviti, dashboard RSVP e risposte offline citati nella richiesta. La corrispondenza è quindi una ricostruzione del perimetro, non prova dei titoli o criteri originari.

**COMPLETA** significa implementazione presente e coperta da verifiche locali documentate; **PARZIALE**, parte del flusso presente ma requisito mancante; **MANCANTE**, implementazione non trovata; **DA VERIFICARE**, prove insufficienti. La sola documentazione non rende completa una funzionalità.

## Stato degli step 1–8

| Step / funzionalità | Stato | Evidenze nel repository | Lacuna o limite |
| --- | --- | --- | --- |
| 1. Identità stabile degli invitati e assegnazione UUID | **COMPLETA** | `scripts/guest-sync-identifiers.gs`; `tests/guest-sync/identifiers.test.cjs`; `docs/guest-names-step-1-3.md`. Lo script preserva ID esistenti e blocca duplicati/errori. | Test dello script in mock; installazione e uso sul foglio reale non verificati in questo audit. |
| 2. Nome e cognome senza perdita di identità | **COMPLETA** | `lib/guest-sync/model.ts`; `app/admin/guests/GuestListSynchronization.tsx`; test `names`, `surname`, `presentation`; `docs/guest-names-step-1-3.md`. Nomi dei bambini e posti anonimi sono minimizzati. | La qualità dei valori nel foglio richiede verifica umana, non effettuata qui. Nessuna migrazione dedicata: i dati di planning sono nel JSONB di 008. |
| 3. Sincronizzazione manuale Sheets → Neon | **COMPLETA** nei contratti legacy e Household UUID | `app/admin/guests/`; `lib/guest-sync/{google,model,workflow,db,receipt,service}.ts`; migrazioni 008–010; test `tests/guest-sync/`. Preview read-only, Apply esplicito, ricevuta firmata, rilettura delle sorgenti e controlli transazionali. | Le verifiche sono su fixture e PostgreSQL WASM locali; non attestano credenziali Google, ruoli live o concorrenza Neon reale. |
| 4. Household UUID come identità stabile del nucleo | **COMPLETA nel runtime** | Lettura e parsing espliciti delle due schede; snapshot, ricevuta e Apply contratto v3; mapping univoco `(source_id, external_household_id)`; migrazione 010; UI Preview/Apply e test fittizi. | Nessuna migrazione è stata applicata a Neon in questo lavoro. Associazioni effettive dei nuclei esistenti restano soggette a riconciliazione approvata. |
| 5. Riconciliazione dei nuclei Neon esistenti | **PARZIALE: procedura pronta, mapping reale non eseguito** | Migrazione 011 e funzione owner-only per mapping espliciti, roster esatto e audit metadata-only; test PGlite. | Nessun mapping live è stato approvato o scritto. Per un'operazione reale servono ambiente e backup verificati e una mappa privata approvata. |
| 6. Preview/Apply amministrativo della sincronizzazione | **COMPLETA** nei contratti legacy e Household UUID | `app/admin/guests/GuestListSynchronization.tsx`; `lib/guest-sync/workflow.ts`; SQL 008–010; test `engine`, `database`, `google`, `auth`, `exclusions`, `presentation`, `households`. | I test locali non verificano Clerk/browser autenticati o concorrenza multi-connessione Neon. |
| 7. Save the Date | **IMPLEMENTAZIONE COMPLETA nei bullet 7.1–7.5c** | Planner read-only per mapping esatto, draft bilingue/canali manuali, ricevuta HMAC, migration 012 atomica/idempotente con grant minimi, adapter DB, azioni server Clerk/allowlist e pagina di revisione/conferma. Test PGlite e fixture sintetiche. Il vecchio commit `179bfd4` resta un riferimento incompatibile non integrato. | Walkthrough browser Clerk autenticato da eseguire con ambiente/servizi di test. Nessun invio automatico o migration live. |
| 8. Emissione inviti/QR, dashboard RSVP e risposte offline | **PARZIALE: 8.1–8.6e implementati; walkthrough Clerk e gate Neon aperti** | Generatore per nuovi nuclei, route RSVP personale, dashboard/export e storico offline admin, preview read-only, transazione SQL atomica, conferma Clerk/allowlist e handoff privato URL/QR in memoria/browser download. Migration 014 implementa la scrittura offline; form con HMAC e retry idempotente. Migration 015 revoca SELECT diretto sul journal e concede al ruolo sync solo una funzione read-only metadata-only. Workflow GitHub Actions con PostgreSQL 16 applica 001–015, testa due connessioni, backup e restore con fixture sintetiche. | Walkthrough browser Clerk richiede un'istanza di test; restore sul branch Neon di test e gate di promozione restano operazioni separate. QR e token reali non generati; migration 013–015 non applicate a Neon. |

## Architettura e componenti presenti

- Next.js App Router: home pubblica `app/page.tsx`; route privata `/rsvp/[token]`; aree admin `/admin/rsvp` e `/admin/guests`.
- Neon Postgres per risposte RSVP e planning; sincronizzazione Google Sheets manuale, server-side e con scope API read-only.
- Clerk per identità amministrativa, con allowlist di email verificata. Ruoli DB runtime e sync distinti secondo le migrazioni e le guide.
- QR generati localmente in cartella privata esterna al repository. Save the Date ha planner, draft, ricevuta, journal SQL, adapter, azioni admin e pagina privata di revisione. `lib/rsvp/email.ts` serve le conferme del modulo RSVP.
- Il contenuto grafico e gli asset non sono stati modificati né valutati visivamente.

## Migrazioni SQL 001–014

| File | Responsabilità verificata nel codice |
| --- | --- |
| `db/migrations/001_rsvp.sql` | Schema `rsvp`, household, invitee, response, audit e vincoli; revoca privilegi `PUBLIC`. |
| `002_admin_audit.sql` | Registro eventi admin, incluso audit export metadata-only. |
| `003_household_rate_limit.sql` | Contatore/finestra di limitazione invii per household. |
| `004_invitee_source.sql` | Provenienza sposa/sposo/entrambi temporaneamente su invitee. |
| `005_household_invitation_source.sql` | Provenienza consolidata a livello household; rimozione da invitee. |
| `006_attendance_phase.sql` | Email contatto, flag bambini, pasti nullable e tabella ospite aggiuntivo (+1). |
| `007_household_plus_one_permission.sql` | Permesso +1 esplicito per household, off di default. |
| `008_guest_list_sync.sql` | Mapping UUID invitato, batch e funzioni snapshot/Apply ristrette; import disabilitato senza token. |
| `009_guest_sync_test_exclusions.sql` | Esclusioni test esplicite con revisioni/eventi, vincolo anti-sovrapposizione e contratto sync v2. |
| `010_guest_sync_household_runtime.sql` | Modalità sorgente esplicita, mapping Household UUID, vincoli composti, snapshot e Apply contrattuale v3. |
| `011_guest_sync_household_reconciliation.sql` | Funzione owner-only per registrare un mapping approvato a roster esatto, con journal metadata-only. |
| `012_save_the_date_tracking.sql` | Stato Save the Date versionato, eventi atomici append-only, validazione mapping/contact, replay e grant minimi al ruolo sync. |
| `013_imported_household_invitation_activation.sql` | Attiva un household importato con mapping esatto, roster persistito, stato/risposte verificati, hash-only, journal idempotente e grants minimi. |
| `014_manual_rsvp.sql` | Contratto SQL per risposte offline confermate: revisione condivisa, roster esatto, provenienza e motivo strutturato, audit atomico e journal replay-safe metadata-only; invocato da Server Actions Clerk-protette. |
| `015_manual_rsvp_dashboard_read.sql` | Revoca al ruolo sync la lettura diretta del journal e concede una funzione read-only limitata ai metadati di audit; runtime e `PUBLIC` restano negati, usata dalla dashboard admin. |

Le migration 012–015 presenti nel branch di lavoro sono reimplementazioni adattate ai contratti correnti, verificate localmente e non applicate a Neon. I commit storici `179bfd4`, `0f26498`, `59025e7` e `51fb37a` non sono integrati né pubblicati su GitHub; il loro codice 012–015 resta nella storia locale alternativa.

I commit storici 012–015 si basano anche su una coppia di migrazioni diversa:
`010_guest_sync_household_foundation.sql` e
`011_guest_sync_household_runtime.sql`. Il branch di lavoro usa invece
`010_guest_sync_household_runtime.sql` e
`011_guest_sync_household_reconciliation.sql`. La 010 storica introduce mapping
di staging, campi baseline/contact e una barriera all'attivazione; la 011
storica sostituisce il flusso di staging con l'attivazione UUID globale e un
Apply v3. Il branch attuale registra invece modalità e mapping runtime in 010 e
fornisce in 011 una riconciliazione owner-only per mapping esatti.

Per questo le migrazioni e il codice storici non si possono cherry-pickare o
applicare alla cieca. In particolare, il Save the Date storico e il lifecycle
inviti fanno affidamento sul contratto di mapping/contact della base alternativa;
il lifecycle storico usa inoltre una CLI operativa con actor dichiarato e non
una Server Action autorizzata da Clerk. La 014 presente nel branch è una
reimplementazione del solo contratto SQL, adattata alla base corrente; UI e
grant 015 restano separati. Nessuna migration 012–014 è stata applicata a Neon.

## Household UUID e Google Sheets → Neon

Il flusso Household UUID legge e valida le schede Guest List e Households, conserva l’identità esterna degli invitati e distingue i nuclei tramite UUID. Modalità e contenuto delle due schede sono vincolati in Preview/Apply; la migrazione 010 applica il mapping nel runtime. Il percorso legacy resta esplicito e non viene attivato automaticamente dalla sola presenza delle colonne.

La sincronizzazione corrente legge le schede autorizzate in sola lettura, limita la sorgente a 5.000 righe, gestisce timeout/retry e non elimina righe assenti. Preview/Apply rileggono e confrontano hash; Apply delega le verifiche transazionali al DB. Token, risposte e nuclei già emessi/replied sono protetti. Il percorso Household UUID usa l'identità esterna esplicita; quello legacy continua a usare il contratto storico.

La riconciliazione non può usare nomi o numeri di riga. La migrazione 011 fornisce una procedura owner-only che richiede il roster completo e univoco dei Sync UUID, senza scegliere o approvare automaticamente il mapping. Nessuna mappatura reale è stata eseguita.

## Invitation, dashboard e risposta offline

- Il generatore crea token casuali da 256 bit, salva solo SHA-256 e scrive QR/manifest in output privato. Richiede URL HTTPS definitivo e rifiuta input/output nel repository. Genera nuovi household: non attiva record importati.
- La route RSVP risolve il token lato server. La Server Action valida i campi, applica Turnstile se configurato, rate limit e concorrenza ottimistica; il DB evita risposte identiche e non trasforma errori di servizio in successo.
- `/admin/rsvp` consulta stato e riepiloghi; export CSV protetto applica formula-injection defense e audit.
- La migration 014 fornisce il contratto DB locale per inserire/correggere risposte offline, distinguendo provenienza, attore e motivo strutturato, con audit metadata-only e revisione condivisa. Non invia notifiche.
- Adapter e Server Actions proteggono lettura e scrittura con Clerk/allowlist, derivano l'actor dalla sessione e firmano HMAC il payload; il form admin consente preview/revisione, attestazione e retry identico in memoria. Email e risposte non sono inferite da Sheets.
- Migration 015 limita la lettura dell'audit a una funzione metadata-only concessa al ruolo sync; il ruolo runtime resta negato. La dashboard mostra household, actor, provenienza, motivo, revisione e data. Il walkthrough browser Clerk resta aperto. Nessun messaggio è inviato.
- L’attivazione inviti importati va separata dal generatore: lookup per Household UUID, verifica roster/stato, token singolo, QR privato, atomicità, replay-safety e gestione revoca/riemissione.

## Sicurezza, autorizzazioni e idempotenza

- `lib/admin/auth.ts` protegge le route/azioni admin con Clerk e richiede un indirizzo email verificato nella allowlist `RSVP_ADMIN_EMAILS`; controlli lato server.
- Token RSVP opachi; nel DB viene conservato l’hash. I dati RSVP sono server-side e non usano `localStorage`.
- Validazione Zod, rate limit per household, Turnstile configurabile e versione ottimistica per conflitti.
- Migrazioni revocano accesso `PUBLIC`; le funzioni sync `SECURITY DEFINER` fissano `search_path`, serializzano scritture e il ruolo sync non riceve accesso diretto alle tabelle RSVP.
- Export CSV autenticato, protezione formule e audit con metadati.
- Test e rapporti storici verificano localmente replay, stale snapshot, allowlist, grant/deny e conservazione dati fittizi. Non sono state verificate configurazioni live, MFA, ruoli reali, policy deploy o database di produzione.

## Test esistenti e copertura assente

Nel branch di lavoro sono presenti test Node in `tests/guest-sync/` e
`tests/rsvp/` per parser/piano, UUID, Google adapter, allowlist Clerk, workflow,
replay, mapping Household UUID e migrazioni SQL 008–014. Il precedente
checkpoint dello Step 7.4 registrava 140 test; la suite pre-8.6a conteneva 160
test locali. La suite guest-sync/RSVP/Save-the-Date del checkpoint 8.6b
conteneva 169 test passati; i checkpoint 8.6c–8.6e aggiungono test del form,
del contratto/grant SQL e dell'adapter per 174 test totali con PGlite e fixture
sintetiche. Non sono test live di Neon, Sheets o Clerk.
Alcuni test del lifecycle storico esistono solo nella storia locale alternativa
e non verificano la base attuale.

I bullet 7 e 8.1–8.6e hanno test locali sintetici per planner, receipt,
autorizzazione, SQL atomico/replay, QR in memoria, revisione offline, grant
read-only minimizzati del journal e adapter dashboard.
Non sono stati eseguiti test con Neon/Sheets/Clerk live, concorrenza
multi-connessione o walkthrough browser autenticato. La review indipendente
Codex per gli Step 8.4–8.6e è
`INFRASTRUCTURE BLOCKED`: Codex CLI non è installato nel checkout.

## Dipendenze tecniche

- Next.js 16 App Router, React 19, TypeScript strict, Zod 4.
- Neon Postgres e `@neondatabase/serverless`; schema SQL 001–014 e ruoli DB separati.
- Clerk (`@clerk/nextjs`) con allowlist; Cloudflare Turnstile e rate limit RSVP.
- Google Sheets API read-only via service account; script Apps Script per UUID ospite.
- `qrcode` per QR privati; `node:test` e PGlite per test locali di sync/SQL;
  TypeScript, ESLint e build Next.js per controlli del progetto.
- Nessun provider di comunicazioni Save the Date è presente nel codice.

## Rischi

1. L’etichetta `Party / family` non è una chiave stabile; usarla dopo rinomina può associare o duplicare household.
2. Riconciliare per nome/cognome/ordine righe può alterare inviti e risposte.
3. Eseguire il generatore QR sugli importati può creare household duplicati.
4. I commit locali 012–015 usano una base 010–011 incompatibile e non pubblicata; portarli senza adattamento può sovrascrivere o aggirare il contratto v3 attuale.
5. Inserire risposte offline senza provenienza, audit e controllo concorrenza può sovrascrivere risposte degli ospiti.
6. Save the Date coinvolge recapiti e invii personali; scopo, canali e minimizzazione vanno specificati prima del codice.
7. Test locali non verificano configurazioni live né comportamento reale sotto concorrenza.

## Piano ordinato di ricostruzione

1. **Completato in sola lettura:** recuperare la storia locale dei commit `179bfd4`, `0f26498`, `59025e7`, `51fb37a` e confrontare le migrazioni storiche 010–015 con la base attuale. I commit sono locali soltanto; la compatibilità funzionale resta da risolvere.
2. Household UUID runtime 9C.1–9C.3 completato; la migrazione resta non applicata fuori dai test locali.
3. Procedura tecnica di riconciliazione completata; mapping reale resta separato e non autorizzato da questo step.
4. Conservare e confrontare i commit locali 012–015 con la base runtime/reconciliation 010–011 corrente. Non integrare la vecchia coppia 010–011 né sovrascrivere Step 8.1–8.2.
5. **Step 7.1–7.5c implementati:** planner, draft, ricevuta HMAC, journal SQL atomico, adapter DB, azioni admin Clerk/allowlist e pagina di revisione/conferma sono verificati con fixture e build. Il browser Clerk autenticato resta da provare in ambiente di test.
6. **Step 8.1–8.5 implementati:** preview, interfaccia admin, transazione SQL atomica, preparazione con receipt firmata, conferma Clerk/allowlist, replay e handoff privato URL/QR generato nel browser. Il raw token resta nella memoria della pagina e non è recuperabile dopo refresh/chiusura; nessuna comunicazione automatica.
7. **8.6a–8.6e implementati:** migration 014, adapter, azioni Clerk, form admin, migration 015 e storico audit in dashboard; fixture sintetiche e grant/deny testati localmente. Migration non applicate a Neon.
8. Fare walkthrough con Clerk autenticato e dati sintetici nel browser.
9. Chiudere con test SQL PostgreSQL multi-connessione, browser Clerk autenticato fittizio e gate backup/rollback. Nessun deploy o dato reale.

## Validazione dell’audit

L'audit iniziale era una verifica statica di sorgenti, SQL, test e guide su
`8e5bbdd5`. I successivi bullet Step 8.3–8.5 sono stati verificati con la suite
guest-sync/RSVP, lint, TypeScript, build webpack e `git diff --check`, usando
solo fixture sintetiche. Step 8.6a–8.6e è stato verificato con 174 test
PGlite/fixture sintetiche, lint, TypeScript, build webpack
e `git diff --check`. Il build standard
Turbopack ha fallito in questo ambiente durante il caricamento del database di
persistence; `next build --webpack` è passato. Non sono state eseguite letture o scritture live su
Sheets o Neon, generate QR per invitati reali, inviate comunicazioni, né fatti
merge o deploy. La review indipendente Codex CLI resta
`INFRASTRUCTURE BLOCKED` perché il comando non è disponibile in questo checkout;
il runner ha inoltre segnalato un errore nel test del timeout del workflow multiagent (`125`).
