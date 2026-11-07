# Step 8 — sandbox E2E locale

Il repository ora include un test end-to-end **server-side** per il flusso di
attivazione degli household importati. Collega il planner e la ricevuta reali,
le azioni admin con un attore sintetico, fixture Sheets in memoria, migrazioni
001–015 e la funzione SQL di attivazione eseguita in un database PGlite
temporaneo.

## Avvio

Con le dipendenze del progetto installate e un modulo PGlite già disponibile
localmente:

```bash
PGLITE_TEST_MODULE="$(node -p 'require.resolve("@electric-sql/pglite")')" \
  ./scripts/test-imported-activation-sandbox.sh
```

PGlite non è stato aggiunto alle dipendenze di produzione o sviluppo. Se il
modulo è installato in una cartella locale separata, impostare
`PGLITE_TEST_MODULE` al suo entrypoint come nella procedura del test guest-sync.
Lo script compila solo i moduli necessari in una directory temporanea e la
rimuove al termine.

Lo script rifiuta di partire se trova configurate connessioni/credenziali
Neon, Sheets, Clerk, Turnstile o invio email nei nomi di variabile usati dal
progetto. Le migrazioni vengono applicate soltanto all'istanza PGlite in
memoria; il test non importa gli adapter live di Sheets o Neon.

## Cosa verifica

- Preview e preparazione usano il parser e il planner effettivi con una riga
  invitato e un mapping household UUID fittizi.
- La preparazione non attiva il household; il token opaco restituito esiste
  solo nel risultato di test e nella memoria del flusso.
- La conferma invoca la funzione SQL reale con il ruolo ristretto
  `site_love_sync`; l'hash token viene salvato, il token e il suo hash non
  compaiono nel journal.
- ID household, ID invitee, mapping, membership e audit preesistente restano
  invariati. La ripetizione della stessa conferma restituisce il replay senza
  inserire un secondo evento.
- Un attore sintetico non autorizzato viene rifiutato prima di qualunque
  lettura fixture Sheets o snapshot DB.

L'attore autorizzato è fornito direttamente al factory delle azioni per il
test. Questo non modifica né bypassa `requireRsvpAdmin` nel runtime e non
simula Clerk. Il test attraversa il workflow server-side fino a PostgreSQL
compatibile; **non** avvia Next.js, non interagisce con il browser, non verifica
la sessione Clerk reale, non usa Google Sheets né Neon e non sostituisce i due
gate manuali del [runbook](step-8-manual-validation-runbook.md).

## Risultato verificato

Il 7 novembre 2026 il test sandbox è passato isolatamente e nella suite
guest-sync/RSVP/Save-the-Date: 177 test passati, 0 falliti, 0 saltati. Tutti i
dati sono fixture sintetiche e il database è PGlite temporaneo. La suite è
stata eseguita usando dipendenze già presenti in un checkout locale fratello;
non sono state modificate le dipendenze del progetto.
