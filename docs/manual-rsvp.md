# Risposte RSVP raccolte offline

## Contratto database — Step 8.6a

La migration `014_manual_rsvp.sql` introduce due funzioni ristrette sul ruolo
server-side `site_love_sync`: `admin_household(uuid)` per leggere il nucleo da
mostrare all'amministratore e `record_manual_response(jsonb)` per registrare
una risposta confermata. La funzione di scrittura usa le stesse tabelle,
roster e revisione ottimistica dell'RSVP online; non crea una seconda copia
delle risposte.

Ogni richiesta deve riportare una provenienza esplicita (`phone`, `message`,
`paper`, `in_person`) e un motivo strutturato: `initial_offsite_response` per
la prima risposta ricevuta fuori dal sito oppure `correction` per correggere
risposte già presenti. La funzione rifiuta la combinazione non coerente con lo
stato corrente. Non viene raccolto testo libero per il motivo.

L'operazione richiede la revisione corrente, conferma amministrativa, il roster
completo degli invitati e i campi validati dal contratto RSVP. Una correzione
con revisione scaduta entra in conflitto; lo stesso ID operazione e lo stesso
payload restituiscono il risultato già registrato, mentre riusare l'ID con dati
diversi viene rifiutato. Risposta e audit vengono scritti in un'unica
transazione. Non viene inviata alcuna comunicazione.

Il journal amministrativo conserva solo household ID, attore che la futura
Server Action dovrà ricavare dalla sessione Clerk allowlisted, provenienza,
motivo, revisione, data DB e HMAC della richiesta. La funzione SQL non può
verificare la sessione Clerk: la Server Action deve calcolare e validare
l'HMAC di tutti i campi della richiesta prima di invocarla. Il journal non
contiene nomi, email, risposte o token. Il ruolo `site_love_sync` non ha
scritture dirette sulla tabella; il ruolo RSVP runtime `site_love_app` non può
leggere il journal né invocare le funzioni.

Questo bullet aggiunge solo schema e contratto SQL. La UI/action Clerk,
l'anteprima, la conferma, il retry esplicito, i grant per eventuali riepiloghi
dashboard e il walkthrough autenticato restano da implementare o verificare
con bullet separati. Test locali con PGlite e dati fittizi non sostituiscono
una verifica PostgreSQL multi-connessione. La migration non è stata applicata
a Neon.
