# Anagrafica invitati — consegna step 1–3

Data: 31 ottobre 2026. Branch: `feat/guest-list-batch-sync`; HEAD iniziale:
`1c5c65b`. Repository locale verificato; nessun commit, push, merge o deployment.

## Stato iniziale e perimetro

Il repository aveva modifiche locali a modello, Preview, script UUID, test,
documentazione e package-lock, oltre a una proposta Households non tracciata.
Sono state conservate. Il supporto Surname e parte della Preview erano già
presenti: questa sessione ne completa la verifica e la Preview, senza
rivendicare la creazione del supporto Surname. Package-lock, proposta Households e cambiamenti precedenti restano
fuori dal nuovo intervento. Gli step 4–10 non sono stati avviati; test e note
qui documentano esclusivamente la validazione degli step 1–3.

Il foglio originale è stato letto tramite connettore, senza scritture: 73 righe
con nome, 62 UUID distinti e 11 righe senza UUID/provvisorie. Surname è già
presente; First name e Last name no. Esistono già Households e colonne Household
UUID / Host Sync UUID: non sono state attivate o modificate. Quattro celle
Surname contengono un'indicazione di cognome sconosciuto: richiedono revisione
manuale, non una sostituzione automatica. Nessuna copia dei dati personali è
stata aggiunta al repository. Non è stato interrogato Neon: i due nuclei non
mappati e le risposte segnalate nella richiesta non sono stati riverificati.

## Architettura e dipendenze

- `google.ts` legge l'intera Guest List lato server, senza cache, con scope
  Google in sola lettura. I nuovi campi sono letti per intestazione, senza
  modificare intervalli o credenziali.
- `model.ts` valida con Zod, esclude le bozze, elimina nomi di bambini e posti
  +1, costruisce il piano e confronta i dati tramite UUID, non tramite nomi.
- `workflow.ts` firma la Preview e rilegge foglio/database prima dell'Apply;
  hash, scadenza, attore e ricevuta proteggono da modifiche e replay.
- `db.ts` usa un ruolo limitato. La migrazione 008 conserva l'anagrafica
  organizzativa in JSONB; SQL usa `name` per display_name e conserva gli ID.
  Non servono colonne né funzioni SQL nuove per nome e cognome.
- Le azioni e la pagina admin richiedono Clerk e allowlist. La Preview mostra
  ora anche variazioni dei singoli campi, oltre al nome visualizzato.
- `lib/rsvp` mantiene displayName, risposte e dati dell'accompagnatore dichiarati
  dagli invitati nel proprio modello. Non viene modificato né sovrascritto
  dall'anagrafica organizzativa. I blocchi su nuclei con risposte restano attivi.
- Lo script Apps Script continua a usare Guest name e a preservare gli UUID;
  riconosce anche intestazioni opzionali duplicate. Non è stato installato
  o eseguito sul foglio reale.

## Schema confermato dall’utente

Guest name è il campo del nome proprio; Surname è il cognome. Non aggiungere
First name o Last name, né mantenerne alias nel parser. Non serve alcuna modifica
strutturale al foglio. Guest type, Party / family, List owner e Sync UUID restano
invariati; nessun backfill delle 11 righe provvisorie.

Nel modello, sourceName conserva Guest name e surname conserva Surname; name è
il valore visualizzato. Un eventuale nome completo legacy rimane intatto e il
cognome non viene ripetuto se già presente come suffisso completo. Non si deducono
parti del nome. Per correggere un cognome su un nome completo legacy, verificare
manualmente anche Guest name. Nomi di bambini e accompagnatori senza nome restano
nulli nel piano. Campi assenti/nulli sono equivalenti nei confronti legacy.

## Rischi e ordine di attivazione

1. Revisionare il codice sullo schema esistente Guest name + Surname. Nessuna
   nuova colonna da approvare o aggiungere.
2. Verificare manualmente i dati mancanti/ambigui; mantenere Guest name per i
   vecchi strumenti. I valori sconosciuti non sono interpretati come cognomi
   mancanti dal parser: occorre correggerli prima di un futuro import.
3. Eseguire una nuova Preview autorizzata. Il blocco dei nuclei Neon privi di
   mappatura resta intenzionalmente presente: la riconciliazione è lo step 5,
   richiede approvazione e non è stata implementata qui.
4. Solo dopo revisione/riconciliazione si potrà pianificare un futuro Apply.
   Nessun Apply è stato eseguito in questa sessione.

La composizione esplicita può cambiare il nome visualizzato: verificare sempre
la Preview. Nuclei con RSVP restano bloccati per modifiche; gli inviti emessi
mantengono i vincoli sul nome visualizzato. Il rollback a un parser che ignora
Surname può produrre aggiornamenti errati dopo un import: sospendere
la sync e ripristinare una versione compatibile, senza applicare piani legacy.

## File modificati da questa sessione

- lib/guest-sync/model.ts
- app/admin/guests/GuestListSynchronization.tsx
- scripts/guest-sync-identifiers.gs
- tests/guest-sync/names.test.cjs (nuovo)
- tests/guest-sync/identifiers.test.cjs
- tests/guest-sync/database.test.cjs
- docs/guest-list-sync.md
- docs/guest-names-step-1-3.md (questo rapporto)
- CHANGELOG.md

## Verifiche e revisione finale

Risultati sulla versione corretta Guest name + Surname:

- 76 test guest-sync passati, 0 falliti, 0 saltati, inclusa integrazione SQL
  PGlite su dati fittizi locali: ID stabili, round-trip, idempotenza,
  conservazione RSVP, ruoli, errori Google/DB e concorrenza simulata.
- `npx tsc --noEmit --incremental false`: passato.
- `npm run lint` e `npm run build`: passati, ripetuti anche dopo la correzione
  finale della Preview; build comprensiva del controllo TypeScript.
- `git diff --check`: passato.

Revisione indipendente Codex: **PASS WITH NOTES**. Il revisore separato ha
individuato un P3 nella Preview dei record legacy: un cambio del solo cognome
mostrava anche Guest name da vuoto al nome esistente. Corretto normalizzando
sourceName con fallback a name sia nel confronto sia nella visualizzazione.
Il revisore ha poi verificato la correzione: nessun rilievo di codice residuo.

Il primo avvio esterno era stato bloccato dal controllo automatico. Dopo il
consenso esplicito dell’utente alla trasmissione del codice privato a OpenAI
Codex, lo script è stato autorizzato, ma il processo CLI è terminato con exit 137
prima di produrre una revisione. Il suo rapporto conserva correttamente lo stato
INFRASTRUCTURE BLOCKED. La revisione effettiva è stata svolta da un agente Codex
separato in sola lettura nella sessione, con lo stesso ambito autorizzato.
Rapporto: `.agent/reports/guest-names-20261031-independent-review.md`.

Restano verifiche manuali in un ambiente isolato: browser autenticato,
accessibilità/responsive della Preview, integrazione Google/Clerk/Neon,
permessi reali e concorrenza multi-connessione. Non sono dichiarate eseguite.

Nessuna nuova colonna da aggiungere, nuova migrazione, scrittura su Sheet/Neon,
Apply, invito o deployment. Il blocco dei nuclei privi di mappatura resta attivo.

Commit proposto (non eseguito):
`feat: sync Guest name and Surname with stable guest identities`
