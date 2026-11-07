# Save the Date — modello di pianificazione

Questo documento descrive il lavoro iniziale del punto 7. Il planner attuale è
solo una verifica read-only dell'associazione UUID e del roster: non prepara
testi, non legge contatti, non registra esiti e non invia comunicazioni.

## Contratto di associazione

Il nucleo sorgente è identificato esclusivamente da
`(source_id, external_household_id)` e deve risolversi in un solo
`rsvp.households.id` tramite il mapping Household UUID approvato. Il planner
blocca mapping assenti o ambigui, riuso dello stesso household interno, esclusioni,
roster incompleti/divergenti, contatto non appartenente a un invitato nominativo
del nucleo e modalità sorgente diversa da Household UUID. Nomi, recapiti, risposte
e token non sono inclusi nel risultato.

Gli stati di invito e RSVP non vengono modificati dal punto 7.1. Un nucleo già
invitato o con risposta può essere eleggibile alla sola pianificazione di una
comunicazione manuale; la funzione non costituisce prova di consegna. Il planner
non crea household o invitee e non modifica mapping o membership.

## Passi successivi

1. Estendere la revisione privata con canale, lingua e testo approvato, senza
   esporre dati oltre l'area admin e senza inviare automaticamente.
2. Registrare soltanto l'esito dichiarato dall'amministratore tramite un evento
   atomico, idempotente e append-only; mantenere il runtime RSVP senza privilegi
   diretti di scrittura sulle nuove tabelle.
3. Aggiungere l'interfaccia Clerk/allowlist con conferma e recovery del retry.

Gli artefatti storici del branch `docs/household-uuid-plan` sono riferimenti
funzionali, non una base da cherry-pickare: il loro schema SQL 012 dipende da una
diversa coppia di migrazioni 010–011. Ogni migrazione futura sarà verificata con
fixture PGlite e non verrà applicata a Neon in questo lavoro.

Le verifiche del planner usano esclusivamente UUID e nominativi sintetici. Nessun
Google Sheet, database, QR, token, invio o comunicazione reale viene coinvolto.
