# SITE LOVE — audit recupero roadmap, Step 9B

Data: 6 novembre 2026
Branch: `feat/roadmap-recovery-20261106`
Commit di riferimento: `8e5bbdd5f63519f67d9dd242e8323bcd1b6dc1cc`

### Addendum di riconciliazione — 7 novembre 2026

La punta del branch remoto include il checkpoint Step 8.2 (`3026cfb`). La
storia locale del branch `docs/household-uuid-plan` conserva i commit 012–015,
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
DEVELOPMENT e backup/ripristino. Gli artefatti 012–015 sono assenti dal branch
di lavoro remoto, ma sono stati recuperati nella storia locale di
`docs/household-uuid-plan`; dipendono da una diversa base Household UUID e non
sono stati integrati.

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
| 7. Save the Date | **PARZIALE: planner 7.1 presente; registrazione e UI mancanti** | Planner read-only per mapping esatto `(source_id, external_household_id)`, roster, contatto nominativo e lingua; test sintetici. Il commit locale `179bfd4` resta un riferimento storico non integrato. | Mancano preparazione privata di testo/canale, eventi atomici per gli esiti manuali, pagina admin e test UI. Il campo di planning `Invitation` non invia comunicazioni. |
| 8. Emissione inviti/QR, dashboard RSVP e risposte offline | **PARZIALE; preview admin 8.1–8.2 completata, attivazione ancora aperta** | Generatore per nuovi nuclei, route RSVP personale, dashboard/export online e preview admin read-only per nuclei importati. Il commit locale `0f26498` aggiungeva un lifecycle per household esistenti, non integrato nel branch remoto. | L'attivazione richiesta deve selezionare il mapping esplicito e passare da Clerk/allowlist; il lifecycle storico usa un diverso contratto operativo e non è ancora una soluzione compatibile. Le risposte offline restano da integrare o reimplementare. |

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

Le migrazioni `012`–`015` non sono presenti nel branch di lavoro remoto, ma la storia locale `docs/household-uuid-plan` contiene i commit `179bfd4`, `0f26498`, `59025e7` e `51fb37a`. Non fanno parte del branch corrente né risultano pubblicati su GitHub. Il worktree registrato per quel branch non è disponibile.

I commit storici 012–015 si basano anche su una coppia di migrazioni diversa:
`010_guest_sync_household_foundation.sql` e
`011_guest_sync_household_runtime.sql`. Il branch di lavoro usa invece
`010_guest_sync_household_runtime.sql` e
`011_guest_sync_household_reconciliation.sql`. La 010 storica introduce mapping
di staging, campi baseline/contact e una barriera all'attivazione; la 011
storica sostituisce il flusso di staging con l'attivazione UUID globale e un
Apply v3. Il branch attuale registra invece modalità e mapping runtime in 010 e
fornisce in 011 una riconciliazione owner-only per mapping esatti.

Per questo le migrazioni e il codice 012–015 non si possono cherry-pickare o
applicare alla cieca. In particolare, il Save the Date storico e il lifecycle
inviti fanno affidamento sul contratto di mapping/contact della base alternativa;
il lifecycle storico usa inoltre una CLI operativa con actor dichiarato e non
una Server Action autorizzata da Clerk. Conservare i commit originali, portare
solo i comportamenti necessari e adattarli al contratto corrente. Nessuna delle
migrazioni 012–015 è stata applicata a Neon.

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

Nel branch di lavoro sono presenti test Node in `tests/guest-sync/` per
parser/piano, UUID, nome/cognome, Google adapter, allowlist Clerk, workflow,
replay, UI Preview, mapping Household UUID e migrazioni SQL 008–011. La suite
eseguita durante l'integrazione dello Step 8.2 ha superato 127 test con PGlite,
senza test saltati; TypeScript, lint e build sono passati. Non sono test live di
Neon, Sheets o Clerk. I test Save the Date, lifecycle, RSVP offline e roadmap
esistono solo nella storia locale alternativa e non verificano la base attuale.

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
4. I commit locali 012–015 usano una base 010–011 incompatibile e non pubblicata; portarli senza adattamento può sovrascrivere o aggirare il contratto v3 attuale.
5. Inserire risposte offline senza provenienza, audit e controllo concorrenza può sovrascrivere risposte degli ospiti.
6. Save the Date coinvolge recapiti e invii personali; scopo, canali e minimizzazione vanno specificati prima del codice.
7. Test locali non verificano configurazioni live né comportamento reale sotto concorrenza.

## Piano ordinato di ricostruzione

1. **Completato in sola lettura:** recuperare la storia locale dei commit `179bfd4`, `0f26498`, `59025e7`, `51fb37a` e confrontare le migrazioni storiche 010–015 con la base attuale. I commit sono locali soltanto; la compatibilità funzionale resta da risolvere.
2. Household UUID runtime 9C.1–9C.3 completato; la migrazione resta non applicata fuori dai test locali.
3. Procedura tecnica di riconciliazione completata; mapping reale resta separato e non autorizzato da questo step.
4. Conservare e confrontare i commit locali 012–015 con la base runtime/reconciliation 010–011 corrente. Non integrare la vecchia coppia 010–011 né sovrascrivere Step 8.1–8.2.
5. **Step 7.1 completato:** planner read-only compatibile col mapping corrente; proseguire con preparazione privata di canale/testo e ricevuta, senza invio.
6. Completare l'attivazione richiesta per mapping UUID esplicito, riusando dal lifecycle storico solo i contratti compatibili: Clerk/allowlist, selezione `(source_id, external_household_id)`, preservazione di identità/risposte, token hash-only, atomicità, replay safety e output QR privato senza invio.
7. Valutare separatamente le risposte offline (014) e i grant (015); verificare la parità con il runtime corrente prima di portarli. Chiudere con test SQL isolati, concorrenza PostgreSQL, browser autenticato fittizio e gate backup/rollback. Nessun deploy o dato reale.

## Validazione dell’audit

Verifica statica di sorgenti, SQL, test e guide su `8e5bbdd5`. Nessun test,
build, accesso a servizi, lettura/scrittura Sheets o Neon, modifica grafica o
verifica visuale è stata eseguita. Per questo documento e il changelog si
applicano `git diff --check` e revisione del diff limitato ai due file.
