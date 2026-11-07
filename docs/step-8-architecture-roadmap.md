# SITE LOVE — architettura e roadmap di completamento

Stato verificato il 7 novembre 2026 sul branch `feat/roadmap-recovery-20261106`.
Questa guida distingue l'architettura già implementata, le verifiche esterne
ancora aperte e le possibili estensioni. Non autorizza accesso a dati reali,
migrazioni live, comunicazioni o deploy.

## Architettura attuale dello Step 8

L'attivazione di household importati è un flusso distinto dal generatore che
crea nuovi household.

1. Un amministratore accede alla pagina admin tramite Clerk; ogni Server Action
   verifica la sessione e l'email verificata nell'allowlist.
2. La preview legge i dati organizzativi in sola lettura e individua il nucleo
   tramite mapping esplicito `(source_id, external_household_id)` verso
   `rsvp.households.id`. La preview evidenzia blocchi per mapping, roster e
   stato incompatibili.
3. La preparazione ricontrolla lo stato, genera un token opaco di 256 bit,
   conserva nel server solo il suo SHA-256 e crea una ricevuta firmata legata
   ad amministratore, mapping, snapshot sorgente e hash del token.
4. La conferma richiede un'azione esplicita. La transazione SQL serializza
   l'operazione, ricontrolla mapping, membership, roster, esclusioni, stato e
   assenza di risposta. L'evento idempotente consente il retry dopo un timeout.
5. L'operazione aggiorna solo hash token e stato del household e aggiunge
   metadati al journal. Conserva ID, invitee, mapping, membership, risposte e
   storico esistente.
6. Dopo conferma, URL e QR restano nel browser; la pagina non invia messaggi.

I ruoli DB restano separati: il ruolo sync può invocare funzioni ristrette, ma
non riceve scrittura diretta sulle tabelle RSVP o accesso al journal; il ruolo
app RSVP non può invocare la funzione di attivazione. `site_love_app` non è
un'identità Clerk: la Server Action controlla Clerk/allowlist prima di usare il
ruolo sync. I test locali e CI coprono fixture sintetiche e PostgreSQL nativo;
non attestano una sessione Clerk reale o un branch Neon.

## Cosa si può sviluppare senza servizi reali

| Ambito | Fattibile ora | Limite |
| --- | --- | --- |
| Revisione statica di route, Server Actions, grants, log e gestione errori | Sì, in sola lettura | Non equivale a review Codex indipendente né a prova browser. Codex CLI resta `INFRASTRUCTURE BLOCKED` in questo checkout. |
| Test sintetici di replay, dati incompatibili, conservazione ID e sicurezza dei token | Sì, in locale/CI; il sandbox E2E server-side è stato aggiunto e passa | Usa Clerk/Sheets sintetici e PGlite; non valida un browser Clerk o permessi configurati su Neon live. |
| Procedura di walkthrough Clerk e restore/rollback | Sì, documentata in `step-8-manual-validation-runbook.md` | L'esecuzione richiede istanza Clerk e branch Neon separati; il restore scrive sulla destinazione. |
| Revoca e riemissione di un invito | Architettura e test fittizi sono sviluppabili | È un'estensione non implementata; prima va decisa la regola per household che hanno già una risposta e per link condivisi. |
| Walkthrough browser autenticato reale | No, non senza istanza/account di test Clerk | Un mock locale non conta come autenticazione Clerk reale. |
| Restore/rollback Neon | No, non senza branch di test e approvazione esplicita | Non usare DEVELOPMENT o Production; il plugin Neon non è collegato in questa sessione. |

Non è individuato un ulteriore bullet funzionale 8.7 già approvato nella
roadmap. La revoca/riemissione è una proposta separata, motivata dal requisito
operativo di rotazione citato in `docs/rsvp.md`, e non va trattata come scope
implicito.

## Proposta architetturale: revoca e riemissione

Il repository prevede che un link perso o condiviso possa richiedere una
rotazione, ma non fornisce ancora un flusso admin dedicato. Se approvato come
nuovo bullet, l'implementazione dovrebbe rispettare questi confini:

- Richiedere Clerk e allowlist su pagina e Server Action; derivare l'attore
  dalla sessione verificata.
- Selezionare il household esistente per il suo ID interno, controllando che
  l'eventuale mapping esterno resti univoco e invariato. Non ricostruire
  l'associazione da nomi o righe del foglio.
- Preparare e confermare con due passaggi espliciti e ricevuta breve,
  actor-bound, household-bound e idempotente; un retry dopo timeout deve
  restituire l'esito già registrato.
- Generare un nuovo token opaco sul server, memorizzarne solo l'hash e
  invalidare il link precedente nella stessa transazione. La URL nuova è
  mostrata una sola volta al browser autenticato; nessun invio automatico.
- Scrivere un evento append-only con attore, household, motivazione strutturata,
  identificativo replay e timestamp. Il journal non deve contenere token, URL,
  recapiti, risposte o hash bearer riutilizzabile.
- Usare una funzione SQL `SECURITY DEFINER` a `search_path` fisso e concedere
  solo `EXECUTE` al ruolo server ristretto; niente privilegi diretti di write
  al ruolo app pubblico.
- Conservare `households.id`, tutti gli `invitees.id`, mapping Sync UUID,
  membership, risposte e storico preesistente. La rotazione non è una
  cancellazione né un reset RSVP.
- Bloccare operazioni concorrenti/replay non identici e non rivelare a utenti
  non autorizzati l'esistenza del household.

Prima del codice occorre una decisione di prodotto documentata su: consentire
la rotazione dopo una risposta RSVP; quali motivazioni ammettere; se una
revoca senza contestuale riemissione è necessaria; durata e conservazione del
journal; chi è autorizzato a consegnare privatamente il nuovo URL. Raccomandazione
prudenziale da valutare: bloccare la rotazione automatica dopo una risposta e
richiedere revisione manuale, preservando sempre la risposta e il relativo
storico. Questa raccomandazione non è una decisione già presa.

## Roadmap ordinata

| Ordine | Attività | Tipo | Criterio di chiusura |
| --- | --- | --- | --- |
| 0 | Pubblicare il runbook manuale e questa architettura sul branch task; verificare lo SHA remoto | Documentazione Git | Commit presente sul branch GitHub; non basta un commit locale. |
| 1 | E2E server-side in sandbox PGlite | **COMPLETATO in locale** | Planner/receipt/azioni admin collegate a fixture Sheets e SQL 001–015; hash-only, replay, ID e audit verificati. Non è un E2E browser Clerk. Procedura in `step-8-e2e-sandbox.md`. |
| 2 | Walkthrough Clerk con utenti fittizi allowlisted e non allowlisted | Manuale, autenticazione | Route e azioni server rifiutano anonimo/non allowlisted; admin autorizzato accede; nessun dato o token esposto. |
| 3 | Restore e rollback su branch Neon di test isolato con fixture sintetiche | Manuale, database | Backup restaurato; household/invitees/mapping/risposte/journal sintetici coerenti; rollback previsto e provato. Richiede approvazione prima della scrittura. |
| 4 | Decidere e registrare le regole di revoca/riemissione | Decisione di prodotto | Regole per RSVP esistente, motivazione, consegna privata e audit approvate. |
| 5 | Implementare revoca/riemissione come bullet indipendente | Codice e migrazione | Test fixture per atomicità, replay, concorrenza, token precedente invalido, nuovo token hash-only e preservazione completa degli ID/risposte; lint, TypeScript, build e test PostgreSQL sintetici. Migrazione solo nel repository/CI. |
| 6 | Valutare applicazione delle migrazioni a un ambiente reale | Operazione separata | Ambiente, branch, backup, rollback e migrazioni approvati esplicitamente; non incluso nell'autorizzazione attuale. |

Gli ordini 1 e 2 possono essere eseguiti separatamente; il punto 3 non deve
ritardare la chiusura dei gate esistenti. Il punto 4 non va iniziato prima della
decisione di prodotto. Dopo ogni bullet di codice o documentazione: diff
ispezionato, `CHANGELOG.md` e guida aggiornati, verifiche proporzionate,
commit focalizzato, push e verifica dello SHA remoto prima del bullet
successivo.

## Cosa resta fuori da questa roadmap

- Attivazione o import di household reali, mapping basati su nomi o righe e
  letture/scritture di Google Sheets reali.
- Migrazioni, restore o altre scritture su Neon DEVELOPMENT o Production.
- Token, QR, manifest, messaggi e comunicazioni per invitati reali.
- Merge, deploy o promozione a `system`/`prod`.
- Nuovo invio automatico Save the Date/inviti o nuovo provider di messaggistica.
