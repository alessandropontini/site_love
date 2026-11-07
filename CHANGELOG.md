# Changelog

Le modifiche completate vengono annotate qui in modo conciso. Le voci sono raggruppate per attività, non per commit.

## Unreleased

### Architettura e roadmap di completamento Step 8
- Documentati flusso attuale, verifiche locali possibili, gate Clerk/Neon e proposta separata per revoca/riemissione degli inviti, con decisioni di prodotto e criteri di chiusura.
- Nessuna nuova funzionalità è stata introdotta; la rotazione token resta una proposta e richiede decisione prima dell'implementazione.

### Runbook verifiche manuali Step 8
- Preparata una procedura per walkthrough Clerk/allowlist con account di test e restore/rollback su branch Neon isolato, con risultati attesi, criteri di esito e gestione sicura degli artefatti.
- Le procedure non contattano servizi né concedono autorizzazione per Clerk, Neon, Sheets o dati reali; i due gate restano separati e non eseguiti.

### Handoff AI e stato verifiche Step 8
- Registrato il passaggio di stato remoto `20068ddd8c9d4bf6d4806f72343c3aff039fd8b2`: GitHub Actions ha superato test PostgreSQL 16 concorrente e backup/restore con fixture sintetiche.
- Aggiunta una guida di handoff per le prossime AI e riallineate le istruzioni di workflow sull'autorizzazione ai checkpoint GitHub; restano espliciti i gate Clerk e Neon non eseguiti.
- Revisione statica non indipendente di proxy, allowlist, pagine e Server Actions RSVP: nessuna criticità rilevata nel perimetro ispezionato; il walkthrough Clerk autenticato resta necessario.

### Step 8 — verifica PostgreSQL nativo e backup/restore sintetico
- Aggiunto un workflow GitHub Actions con PostgreSQL 16 temporaneo: applica le migrazioni 001–015, lancia due attivazioni concorrenti su un household fittizio e verifica una sola attivazione con un replay.
- Il workflow usa il backup RSVP già presente, ripristina in un database effimero e confronta ID, mapping, stato, hash fittizio e journal; non usa Neon, Sheets o credenziali.

### Step 8.6e — storico offline nella dashboard RSVP
- Aggiunta alla dashboard admin una tabella con household, ID admin Clerk, provenienza, motivo, revisione e timestamp, letta solo dalla funzione read-only 015 dopo il controllo Clerk/allowlist.
- L'area RSVP principale resta disponibile se il journal non è raggiungibile e mostra un avviso; aggiunti test sintetici sull'adapter e sul rifiuto di campi non previsti.

### Step 8.6d — grant ristretto per audit RSVP offline
- Aggiunta migration 015: revoca la lettura diretta del journal `manual_response_events` dal ruolo `site_love_sync` e concede una sola funzione read-only con campi di audit minimizzati.
- Il ruolo runtime `site_love_app` e `PUBLIC` non possono leggere il journal né invocare la funzione. Test PGlite coprono campi ammessi, grants e diniego; migration non applicata a Neon. La presentazione in dashboard resta separata.

### Step 8.6c — interfaccia admin per risposte RSVP offline
- Aggiunta `/admin/rsvp/manual` protetta da Clerk/allowlist, con selezione di household esistenti, caricamento roster su azione esplicita e revisione di identità e risposte correnti.
- Il form lascia l'email vuota, richiede provenienza, motivo compatibile con lo stato, attestazione e conferma esplicita; conserva gli ID esistenti e non invia comunicazioni.
- In caso di esito incerto i campi si bloccano e si può ritentare solo il payload identico mantenuto in memoria. Aggiunte fixture sintetiche per draft, motivo, IDs e validazione; riepilogo dashboard/grant 015 restano separati.
- Separato lo schema condiviso dal modulo HMAC Node per mantenere la firma esclusivamente server-side e non includere `node:crypto` nel bundle client.

### Step 8.6b — adapter e azioni amministrative RSVP offline
- Aggiunto adapter server-only sul ruolo DB dedicato e due Server Actions: lettura di un household per ID interno e registrazione con autorizzazione Clerk/allowlist verificata a ogni chiamata.
- L'attore deriva dalla sessione Clerk; Zod valida l'RSVP e richiede conferma amministrativa e attestazione che l'email sia stata fornita dal rispondente. Un HMAC lega attore, operazione, provenienza, motivo, attestazione e payload; gli errori DB sono sanitizzati. Nessuna comunicazione viene inviata.
- Aggiunti test sintetici di autorizzazione prima dell'accesso DB, firma/retry, input non attendibile, adapter SQL e sanitizzazione. UI e riepiloghi restano bullet separati.

### Step 8.6a — contratto database per risposte offline
- Aggiunta migration 014 adattata allo schema RSVP e ai grant attuali: le risposte raccolte offline usano la revisione condivisa, una chiave di replay e un journal metadata-only, senza modificare identità o token.
- Provenienza e motivo strutturato (`initial_offsite_response` / `correction`) sono obbligatori; il ruolo sync può invocare la funzione senza privilegi diretti di scrittura. Il form admin e i grant di lettura dashboard restano bullet separati. Migration non applicata a Neon.
- Aggiunte fixture PGlite sintetiche per scrittura, replay, correzione, conflitto di revisione, dati preservati e diniego al ruolo RSVP.

### Step 8.5 — handoff privato URL/QR
- Dopo l'attivazione confermata, l'admin può copiare l'URL RSVP privato e generare/scaricare un QR PNG su richiesta nel browser. Nessun QR viene scritto nel repository o inviato automaticamente.
- Il renderer accetta soltanto URL RSVP same-origin HTTPS con token opaco nel path, senza query/hash; testano output PNG e rifiuto di host/path non validi con un URL sintetico.

### Step 8.4 — conferma amministrativa e retry
- Aggiunte azioni Clerk/allowlist separate per preparazione e conferma esplicita del mapping selezionato; ogni richiesta admin riautentica prima di leggere Sheets o DB.
- La preparazione genera un token da 256 bit e restituisce token/receipt firmata solo al browser; il server persiste esclusivamente l'hash. Il client conserva il token in memoria, mentre retry idempotenti recuperano il commit anche dopo timeout/expiry senza inviare comunicazioni.
- Aggiunto controllo DB del commit preesistente per distinguere replay da prima attivazione e test sintetici per autorizzazione, drift, scadenza e retry. La migration aggiornata resta non applicata a Neon.

### Step 8.3 — transazione SQL per household importati
- Aggiunta migration 013 per attivare un household esistente soltanto tramite mapping Household UUID esplicito, senza creare o sostituire identità.
- La funzione serializza l'operazione, controlla mapping, roster persistito, esclusioni, token e attività RSVP, registra un evento idempotente e accetta solo il token hash. Test PGlite verificano replay, privilegi minimi e preservazione dei dati; migration non applicata a Neon.

### Step 7.5c — interfaccia privata di revisione Save the Date
- Aggiunta `/admin/save-the-date`, con preview su richiesta, selezione del solo household eleggibile, draft readonly e conferma separata dello stato manuale.
- La registrazione richiede una checkbox coerente con l'esito e dichiara che SITE LOVE non invia messaggi. Aggiunti test per le conferme e le transizioni consentite.

### Step 7.5b — azioni admin Save the Date
- Aggiunte azioni server per preview, preparazione e registrazione manuale, con Clerk/allowlist verificata a ogni chiamata.
- Il preview restituisce solo mapping e stato minimizzati; errori database imprevisti non espongono query o dettagli di connessione. Test sintetici verificano autorizzazione, privacy e sanitizzazione.

### Step 7.5a — adapter database Save the Date
- Aggiunto l'adapter server-side sul ruolo sync per leggere stato/storico e invocare la funzione SQL con request minimizzata.
- Il lookup replay confronta l'hash della stessa richiesta; i riepiloghi non espongono contatto o attore. Aggiunti test dell'adapter con query simulate.

### Step 7.4 — journal SQL Save the Date
- Aggiunta la migration 012 con stato versionato ed eventi append-only, legati al mapping Household UUID e al contatto nominativo.
- La funzione atomica valida modalità, mapping, esclusioni, replay e versione; `site_love_sync` riceve solo SELECT/EXECUTE e il runtime RSVP resta escluso.
- Test PGlite fittizi verificano la migration e i grant, inclusa la preservazione di household, invitee, token hash e risposta. Nessuna migration è stata applicata a Neon.

### Step 7.3 — ricevuta privata Save the Date
- Aggiunta ricevuta HMAC legata ad amministratore, mapping, sorgente, snapshot, canale, lingua e draft; i dati sorgente sono vincolati con commitment HMAC senza entrare nella ricevuta.
- Aggiunti controlli di attore, integrità, scadenza, cambi sorgente/snapshot e recupero replay prima della scadenza. Test con dipendenze fittizie; nessun esito è scritto da questo bullet.

### Step 7.2 — draft Save the Date bilingue
- Aggiunto il testo italiano/inglese collegato ai contenuti editoriali centrali e ai canali manuali approvati, inclusa la carta.
- Il draft non contiene destinatari né azioni di trasporto/invio; test sintetici verificano testo, lingua e canali.

### Step 7.1 — planner Save the Date read-only
- Aggiunto il controllo di eleggibilità su mapping Household UUID esplicito, roster, contatto nominativo, lingua e household esclusi, senza generare testi o leggere recapiti.
- Aggiunte fixture sintetiche per mapping mancanti/ambigui, roster divergenti e contatti non validi. Nessuna sorgente o database reale è stata consultata.

### Riconciliazione artefatti roadmap 012–015
- Recuperati nella storia Git locale i commit storici `179bfd4`–`51fb37a`, non pubblicati su GitHub e basati su migrazioni Household UUID 010–011 differenti da quelle del branch di lavoro.
- Aggiornato l'audit per distinguere gli artefatti assenti dal branch remoto da quelli esistenti nel branch locale alternativo; nessun codice storico è stato portato o applicato.

### Step 8.2 — preview amministrativa degli inviti importati
- Aggiunta `/admin/invitations`, protetta da Clerk e allowlist, con caricamento manuale: la pagina non legge Sheets o database all'apertura.
- Mostrati mapping e conteggi per la revisione; il DTO esclude nomi degli invitati, contatti, dati RSVP, hash/token e snapshot grezzi.
- La schermata è esclusivamente read-only: nessuna conferma o attivazione, generazione QR/token o comunicazione.
- Aggiunti test sintetici del servizio e della minimizzazione del DTO. Nessuna sorgente o database reale è stato consultato.

### Step 8.1 — preview di attivazione degli household importati
- Aggiunto un piano read-only che seleziona gli household soltanto tramite mapping approvati Household UUID e confronta il roster persistito con quello sorgente.
- Bloccati household esclusi, mapping o roster ambigui/divergenti, token o risposte già presenti e stati incompatibili; il modello non crea household, token o QR.
- Aggiunte fixture fittizie alla suite guest-sync/RSVP. L'interfaccia admin e l'attivazione transazionale restano bullet successivi.

### Roadmap household e inviti
- Riallineare l'audit ai commit Household UUID 9C.1–9C.3 e alla procedura tecnica di riconciliazione 011, distinguendo la disponibilità del codice dai mapping reali non eseguiti.
- Confermare l'attivazione degli household importati come prossimo lavoro funzionale dello Step 8; nessun dato o servizio esterno è stato consultato o modificato.

### Operatore riconciliazione Household UUID — Step 5
- Add migration 011 with an owner-only exact-roster reconciliation function and metadata-only audit events for existing source mappings.
- Require the complete, duplicate-free guest UUID set for an internal household; reject excluded households, mismatched rosters, reused mappings, and changes after a source leaves legacy mode.
- Verify with fictional PGlite data that RSVP/token fields remain unchanged, the operation is idempotent, and runtime roles cannot execute it. No live Neon mapping was performed.

### Household UUID runtime — Step 9C.3
- Add migration 010 with an explicit source-mode registry, one-to-one Household UUID mapping, composite member foreign key, and contract v3 snapshot/transactional Apply.
- Create new UUID households disabled and keyed by external household UUID; block unmapped existing guests, cross-household moves, source-mode mismatches, and use of old Apply signatures.
- Enable the administrative Apply confirmation for the explicitly configured UUID mode and document operator-only legacy reconciliation. No Neon migration or real Sheet operation was performed.

### Household UUID Preview integration — Step 9C.2
- Integrate the explicitly selected two-tab Household UUID source with Preview planning while keeping legacy mode as the default.
- Bind mode and both source tabs to the signed preview receipt; re-read and validate them before Apply. UUIDs, not labels, keep same-name households separate.
- Block ambiguous/unmapped Neon households and roster, identity, issued-invitation or RSVP conflicts; do not auto-adopt records by name. No Neon writes or migrations are included; transactional Household UUID database runtime remains Step 9C.3.
- Add fictional planning and stale-source tests. See `docs/households-design.md`.

### Household UUID preparation — Step 9C.1
- Add a read-only two-tab Google Sheets reader and an explicitly selected Household UUID parser with structural and relationship validation.
- Keep the legacy single-tab sync unchanged; validate but omit contact email and phone from the parsed model.
- Add fictional parser/Google adapter coverage. No database migration, Preview/Apply integration, live Sheet/Neon access, invitation or QR operation was performed.
- See `docs/households-design.md` for the exact scope and remaining 9C.2/9C.3 work.

### Roadmap recovery audit — Step 9B
- Audit the current guest sync, household identity, invitation and RSVP code against the available roadmap evidence.
- Record missing Household UUID runtime support, Save the Date, imported-household invitation activation, offline RSVP entry and migrations 010–015; no features or external data were changed.
- See `docs/roadmap-recovery-audit.md` for evidence, test coverage, risks and the proposed reconstruction order.

### Durable Work checkpoints across devices
- Authorize automatic validated commits and pushes to a SITE LOVE task branch after each completed implementation step, including Work sessions launched from a phone.
- Verify the remote SHA before declaring completion; keep merges, deployments, production or guest-data changes, and force pushes outside this standing authorization.
- Document unavailable GitHub/review/test checks as blockers instead of relying on ephemeral Work checkouts.


### Validated dependency lockfile
- Record the existing resolved dependency updates, including Next.js 16.4.3,
  sharp 0.35.5 and Zod 4.6.7, within the unchanged package.json ranges.
- Validate the installed versions with 97 guest-sync tests, TypeScript, lint
  and production build. Ignore the local TypeScript incremental build cache.
- No setup or operational guide changes are required for this lockfile update.

### Readable synchronization Preview
- Replace raw planning JSON with labeled before/after values and highlight only
  changed fields for updates. Keep missing records visibly retained.
- Summarize households represented, proposed changes and row errors; collapse
  valid unchanged rows while keeping every blocked row visible.
- Use the fresh Preview database count and explain manual synchronization of
  later Sheet edits. Preview remains read-only and administrator-only.

### DEVELOPMENT guest import
- Import the approved 62 source rows into 29 disabled households without tokens,
  keeping 2 test households excluded; verify the next Preview reports 62 unchanged.
- Verify an in-memory name/surname edit produces one UPDATE with stable identity.
  Future Sheet changes require Preview and Apply; RSVP protections remain active.

### Live sync preview verification
- Verify the current Preview workflow against Sheets and DEVELOPMENT: zero
  errors, 62 proposed source inserts across 29 households, 11 draft rows skipped,
  and 2 test households / 4 test invitees excluded. No import applied.

### Explicit test-household exclusions
- Prepare migration 009 and operator-only classification history, with database
  constraints preventing overlap between test exclusions and source mappings.
- Enforce sync contract v2, SQL guards and stale-preview invalidation; show test
  household/guest counts separately while preserving RSVP and token state.
- Add fictional PostgreSQL regression tests (92 passing). Apply migration 009
  and two approved test exclusions to user-confirmed DEVELOPMENT after private
  backup/restore verification; preserve all protected RSVP tables unchanged.
  No Sheet edits, imports or Apply Changes performed.

### Existing guest reconciliation proposal
- Inspect the configured database in read-only transactions and confirm with the
  owner that the two unmapped households are test data to preserve separately.
- Propose explicit ID-based sync exclusions with snapshot/SQL safeguards;
  no associations, migrations or database writes performed. Private IDs remain
  outside the repository; branch label and audit access require later verification.

### Review authorization policy
- Make local validation and diff inspection the standard completion path.
- Run independent Codex reviews automatically for high-risk changes under the
  owner’s standing authorization for scoped SITE LOVE private-code transfer;
  do not wait for repeated commands or confirmations. Exclude secrets and real
  guest data; other providers and publication remain outside this authorization.
- Align the workflow guides; preserve human release approval and prohibit
  bypassing automatic approval rejections or reporting unperformed reviews.

### Guest name is the first-name field (steps 1–3)
- Use the existing Guest name and Surname columns; no extra First name or Last
  name columns, aliases, backfill or spreadsheet schema changes are needed.
- Preserve legacy full values, permanent identities, provisional rows and
  anonymous places; show Guest name and surname changes in Preview.
- Fix the legacy Preview fallback so a surname-only edit does not show a false
  Guest name change; independently reviewed with no remaining code findings.
- Validate name edits and SQL round-trips on fictional data only. No live
  Sheet/Neon writes, migration, invitation or deployment performed.

### Household design proposal
- Recheck the existing empty Households structure and prepare a private approval
  map for 29 candidate households, preserving 62 guest UUIDs and 11 draft rows.
- Define explicit activation/versioning and legacy mapping reconciliation;
  runtime UUID grouping remains pending. No Sheet/Neon writes performed.
- Created the approved empty Households sheet and Household UUID / Host Sync UUID
  columns in the source workbook; verified readback. No identities assigned and
  no database writes or runtime activation.
- Document the proposed Households sheet, permanent household references, contact ownership,
  companion transitions and staged migration. Proposal only; no source or database writes
  and no household runtime changes are activated.

### Guest name and surname
- Support optional Surname alongside Guest name, retaining source values and
  composing the RSVP display name without duplicating an existing surname.
- Preserve legacy mapping comparisons, provisional rows, permanent IDs and
  anonymous child/companion places; show display-name changes in admin Preview.
- Document the compatible JSONB representation and rollback limitation; no new
  SQL migration, live database import or invitation activation is performed.

### Added
- Manual Google Sheets guest synchronization with read-only Preview, explicit
  Apply, permanent UUID mapping, atomic Neon updates and private batch history.
- Separate English admin guest page, minimized child/companion planning,
  conflict checks, replay recovery and fictional-data test coverage.
- Google setup, identifier menu, least-privilege database role and operational
  recovery guide; imported households remain disabled without tokens or QR codes.

### Security
- Require a verified allowlisted Clerk email for administration; preserve RSVP
  responses, tokens, timestamps and household relationships during synchronization.


### Rifinitura album e sezioni — 8 settembre 2026

- Ripristinata la colonna fotografica con apertura animata ispirata a Codrops, crop dedicati e foto aperte intere; rimossa la disposizione a due colonne.
- Separati identità, immagini, didascalie e comandi su telefono, con margini anchor adattati alla navbar e navigazione da tastiera conservata.
- Preservati giardino principale, vista dal portico e colori naturali di Casa Nuova; uniformati titoli, spaziature, cornici e pulsanti con album e RSVP.
- Uniformate le tartarughe SVG/canvas e la stampa RSVP con un disegno condiviso; somiglianza individuale da verificare quando saranno disponibili le fotografie reali, non trovate nel progetto.

### Added

- Aggiunte al menu RSVP schede cliccabili bilingui con fotografie gastronomiche originali, descrizioni, ingredienti tipici e interazione accessibile da tastiera e telefono.
- Aggiunte la provenienza sposa/sposo/entrambi unica per ogni nucleo, la visualizzazione esplicita dei suoi componenti e i relativi campi nell'export privato.
- Aggiunta al form RSVP una proposta di menu piacentino tradizionale, vegetariano e per bambini, indicata come bozza da confermare con location e catering.
- Aggiunti il ripristino visibile delle scelte RSVP salvate, la conferma prima di sovrascriverle, il blocco degli invii identici e il badge amministrativo per gli invitati modificati nell'ultimo invio.
- Aggiunta la bozza locale `/proposal`: Alessandro e Bridget come burattini che si baciano sotto una Venere Apuana originale e stilizzata, con Carrara e le Alpi Apuane sullo sfondo.
- Aggiunto il flusso RSVP bilingue per nucleo con token opachi, validazione server-side, persistenza Neon, controllo di concorrenza, rate limit e Cloudflare Turnstile.
- Aggiunta l’area sposi protetta con Clerk e allowlist email, riepilogo risposte, export CSV sicuro e audit delle esportazioni.
- Aggiunte migrazioni PostgreSQL, backup locale a permessi ristretti e generatore privato di inviti/QR da 256 bit che rifiuta input e output nel repository.
- Aggiunte la pagina privacy provvisoria e le guide per pubblicazione a costo minimo, conservazione, ripristino e lancio.
- Aggiunti il diagramma architetturale completo e la guida operativa in italiano per controllare servizi, comandi, deploy, backup ed emergenze.
- Aggiunta una checklist personale per provare in locale home, responsive, lingue, RSVP fittizio, accesso sposi, dashboard, export e pulizia finale.

### Changed

- Casa Nuova privilegia il giardino e la vista dal portico verso l’esterno, con colori naturali. La precedente prova dell’album a due colonne è stata sostituita dal ripristino a colonna singola descritto sopra.
- Ridisegnata la galleria come transizione editoriale da stack a contenuto, ispirata all'esperimento MIT di Codrops: le otto fotografie formano una colonna regolare di strisce dritte, identiche e separate, senza rotazioni, cornici o numeri sovrapposti. Alla selezione tutte le strisce si espandono con la stessa curva fluida, la fotografia scelta resta al centro e le altre scorrono sopra e sotto. Ogni ritaglio usa un punto focale dedicato ai volti, mentre la vista aperta recupera un'inquadratura naturale. Su tablet e telefono l'identità dell'album occupa una fascia autonoma sopra lo stack, eliminando ogni collisione con le ultime fotografie. L'adattamento evita blocco dello scroll e gesture verticali intercettate, aggiungendo swipe orizzontale, tastiera, focus di ritorno e movimento ridotto.
- Forzato l'aggiornamento del form RSVP dopo ogni salvataggio, evitando che i controlli React mostrino valori precedenti nonostante Neon contenga già la nuova risposta.
- Rifiutati anche lato server gli invii RSVP identici e allineato il conteggio dei nuclei modificati alle sole persone cambiate nell'ultimo invio.
- Rafforzata la guida Neon con un ruolo runtime creato via SQL, privilegi per colonna, password separate per branch e verifica esplicita dell'assenza di `neon_superuser`.
- Ridisegnato il marchio tartaruga come sigillo editoriale visto dall'alto, coerente tra invito HTML, texture 3D e motivo RSVP.
- Resa statica la home con metadata canonici basati sulla configurazione di produzione; limitato il runtime server alle route RSVP e amministrative.
- Applicate CSP e intestazioni di sicurezza globali, header no-store/noindex sulle route private e 404 di produzione per le superfici interne di revisione.
- Limitata la raccolta RSVP a presenza e menu strutturato, escludendo note sanitarie libere, email e telefono.
- Nascosta temporaneamente dalla home pubblica la lettera finale, inclusa la relativa voce di navigazione; il contenuto resta disponibile nel codice.
- Sostituito il globo di Casa Nuova con un teatrino di carta originale che presenta una scena illustrata della location.
- Ridisegnato l'invito in hero come biglietto di viaggio Milano → Niviano · Casa Nuova, eliminando il motivo della tartaruga e la rotazione 3D.
- Riequilibrata l'intera facciata: sfondo avorio più leggero, architettura attenuata, tipografia della hero più compatta e biglietto senza riquadro esterno.
- Trasformata la hero nella composizione selezionata “Il viaggio in tavola”: il collage di itinerario, invito e cartolina ora è la scena completa, non più un biglietto isolato.
- Inserita nel blocco RSVP un'illustrazione originale in carta con tartaruga e percorso curvo; è decorativa e non associata a dati personali.
- Nascoste temporaneamente dalla home pubblica le quattro fermate della storia; la timeline e i relativi contenuti restano disponibili nel codice per un eventuale ripristino.
- Aggiornato lo stack a Next.js 16, React 19, TypeScript 6 ed ESLint 9 per la compatibilità con Node.js 26; corrette le migrazioni richieste da Next e React.
- Sostituito l’obbligo di review per ogni patch con una review Codex indipendente soltanto per release o modifiche ad alto rischio.
- Reso obbligatorio l’aggiornamento di questo changelog e della documentazione direttamente interessata a ogni consegna.

### Fixed

- Autorizzato l'indirizzo locale `192.168.1.3` per gli asset di sviluppo Next.js, così il test da telefono sulla stessa Wi-Fi carica chunk e HMR senza blocchi cross-origin.
- Rigenerata la build di sviluppo e risolte le incompatibilità che causavano errori di modulo e di tipi nel server locale.
