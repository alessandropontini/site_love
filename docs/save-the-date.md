# Save the Date — modello di pianificazione

Questo documento descrive il lavoro del punto 7. Il planner è una verifica
read-only dell'associazione UUID e del roster. Il draft bilingue usa la data,
il luogo e i nomi già configurati nel sito e offre una scelta di canale manuale;
non legge recapiti, registra esiti o invia comunicazioni.

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

1. Mostrare planner e draft nell'area privata, con controllo amministrativo di
   household, lingua, canale e testo prima dell'uso.
2. Registrare soltanto l'esito dichiarato dall'amministratore tramite un evento
   atomico, idempotente e append-only; mantenere il runtime RSVP senza privilegi
   diretti di scrittura sulle nuove tabelle.
3. Aggiungere l'interfaccia Clerk/allowlist con conferma e recovery del retry.

## Draft e canali

Il draft `std-draft-v1` è disponibile in italiano e inglese. La data, il luogo e
i nomi sono letti da `lib/editorialConfig.ts`, evitando copie indipendenti. I
canali selezionabili manualmente sono SMS, iMessage, WhatsApp, email, Telegram,
Instagram e carta. Il risultato contiene solo canale, lingua, versione del
template e testo; nessun destinatario o dato di contatto è aggiunto.

Il testo è una bozza operativa: l'amministratore deve rivederlo prima di
copiarlo. La scelta del canale e la generazione del testo non inviano messaggi,
non aprono applicazioni esterne e non registrano che l'invio sia avvenuto.

Gli artefatti storici del branch `docs/household-uuid-plan` sono riferimenti
funzionali, non una base da cherry-pickare: il loro schema SQL 012 dipende da una
diversa coppia di migrazioni 010–011. Ogni migrazione futura sarà verificata con
fixture PGlite e non verrà applicata a Neon in questo lavoro.

Le verifiche del planner usano esclusivamente UUID e nominativi sintetici. Nessun
Google Sheet, database, QR, token, invio o comunicazione reale viene coinvolto.
