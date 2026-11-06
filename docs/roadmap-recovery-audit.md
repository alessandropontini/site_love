# SITE LOVE — audit recupero roadmap, Step 9B

Data: 6 novembre 2026
Branch: `feat/roadmap-recovery-20261106`
Commit di riferimento: `8e5bbdd5f63519f67d9dd242e8323bcd1b6dc1cc`

## Scopo e limiti

Questo audit confronta codice, migrazioni, test e documentazione versionati. Non implementa né ricostruisce funzionalità; non legge o scrive Google Sheets o Neon; non consulta dati reali, credenziali, token o esportazioni. La parte grafica resta fuori perimetro.

Il repository documenta esplicitamente gli step 1–3, 4, 5 e 6, ma non contiene una definizione canonica completa della roadmap 1–8. Gli step 7–8 sono ricondotti qui ai sistemi Save the Date, inviti, dashboard RSVP e risposte offline citati nella richiesta. La corrispondenza è quindi una ricostruzione del perimetro, non prova dei titoli o criteri originari.

**COMPLETA** significa implementazione presente e coperta da verifiche locali documentate; **PARZIALE**, parte del flusso presente ma requisito mancante; **MANCANTE**, implementazione non trovata; **DA VERIFICARE**, prove insufficienti. La sola documentazione non rende completa una funzionalità.

## Stato degli step 1–8

| Step / funzionalità | Stato | Evidenze nel repository | Lacuna o limite |
| --- | --- | --- | --- |
| 1. Identità stabile degli invitati e assegnazione UUID | **COMPLETA** | `scripts/guest-sync-identifiers.gs`; `tests/guest-sync/identifiers.test.cjs`; `docs/guest-names-step-1-3.md`. Lo script preserva ID esistenti e blocca duplicati/errori. | Test dello script in mock; installazione e uso sul foglio reale non verificati in questo audit. |
| 2. Nome e cognome senza perdita di identità | **COMPLETA** | `lib/guest-sync/model.ts`; `app/admin/guests/GuestListSynchronization.tsx`; test `names`, `surname`, `presentation`; `docs/guest-names-step-1-3.md`. Nomi dei bambini e posti anonimi sono minimizzati. | La qualità dei valori nel foglio richiede verifica umana, non effettuata qui. Nessuna migrazione dedicata: i dati di planning sono nel JSONB di 008. |
| 3. Sincronizzazione manuale Sheets → Neon | **COMPLETA** nel contratto legacy `Party / family` | `app/admin/guests/`; `lib/guest-sync/{google,model,workflow,db,receipt,service}.ts`; migrazioni 008–009; `tests/guest-sync/`; `docs/guest-list-sync-validation.md`. Preview read-only, Apply esplicito, ricevuta firmata, rilettura delle sorgenti, controlli SQL. | Non supporta la chiave Household UUID. Le verifiche sono su dati fittizi/locali; non attestano credenziali Google, permessi live o concorrenza Neon reale. |
| 4. Household UUID come identità stabile del nucleo | **MANCANTE** nel runtime; **PARZIALE** nella progettazione | Specifica in `docs/households-design.md`. Parser e SQL 008–009 raggruppano per etichetta `Party / family` e mappano gli UUID dei singoli invitati. Ricerca nel runtime: nessuna gestione `Household UUID`/`Host Sync UUID`. | Mancano lettura e validazione del foglio Households, chiave UUID esterna, snapshot/plan/Apply basati su tale chiave, vincoli SQL, UI Preview e test end-to-end. |
| 5. Riconciliazione dei nuclei Neon esistenti | **PARZIALE** | Proposta in `docs/guest-reconciliation.md`; blocco nuclei senza mapping in `lib/guest-sync/model.ts`; esclusioni test e relative garanzie in migrazione 009 e `tests/guest-sync/exclusions.test.cjs`. | Le esclusioni test non mappano gli invitati reali. Mancano mapping approvato Household UUID → `rsvp.households.id` e relativa migrazione/procedura. Neon non è stato interrogato in questo audit. |
| 6. Preview/Apply amministrativo della sincronizzazione | **COMPLETA** nel perimetro legacy | `app/admin/guests/GuestListSynchronization.tsx`; `lib/guest-sync/workflow.ts`; SQL 008–009; test `engine`, `database`, `google`, `auth`, `exclusions`, `presentation`. | È distinta dalla dashboard RSVP e non copre Household UUID. Test multi-connessione Neon e browser autenticato restano da fare. |
| 7. Save the Date | **MANCANTE** | Nessuna route, UI, modello, API, job o test per preparare/inviare comunicazioni Save the Date trovato in app, componenti, lib, script e docs. Il campo di planning `Invitation` non invia comunicazioni. | Mancano destinatari/canali, contenuti, stati di invio, log, retry/idempotenza, autorizzazioni, UI e test. Eventuali attività manuali fuori repository: **DA VERIFICARE**. |
| 8. Emissione inviti/QR, dashboard RSVP e risposte offline | **PARZIALE** | `scripts/create-rsvp-invitations.mjs`, `lib/rsvp/token.ts`, `app/rsvp/[token]/`; `lib/rsvp/db.ts`, `app/rsvp/[token]/actions.ts`; dashboard/export in `app/admin/rsvp/` e `app/admin/rsvp/export/route.ts`; SQL 001–007. | Il generatore crea nuovi nuclei; la sync crea nuclei disabilitati senza token. Manca attivazione dei nuclei importati mantenendone l’identità. Dashboard consultazione/export online; non trovati registrazione/correzione di risposte offline o coda offline del form. |

## Architettura e componenti presenti

- Next.js App Router: home pubblica `app/page.tsx`; route privata `/rsvp/[token]`; aree admin `/admin/rsvp` e `/admin/guests`.
- Neon Postgres per risposte RSVP e planning; sincronizzazione Google Sheets manuale, server-side e con scope API read-only.
- Clerk per identità amministrativa, con allowlist di email verificata. Ruoli DB runtime e sync distinti secondo le migrazioni e le guide.
- QR generati localmente in cartella privata esterna al repository. Non esiste un flusso Save the Date; `lib/rsvp/email.ts` serve le conferme del modulo RSVP.
- Il contenuto grafico e gli asset non sono stati modificati né valutati visivamente.

## Migrazioni SQL 001–009

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

**Da recuperare:** i file `010`–`015` non esistono nel branch né in `db/migrations/`. Il contenuto non è deducibile dal codice. Il design Household UUID propone una migrazione successiva a 008, ma non stabilisce numero o implementazione. Non ricostruire/applicare SQL per supposizione: servono gli artefatti originali oppure una specifica approvata, più piano backup/rollout/rollback.

## Household UUID e Google Sheets → Neon

Il flusso corrente raggruppa per testo `Party / family` e conserva l’identità esterna del singolo posto. Il design Household UUID richiede un UUID permanente per household, una scheda separata, collegamenti Host Sync UUID, regole di rinomina/spostamento e protezioni contro fusioni per nomi simili. Il runtime attuale non legge la scheda, né include Household UUID in parser, hash, ricevuta, snapshot o Apply SQL.

La sincronizzazione corrente legge la scheda Guest List senza cache, usa autorizzazione read-only, limita la sorgente a 5.000 righe, gestisce timeout/retry e non elimina righe assenti. Preview/Apply rileggono e confrontano hash; Apply delega le verifiche transazionali al DB. Token, risposte e nuclei già emessi/replied sono protetti. Queste garanzie non forniscono però l’identità stabile del nucleo richiesta dallo step 4.

La riconciliazione non può usare nomi o numeri di riga. Nuclei legacy non mappati bloccano l’import; la migrazione 009 riguarda solo classificazioni esplicite di test e non identifica o associa i nuclei reali.

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
Google adapter, allowlist Clerk, workflow, replay, UI Preview e migrazioni SQL/
esclusioni. `docs/guest-list-sync-validation.md` registra 47 test nella prima
consegna; documentazione e changelog successivi riportano 76 e 97 test, più
TypeScript, lint e build. Sono risultati storici, non rieseguiti per questo audit.

Non risultano test dedicati a Save the Date, attivazione di nuclei importati,
risposte offline, dashboard RSVP end-to-end, Household UUID end-to-end o SQL
010–015. Da svolgere anche: test reali multi-connessione Neon, Google/Clerk
autenticati, browser con dati fittizi, email e restore backup.

## Dipendenze tecniche

- Next.js 16 App Router, React 19, TypeScript strict, Zod 4.
- Neon Postgres e `@neondatabase/serverless`; schema SQL 001–009 e ruoli DB separati.
- Clerk (`@clerk/nextjs`) con allowlist; Cloudflare Turnstile e rate limit RSVP.
- Google Sheets API read-only via service account; script Apps Script per UUID ospite.
- `qrcode` per QR privati; `node:test` e PGlite per test locali di sync/SQL;
  TypeScript, ESLint e build Next.js per controlli del progetto.
- Nessun provider di comunicazioni Save the Date è presente nel codice.

## Rischi

1. L’etichetta `Party / family` non è una chiave stabile; usarla dopo rinomina può associare o duplicare household.
2. Riconciliare per nome/cognome/ordine righe può alterare inviti e risposte.
3. Eseguire il generatore QR sugli importati può creare household duplicati.
4. Migrazioni 010–015 assenti: schema atteso, permessi e rollback non verificabili.
5. Inserire risposte offline senza provenienza, audit e controllo concorrenza può sovrascrivere risposte degli ospiti.
6. Save the Date coinvolge recapiti e invii personali; scopo, canali e minimizzazione vanno specificati prima del codice.
7. Test locali non verificano configurazioni live né comportamento reale sotto concorrenza.

## Piano ordinato di ricostruzione

1. Cercare artefatti originali per `179bfd4`, `0f26498`, `59025e7`, `51fb37a` e SQL 010–015. Se non disponibili, approvare requisiti nuovi senza rivendicare equivalenza col codice perso.
2. Completare Household UUID end-to-end: specifica compatibile, parser, snapshot/hash/Apply, SQL e privilegi, Preview e test isolati. Niente associazioni automatiche.
3. Eseguire una riconciliazione esplicita e approvata dei nuclei esistenti, con backup/restore, ambiente verificato, mapping privato e controlli prima/dopo.
4. Progettare l’attivazione degli household importati per UUID, mantenendo token univoci, protezione risposte e operazioni idempotenti; separarla dal generatore attuale.
5. Definire e implementare risposta offline con fonte/autore, motivo, audit, concorrenza e regole di notifica; coprire con test UI/DB.
6. Specificare Save the Date (destinatari, canale, contenuto approvato, stato, retry, audit, privacy), poi implementare e testare.
7. Gate di rilascio: test SQL isolati, concorrenza Neon, browser autenticato con dati fittizi, review di sicurezza quando applicabile e piano backup/rollback. Nessun deploy o dato reale nell’ambito di questo audit.

## Validazione dell’audit

Verifica statica di sorgenti, SQL, test e guide su `8e5bbdd5`. Nessun test,
build, accesso a servizi, lettura/scrittura Sheets o Neon, modifica grafica o
verifica visuale è stata eseguita. Per questo documento e il changelog si
applicano `git diff --check` e revisione del diff limitato ai due file.
