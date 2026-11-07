# SITE LOVE — audit recupero roadmap, Step 9B

Data: 6 novembre 2026
Branch: `feat/roadmap-recovery-20261106`
Commit di riferimento: `8e5bbdd5f63519f67d9dd242e8323bcd1b6dc1cc`

## Avanzamento successivo all'audit

Il rilievo è uno snapshot storico al commit indicato. In seguito è stato
completato il runtime Household UUID (9C.1–9C.3) e aggiunta la migrazione 011
con procedura owner-only per mapping esatti e approvati (step 5). Le migrazioni
010–011 sono state verificate solo localmente con dati fittizi; nessun mapping
live è stato eseguito. La riconciliazione reale resta quindi da svolgere per
ogni household solo dopo approvazione esplicita, mappa verificata, conferma
DEVELOPMENT e backup/ripristino. Restano da ricostruire gli artefatti 012–015.

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
| 7. Save the Date | **MANCANTE** | Nessuna route, UI, modello, API, job o test per preparare/inviare comunicazioni Save the Date trovato in app, componenti, lib, script e docs. Il campo di planning `Invitation` non invia comunicazioni. | Mancano destinatari/canali, contenuti, stati di invio, log, retry/idempotenza, autorizzazioni, UI e test. Eventuali attività manuali fuori repository: **DA VERIFICARE**. |
| 8. Emissione inviti/QR, dashboard RSVP e risposte offline | **PARZIALE; preview admin 8.1–8.2 completata, attivazione è il prossimo bullet** | Generatore per nuovi nuclei, route RSVP personale, dashboard/export online e preview admin read-only per nuclei importati. | Manca l'attivazione atomica/idempotente con token e QR privati. Mancano inoltre registrazione/correzione amministrativa delle risposte offline. |

## Architettura e componenti presenti

- Next.js App Router: home pubblica `app/page.tsx`; route privata `/rsvp/[token]`; aree admin `/admin/rsvp` e `/admin/guests`.
- Neon Postgres per risposte RSVP e planning; sincronizzazione Google Sheets manuale, server-side e con scope API read-only.
- Clerk per identità amministrativa, con allowlist di email verificata. Ruoli DB runtime e sync distinti secondo le migrazioni e le guide.
- QR generati localmente in cartella privata esterna al repository. Non esiste un flusso Save the Date; `lib/rsvp/email.ts` serve le conferme del modulo RSVP.
- Il contenuto grafico e gli asset non sono stati modificati né valutati visivamente.

## Migrazioni SQL 001–011

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

**Da recuperare:** gli artefatti `012`–`015` non sono presenti nel branch corrente; non dedurne il contenuto. Le migrazioni 010–011 sono nuove, verificate localmente e non applicate a Neon. Per qualsiasi applicazione reale servono specifica, ambiente, backup e autorizzazione separata.

## Household UUID e Google Sheets → Neon

Il flusso Household UUID legge e valida le schede Guest List e Households, conserva l’identità esterna degli invitati e distingue i nuclei tramite UUID. Modalità e contenuto delle due schede sono vincolati in Preview/Apply; la migrazione 010 applica il mapping nel runtime. Il percorso legacy resta esplicito e non viene attivato automaticamente dalla sola presenza delle colonne.

La sincronizzazione corrente legge le schede autorizzate in sola lettura, limita la sorgente a 5.000 righe, gestisce timeout/retry e non elimina righe assenti. Preview/Apply rileggono e confrontano hash; Apply delega le verifiche transazionali al DB. Token, risposte e nuclei già emessi/replied sono protetti. Il percorso Household UUID usa l'identità esterna esplicita; quello legacy continua a usare il contratto storico.

La riconciliazione non può usare nomi o numeri di riga. La migrazione 011 fornisce una procedura owner-only che richiede il roster completo e univoco dei Sync UUID, senza scegliere o approvare automaticamente il mapping. Nessuna mappatura reale è stata eseguita.

## Invitation, dashboard e risposta offline

- Il generatore crea token casuali da 256 bit, salva solo SHA-256 e scrive QR/manifest in output privato. Richiede URL HTTPS definitivo e rifiuta input/output nel repository. Genera nuovi household: non attiva record importati.
- La route RSVP risolve il token lato server. La Server Action valida i campi, applica Turnstile se configurato, rate limit e concorrenza ottimistica; il DB evita risposte identiche e non trasforma errori di servizio in successo.
- `/admin/rsvp` consulta stato e riepiloghi; export CSV protetto applica formula-injection defense e audit.
- Nessuna UI/admin action per inserire o correggere risposte raccolte offline è stata trovata. Una futura funzione deve distinguere fonte e autore, richiedere motivo, registrare audit, usare concorrenza e impedire doppie notifiche.
- L’attivazione inviti importati va separata dal generatore: lookup per Household UUID, verifica roster/stato, token singolo, QR privato, atomicità, replay-safety e gestione revoca/riemissione.

## Sicurezza, autorizzazioni e idempotenza

- `lib/admin/auth.ts` protegge le route/azioni admin con Clerk e richiede un indirizzo email verificato nella allowlist `RSVP_ADMIN_EMAILS`; controlli lato server.
- Token RSVP opachi; nel DB viene conservato l’hash. I dati RSVP sono server-side e non usano `localStorage`.
- Validazione Zod, rate limit per household, Turnstile configurabile e versione ottimistica per conflitti.
- Migrazioni revocano accesso `PUBLIC`; le funzioni sync `SECURITY DEFINER` fissano `search_path`, serializzano scritture e il ruolo sync non riceve accesso diretto alle tabelle RSVP.
- Export CSV autenticato, protezione formule e audit con metadati.
- Test e rapporti storici verificano localmente replay, stale snapshot, allowlist, grant/deny e conservazione dati fittizi. Non sono state verificate configurazioni live, MFA, ruoli reali, policy deploy o database di produzione.

## Test esistenti e copertura assente

Presenti test Node in `tests/guest-sync/` per parser/piano, UUID, nome/cognome,
Google adapter, allowlist Clerk, workflow, replay, UI Preview, mapping Household
UUID e migrazioni SQL 008–011. La suite eseguita durante l'integrazione di questo
step ha superato 119 test con PGlite, senza test saltati; TypeScript, lint e
build sono passati. Non sono test live di Neon, Sheets o Clerk.

Non risultano test dedicati a Save the Date, attivazione di nuclei importati,
risposte offline o dashboard RSVP end-to-end. Da svolgere anche: test reali
multi-connessione Neon, Google/Clerk autenticati, browser con dati fittizi,
email e restore backup.

## Dipendenze tecniche

- Next.js 16 App Router, React 19, TypeScript strict, Zod 4.
- Neon Postgres e `@neondatabase/serverless`; schema SQL 001–011 e ruoli DB separati.
- Clerk (`@clerk/nextjs`) con allowlist; Cloudflare Turnstile e rate limit RSVP.
- Google Sheets API read-only via service account; script Apps Script per UUID ospite.
- `qrcode` per QR privati; `node:test` e PGlite per test locali di sync/SQL;
  TypeScript, ESLint e build Next.js per controlli del progetto.
- Nessun provider di comunicazioni Save the Date è presente nel codice.

## Rischi

1. L’etichetta `Party / family` non è una chiave stabile; usarla dopo rinomina può associare o duplicare household.
2. Riconciliare per nome/cognome/ordine righe può alterare inviti e risposte.
3. Eseguire il generatore QR sugli importati può creare household duplicati.
4. Migrazioni 012–015 non presenti: requisiti e contenuto non ricostruibili per supposizione.
5. Inserire risposte offline senza provenienza, audit e controllo concorrenza può sovrascrivere risposte degli ospiti.
6. Save the Date coinvolge recapiti e invii personali; scopo, canali e minimizzazione vanno specificati prima del codice.
7. Test locali non verificano configurazioni live né comportamento reale sotto concorrenza.

## Piano ordinato di ricostruzione

1. Cercare gli artefatti originali restanti (`179bfd4`, `0f26498`, `59025e7`, `51fb37a` e SQL 012–015); se mancanti, definire requisiti nuovi senza attribuire loro equivalenza con codice non recuperato.
2. Household UUID runtime 9C.1–9C.3 completato; la migrazione resta non applicata fuori dai test locali.
3. Procedura tecnica di riconciliazione completata; mapping reale resta separato e non autorizzato da questo step.
4. **Step 8.1–8.2 completati: preview e revisione admin degli household importati. Prossimo bullet: attivazione per mapping UUID esplicito**, preservando identità e risposte, con token opachi, atomicità e idempotenza; separata dal generatore attuale.
5. Definire e implementare risposta offline con fonte/autore, motivo, audit, concorrenza e regole di notifica; coprire con test UI/DB.
6. Specificare Save the Date (destinatari, canale, contenuto approvato, stato, retry, audit, privacy), poi implementare e testare.
7. Gate di rilascio: test SQL isolati, concorrenza Neon, browser autenticato con dati fittizi, review di sicurezza quando applicabile e piano backup/rollback. Nessun deploy o dato reale nell’ambito di questo audit.

## Validazione dell’audit

Verifica statica di sorgenti, SQL, test e guide su `8e5bbdd5`. Nessun test,
build, accesso a servizi, lettura/scrittura Sheets o Neon, modifica grafica o
verifica visuale è stata eseguita. Per questo documento e il changelog si
applicano `git diff --check` e revisione del diff limitato ai due file.
