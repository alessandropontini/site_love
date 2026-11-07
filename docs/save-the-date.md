# Save the Date — modello di pianificazione

Questo documento descrive il lavoro del punto 7. Planner, draft bilingue,
workflow con ricevuta, journal SQL e adapter server-side sono implementati e
verificati con fixture sintetiche. Le azioni server Clerk/allowlist per preview,
preparazione e registrazione manuale sono implementate; la pagina di revisione
e i relativi test UI restano aperti. Non vengono inviati messaggi.

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

1. Mostrare planner e draft nell'area Clerk/allowlist, con controllo di household,
   lingua, canale e testo, conferma esplicita e recovery del retry.
2. Aggiungere test UI e verifiche locali della route protetta.

## Draft e canali

Il draft `std-draft-v1` è disponibile in italiano e inglese. La data, il luogo e
i nomi sono letti da `lib/editorialConfig.ts`, evitando copie indipendenti. I
canali selezionabili manualmente sono SMS, iMessage, WhatsApp, email, Telegram,
Instagram e carta. Il risultato contiene solo canale, lingua, versione del
template e testo; nessun destinatario o dato di contatto è aggiunto.

Il testo è una bozza operativa: l'amministratore deve rivederlo prima di
copiarlo. La scelta del canale e la generazione del testo non inviano messaggi,
non aprono applicazioni esterne e non registrano che l'invio sia avvenuto.

## Ricevuta di preparazione — Step 7.3

La ricevuta è firmata HMAC con scopo dedicato e legata all'attore Clerk,
all'identità esterna/interna del household, al contatto selezionato, alla lingua,
al canale, alla versione, ai dati sorgente, allo snapshot DB e al testo. Sorgente,
snapshot e testo sono rappresentati nella ricevuta solo da commitment HMAC: non
contiene nomi, recapiti, testo sorgente o risposte RSVP. La scadenza è di 30
minuti. Una modifica dei dati sorgente, dello snapshot, del mapping o del template
invalida la registrazione.

La conferma accetta solo gli stati manuali `READY`, `SENT` o `FAILED` (oltre al
reset correttivo esplicito `NOT_SENT`). Prima di verificare scadenza e sorgente,
il workflow controlla se lo stesso evento è già stato registrato: un timeout
dopo il commit può così essere recuperato senza duplicare la transizione.
La migration 012 aggiunge lo stato e il journal atomico con lock e grants
minimi; l'adapter Step 7.5a usa `GUEST_SYNC_DATABASE_URL`, verifica che punti
allo stesso database configurato da `DATABASE_URL`, espone solo letture
minimizzate e l'invocazione della funzione `record_save_the_date`. Il lookup
di recovery confronta l'hash della stessa richiesta prima dei controlli di
scadenza del workflow. L'adapter è testato con query simulate; la connessione
non è stata eseguita contro Neon. Restano la pagina Clerk/allowlist e i test UI.
Nessuna migration è stata applicata a Neon.

## Azioni amministrative — Step 7.5b

`app/admin/save-the-date/actions.ts` delega a un servizio testabile che richiede
Clerk e l'email verificata nella allowlist prima di ogni preview, preparazione o
registrazione. Il preview è avviato esplicitamente e restituisce UUID di mapping,
conteggi, blocchi e stato; non restituisce nomi o valori di contatto. La
preparazione riceve un solo Household UUID e canale scelti dall'amministratore e
restituisce il draft e la ricevuta firmata; la registrazione accetta solo la
ricevuta e uno stato manuale. Errori non riconosciuti diventano
`STD_UNAVAILABLE`, senza dettagli SQL o host. Test con sorgente e attore fittizi
verificano l'autorizzazione prima delle letture, la minimizzazione e la gestione
degli errori. Le azioni non inviano comunicazioni.

## Persistenza atomica — Step 7.4

`rsvp.record_save_the_date(jsonb)` verifica modalità Household UUID, mapping
esatto, contatto nominativo, esclusioni e versione attesa sotto il lock condiviso
con sync e riconciliazione. Stato ed evento append-only vengono scritti nella
stessa transazione. Lo stesso ID e request hash restituiscono il risultato
registrato; riuso con contenuto diverso e versioni stale falliscono. La funzione
non aggiorna household, invitees, token o risposte. `site_love_sync` può leggere i
metadati ed eseguire la funzione, ma non scrivere direttamente le tabelle;
`site_love_app` non può accedere agli oggetti Save the Date. Migration e grant
sono verificati con PGlite su dati sintetici, non applicati a Neon.

Gli artefatti storici del branch `docs/household-uuid-plan` sono riferimenti
funzionali, non una base da cherry-pickare: il loro schema SQL 012 dipende da una
diversa coppia di migrazioni 010–011. Ogni migrazione futura sarà verificata con
fixture PGlite e non verrà applicata a Neon in questo lavoro.

Le verifiche del planner usano esclusivamente UUID e nominativi sintetici. Nessun
Google Sheet, database, QR, token, invio o comunicazione reale viene coinvolto.
