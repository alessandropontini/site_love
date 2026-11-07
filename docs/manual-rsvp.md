# Risposte RSVP raccolte offline

## Interfaccia di revisione e registrazione — Step 8.6c

La pagina protetta `/admin/rsvp/manual` mostra una scelta sintetica dei nuclei
già presenti nella dashboard RSVP. Il caricamento del roster avviene solo dopo
un'azione esplicita e usa la Server Action 8.6b, che ripete l'autorizzazione
Clerk e la verifica della allowlist. Il form non copia l'email già registrata:
chiede l'indirizzo fornito dal rispondente e una relativa attestazione.
Lo schema Zod condiviso con il server è separato dal modulo HMAC Node; il
segreto e la firma restano esclusivamente sul server.

La revisione presenta gli invitati nominativi e le risposte correnti, conserva
gli ID permanenti e l'eventuale ID del +1, e richiede provenienza, motivo e
conferma esplicita. Il motivo selezionabile dipende da revisione e stato
risposte. Non sono raccolti nomi o età dei bambini; nessuna comunicazione viene
inviata.

Dopo il primo tentativo il payload viene mantenuto solo nella memoria della
pagina. Se l'esito è incerto, i campi restano bloccati e l'unica azione è
ritentare lo stesso payload con lo stesso ID idempotente. Un errore certo
richiede di ricaricare il nucleo e rifare la revisione. Non viene scritto
payload o dato personale in URL, storage browser o repository. La presentazione
del riepilogo in dashboard e i grant DB restano bullet separati.

## Grant read-only audit — Step 8.6d

La migration `015_manual_rsvp_dashboard_read.sql` revoca al ruolo
`site_love_sync` la lettura diretta di `manual_response_events` e concede
soltanto `manual_response_dashboard_events()`. La funzione restituisce household
ID, actor ID, provenienza, motivo strutturato, revisione e timestamp; non
restituisce hash, nomi, email, risposte o token. `site_love_app` e `PUBLIC` non
possono leggere il journal né invocare la funzione. La UI di riepilogo e la
verifica browser restano separate. La migration è verificata solo con PGlite e
fixture sintetiche e non è stata applicata a Neon.

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

Il journal amministrativo conserva solo household ID, attore ricavato dalla
Server Action dalla sessione Clerk allowlisted, provenienza,
motivo, revisione, data DB e HMAC della richiesta. La funzione SQL non può
verificare la sessione Clerk: la Server Action deriva l'attore autenticato,
valida i campi e calcola l'HMAC dell'intera richiesta prima di invocarla. Il journal non
contiene nomi, email, risposte o token. Il ruolo `site_love_sync` non ha
scritture dirette sulla tabella; il ruolo RSVP runtime `site_love_app` non può
leggere il journal né invocare le funzioni.

## Adapter e azioni amministrative — Step 8.6b

`app/admin/rsvp/manual/actions.ts` espone una lettura read-only per ID interno e
una registrazione esplicita. Ogni chiamata verifica Clerk e la allowlist
`RSVP_ADMIN_EMAILS` prima di accedere al DB; il valore `actor` deriva dallo user
ID della sessione, mai dall'input. L'adapter usa solo
`GUEST_SYNC_DATABASE_URL`, verifica che punti allo stesso database di
`DATABASE_URL` e invoca le funzioni 014 ristrette.

La registrazione valida il payload con lo schema RSVP condiviso, richiede
conferma esplicita e l'attestazione `emailProvidedByRespondent: true`. L'azione
non copia automaticamente l'email restituita dalla lettura, né valori da
Google Sheets. Il request hash è un HMAC server-side legato a ID operazione,
household, actor, provenienza, motivo, attestazione e payload confermato; un
retry dello stesso input produce la stessa firma. Gli errori SQL e di
connessione vengono convertiti in codici sicuri. La funzione non invia email o
messaggi.

La UI di preview/revisione, il blocco del payload e il retry identico sono
descritti nella sezione Step 8.6c. I riepiloghi di provenienza in dashboard e il
walkthrough Clerk autenticato restano separati. Test PGlite e fixture fittizie
non sostituiscono una verifica PostgreSQL multi-connessione. Le migration
012–015 non sono state applicate a Neon.
