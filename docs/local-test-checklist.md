# Checklist personale per il test locale completo

Questa guida permette ad Alessandro di percorrere personalmente SITE LOVE sul
Mac, prima senza servizi esterni e poi con un invito RSVP di prova. Seguire le
caselle nell'ordine e annotare ogni problema nella tabella finale.

Tempo indicativo:

- giro visivo immediato: 20–30 minuti;
- test completo con Neon e Clerk Development: 60–90 minuti;
- controllo responsive su tutte le larghezze: altri 20–30 minuti.

## Confini del test

- Usare soltanto dati fittizi e un database/branch di test.
- Non usare nomi, email, QR o risposte degli invitati reali.
- Non incollare in questa guida, in chat o negli screenshot il contenuto di
  `.env.local`.
- Lasciare vuote le chiavi Turnstile durante il primo test locale: in modalità
  sviluppo il codice applica intenzionalmente il bypass locale. Turnstile reale
  dovrà essere verificato successivamente in Preview/Production.
- I giochi conservati nel repository non sono montati: non fanno parte del giro
  pubblico e non sono un errore se non compaiono.
- Le route `/duomo-proposals` e `/sun-proposals` sono soltanto superfici visive
  opzionali, disponibili in sviluppo e nascoste in produzione.

## Risultato del test

Usare uno di questi simboli accanto a ogni voce:

- `[x]` superata;
- `[ ]` non ancora provata;
- `[!]` problema trovato, da aggiungere alla tabella finale.

Interrompere subito il test se si scopre di essere collegati a un database
Production, se un segreto compare in uno screenshot o se l'area amministrativa
è accessibile senza autenticazione.

---

## Fase 1 — Preparare il Mac

### 1.1 Aprire la cartella corretta

- [ ] Aprire Terminale.
- [ ] Eseguire:

```bash
cd /Users/alessandropontini/progetti/site_love
```

- [ ] Verificare la cartella:

```bash
pwd
```

Risultato atteso:

```text
/Users/alessandropontini/progetti/site_love
```

- [ ] Controllare i file modificati senza cancellare nulla:

```bash
git status --short
```

È normale vedere modifiche ancora non salvate in Git. Non usare
`git reset --hard`, `git checkout --` o altri comandi di pulizia.

### 1.2 Installare e verificare le dipendenze

- [ ] Eseguire:

```bash
npm install
```

- [ ] Confermare che il risultato non riporti vulnerabilità note.
- [ ] Non eseguire `npm audit fix --force` se appare un avviso: annotarlo e
  fermarsi per una valutazione.

### 1.3 Controllare `.env.local`

- [ ] Verificare che il file esista senza mostrarlo o condividerlo:

```bash
test -f .env.local && echo 'env locale presente' || echo 'env locale assente'
```

- [ ] Se è assente, crearlo dal modello:

```bash
cp .env.example .env.local
```

- [ ] Per il primo giro visivo lasciare pure `DATABASE_URL`,
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` e
  `RSVP_ADMIN_EMAILS` vuote.
- [ ] Non aggiungere mai `.env.local` a Git.

### 1.4 Avviare il sito

- [ ] Eseguire:

```bash
npm run dev
```

- [ ] Attendere il messaggio `Ready`.
- [ ] Aprire `http://localhost:3000` in Chrome o Safari.
- [ ] Lasciare aperto il Terminale per vedere eventuali errori.

Per fermare il sito, tornare nel Terminale e premere `Control + C`.

---

## Fase 2 — Giro visivo della home

### 2.1 Apertura e navigazione

- [ ] La pagina si apre senza schermata bianca o errore.
- [ ] Nel Terminale e nella console del browser non appaiono errori rossi.
- [ ] Titolo, data e luogo dell'invito sono leggibili.
- [ ] La navigazione porta alle sezioni corrette senza salti strani.
- [ ] L'ordine è: invito → fotografie → location → RSVP.
- [ ] Timeline e lettera finale non compaiono, come previsto nello stato attuale.
- [ ] Il tasto Tab rende visibile il link “salta al contenuto”.
- [ ] Dopo averlo attivato, il focus entra nel contenuto principale.

### 2.2 Invito iniziale

- [ ] L'invito mostra il fronte.
- [ ] Il comando per vedere il retro gira correttamente l'invito.
- [ ] Il comando per tornare al fronte funziona.
- [ ] I comandi funzionano anche usando Tab, Invio e barra spaziatrice.
- [ ] Se il browser supporta WebGL, la versione 3D viene caricata.
- [ ] Se WebGL non parte, resta comunque disponibile il poster HTML cliccabile.
- [ ] I pulsanti che scendono nel racconto e verso RSVP portano alla sezione
  corretta.
- [ ] Non ci sono scatti continui, ventole anomale o blocchi del browser.

### 2.3 Fotografie

- [ ] Tutte le immagini previste si caricano.
- [ ] Non ci sono immagini stirate, mancanti o tagliate in modo importante.
- [ ] Testi e didascalie restano leggibili sopra o accanto alle immagini.
- [ ] Scorrendo lentamente non compaiono salti di layout evidenti.

### 2.4 Location

- [ ] Arrivando alla sezione, il teatrino statico di Casa Nuova è completo, centrato e ben leggibile.
- [ ] L'immagine della location è nitida e non esce dal suo contenitore.
- [ ] Nome, indirizzo, data e informazioni sono leggibili.
- [ ] Il collegamento alla mappa apre una nuova scheda corretta.
- [ ] Il collegamento al sito della location apre una nuova scheda corretta.
- [ ] Il collegamento alla galleria della location apre una nuova scheda corretta.
- [ ] Tornando alla scheda locale, il sito conserva la posizione di scorrimento.

### 2.5 Sezione RSVP e footer

- [ ] La sezione RSVP della home è soltanto informativa.
- [ ] Non appare un form generico per inserire dati.
- [ ] Il testo spiega che ogni nucleo userà il proprio QR/link personale.
- [ ] Il footer mostra lingua e collegamenti previsti.
- [ ] Il collegamento privacy apre `http://localhost:3000/privacy`.
- [ ] La pagina privacy è leggibile e segnala correttamente ciò che è ancora
  provvisorio.

---

## Fase 3 — Lingue, tastiera e movimento ridotto

### 3.1 Italiano e inglese

- [ ] Dalla home selezionare English.
- [ ] Titolo del browser, navigazione, testi, pulsanti e footer passano in inglese.
- [ ] Non restano blocchi visibili metà italiani e metà inglesi.
- [ ] Ricaricare la pagina: la scelta inglese resta salvata.
- [ ] Tornare a Italiano e ricaricare: la scelta italiana resta salvata.
- [ ] Il cambio lingua non riporta improvvisamente in cima alla pagina.

### 3.2 Tastiera

- [ ] Percorrere tutta la pagina usando soltanto Tab e Shift + Tab.
- [ ] Ogni elemento interattivo mostra chiaramente il focus.
- [ ] L'ordine del focus segue l'ordine visivo.
- [ ] Non esistono punti in cui il focus rimane intrappolato.
- [ ] I collegamenti esterni sono comprensibili anche senza icona.

### 3.3 Movimento ridotto

- [ ] Attivare “Riduci movimento” nelle impostazioni di accessibilità di macOS.
- [ ] Ricaricare la home.
- [ ] Controllare che le informazioni restino visibili e utilizzabili.
- [ ] Le animazioni decorative devono ridursi senza nascondere pulsanti o testi.
- [ ] Ripristinare l'impostazione abituale di macOS al termine.

---

## Fase 4 — Telefono e dimensioni dello schermo

Aprire gli strumenti sviluppatore del browser e attivare la modalità dispositivo.
Per ogni larghezza controllare home, menu, invito, fotografie, location, RSVP e
footer.

- [ ] `320 px` — nessuno scorrimento orizzontale; testi e pulsanti leggibili.
- [ ] `390 px` — menu mobile utilizzabile e chiudibile.
- [ ] `768 px` — passaggio tablet senza colonne sovrapposte.
- [ ] `1024 px` — composizioni bilanciate e immagini nitide.
- [ ] `1440 px` — contenuti non eccessivamente larghi o dispersi.

Per almeno una dimensione mobile:

- [ ] Aprire e chiudere il menu.
- [ ] Cambiare lingua.
- [ ] Girare l'invito.
- [ ] Aprire tutti i collegamenti della location.
- [ ] Arrivare fino al footer.
- [ ] Verificare che nessun testo finisca sotto pulsanti o immagini.

Se possibile, aprire anche l'indirizzo Network mostrato da Next.js su un telefono
collegato alla stessa Wi-Fi. Questo è solo un test nella rete locale, non una
pubblicazione Internet.

L'indirizzo `192.168.1.3` è autorizzato soltanto per gli asset del server di
sviluppo. Dopo una modifica a `next.config.mjs` occorre riavviare `npm run dev`;
se il router assegna al Mac un IP diverso, aggiornare l'origine esatta invece di
allargare l'accesso a tutta la rete.

---

## Fase 5 — Route informative e stati sicuri senza database

Questa fase può essere eseguita immediatamente, anche senza Neon.

- [ ] Aprire `http://localhost:3000/rsvp`.
- [ ] La pagina chiede di usare il link o QR personale e non mostra un form
  generico.
- [ ] Aprire:

```text
http://localhost:3000/rsvp/site-love-local-test-only-2026
```

- [ ] Senza `DATABASE_URL` appare “RSVP in preparazione”, senza finto messaggio
  di salvataggio.
- [ ] Aprire `http://localhost:3000/sign-in`.
- [ ] Se Clerk Development è configurato appare il login; altrimenti appare il
  messaggio di configurazione mancante.
- [ ] Aprire `http://localhost:3000/admin/rsvp`.
- [ ] Senza `RSVP_ADMIN_EMAILS` la risposta deve essere una pagina neutra `404`.
- [ ] Dalla home non esistono collegamenti pubblici verso `/admin/rsvp`.
- [ ] Dalla home non esistono collegamenti con un token RSVP di prova o reale.

Superfici visive opzionali di sviluppo:

- [ ] Aprire `http://localhost:3000/duomo-proposals`.
- [ ] Aprire `http://localhost:3000/sun-proposals`.
- [ ] Annotare eventuali proposte da conservare, ma non considerarle parte della
  home pubblica.

---

## Fase 6 — Preparare Neon per il test RSVP completo

Questa fase richiede un progetto o branch Neon esclusivamente di test. Se non è
ancora disponibile, fermarsi qui e completarla insieme durante la configurazione
dei servizi.

### 6.1 Controllo prima di modificare il database

- [ ] Nel pannello Neon verificare visivamente di essere nel progetto/branch di
  sviluppo o test, non in Production.
- [ ] Annotare il nome del branch di test: `____________________________`.
- [ ] Aprire SQL Editor sul branch di test.
- [ ] Eseguire:

```sql
select current_database(), current_user, now();
```

- [ ] Confermare che database e utente sono quelli previsti.

### 6.2 Applicare le migrazioni

Nel SQL Editor eseguire, in ordine, il contenuto completo di:

1. `db/migrations/001_rsvp.sql`;
2. `db/migrations/002_admin_audit.sql`;
3. `db/migrations/003_household_rate_limit.sql`.

- [ ] Migrazione `001` completata senza errori.
- [ ] Migrazione `002` completata senza errori.
- [ ] Migrazione `003` completata senza errori.

Verificare le tabelle:

```sql
select table_name
from information_schema.tables
where table_schema = 'rsvp'
order by table_name;
```

Risultato atteso: `admin_events`, `audit_events`, `households`, `invitees`,
`responses`.

### 6.3 Creare un invito locale fittizio

Eseguire soltanto nel branch di test. Il primo `delete` rimuove un eventuale
vecchio fixture con lo stesso nome; grazie alle relazioni `on delete cascade`
rimuove anche le relative persone e risposte di prova.

```sql
begin;

delete from rsvp.households
where display_name = 'TEST LOCALE — DA ELIMINARE';

with household as (
  insert into rsvp.households (
    display_name,
    token_hash,
    preferred_locale,
    deadline
  )
  values (
    'TEST LOCALE — DA ELIMINARE',
    encode(
      digest('site-love-local-test-only-2026', 'sha256'),
      'hex'
    ),
    'it',
    now() + interval '30 days'
  )
  returning id
)
insert into rsvp.invitees (household_id, display_name, sort_order)
select household.id, fixture.display_name, fixture.sort_order
from household
cross join (
  values
    ('Ada Prova', 0::smallint),
    ('Teo Prova', 1::smallint)
) as fixture(display_name, sort_order);

commit;
```

- [ ] Verificare il fixture:

```sql
select
  households.display_name as nucleo,
  invitees.display_name as invitato,
  households.deadline
from rsvp.households
join rsvp.invitees on invitees.household_id = households.id
where households.display_name = 'TEST LOCALE — DA ELIMINARE'
order by invitees.sort_order;
```

- [ ] Il risultato contiene esattamente Ada Prova e Teo Prova.

### 6.4 Collegare il branch di test al sito locale

- [ ] Copiare dal pannello Neon la connection string del branch di test.
- [ ] Inserirla soltanto in `DATABASE_URL` dentro `.env.local`.
- [ ] Non mostrarla nel Terminale, negli screenshot o in Git.
- [ ] Lasciare vuote entrambe le variabili Turnstile per questo test locale.
- [ ] Fermare `npm run dev` con `Control + C` e riavviarlo:

```bash
npm run dev
```

---

## Fase 7 — Test completo del form RSVP

Aprire:

```text
http://localhost:3000/rsvp/site-love-local-test-only-2026
```

### 7.1 Apertura e validazione

- [ ] Appare il nucleo “TEST LOCALE — DA ELIMINARE”.
- [ ] Appaiono Ada Prova e Teo Prova.
- [ ] La scadenza è visibile e futura.
- [ ] Il cambio Italiano/English modifica correttamente il form.
- [ ] Premere Salva senza scegliere la presenza: il browser impedisce l'invio.
- [ ] Non esistono campi liberi per allergie, salute, email o telefono.
- [ ] Il collegamento privacy funziona.

### 7.2 Primo salvataggio

- [ ] Impostare Ada: presente, menu vegetariano.
- [ ] Impostare Teo: assente.
- [ ] Premere “Salva la risposta”.
- [ ] Appare “Risposta salvata. Grazie!”.
- [ ] Ricaricare la pagina.
- [ ] Ada resta presente con menu vegetariano.
- [ ] Teo resta assente; lato server il menu viene salvato come non necessario.

### 7.3 Modifica successiva

- [ ] Cambiare Teo in presente con menu standard.
- [ ] Salvare di nuovo.
- [ ] Ricaricare e verificare che la nuova risposta sia persistita.

### 7.4 Concorrenza fra due schede

- [ ] Aprire lo stesso link in due schede prima di fare altre modifiche.
- [ ] Nella prima scheda modificare e salvare una risposta.
- [ ] Nella seconda, senza ricaricare, modificare e salvare.
- [ ] La seconda scheda mostra il messaggio che la risposta è stata modificata
  altrove e chiede di ricaricare.
- [ ] Ricaricare la seconda scheda e salvare: ora deve riuscire.

### 7.5 Link inesistente

- [ ] Aprire:

```text
http://localhost:3000/rsvp/questo-token-non-esiste-2026
```

- [ ] Con Neon collegato appare “Invito non disponibile”.
- [ ] Il messaggio non rivela se esiste un nucleo simile.

### 7.6 Scadenza e revoca — facoltativo

Eseguire soltanto sul fixture di test e ripristinare lo stato dopo ogni prova.

Scadere temporaneamente l'invito:

```sql
update rsvp.households
set deadline = now() - interval '1 minute'
where display_name = 'TEST LOCALE — DA ELIMINARE';
```

- [ ] Ricaricando il link appare “Invito non disponibile”.

Ripristinare una scadenza futura:

```sql
update rsvp.households
set deadline = now() + interval '30 days'
where display_name = 'TEST LOCALE — DA ELIMINARE';
```

Revocare temporaneamente:

```sql
update rsvp.households
set revoked_at = now()
where display_name = 'TEST LOCALE — DA ELIMINARE';
```

- [ ] Ricaricando il link appare “Invito non disponibile”.

Riattivare il fixture:

```sql
update rsvp.households
set revoked_at = null
where display_name = 'TEST LOCALE — DA ELIMINARE';
```

Il rate limit di dieci aggiornamenti per ora è una verifica avanzata e non è
necessario consumarlo durante il primo giro manuale.

---

## Fase 8 — Preparare e testare Clerk Development

Il test usa l'istanza Development. Non modificare l'istanza Production durante
questo giro.

### 8.1 Verificare il collegamento Clerk

Eseguire questi comandi nel Terminale normale del Mac, perché login, browser e
Portachiavi richiedono l'ambiente host:

- [ ] Eseguire per primo il controllo diagnostico:

```bash
npx -y clerk@latest doctor --json
```

- [ ] Se segnala che l'account non è autenticato o che l'app provvisoria deve
  essere reclamata, eseguire:

```bash
npx -y clerk@latest auth login
```

- [ ] Ripetere il controllo senza stampare le chiavi:

```bash
npx -y clerk@latest doctor --json
```

- [ ] Se il controllo riporta un problema di collegamento, eseguire prima:

```bash
npx -y clerk@latest link
```

- [ ] Ripetere `doctor --json` finché i controlli necessari risultano superati.

### 8.2 Creare l'utente amministratore di prova

- [ ] Nel Clerk Dashboard selezionare l'app corretta e l'istanza Development.
- [ ] Aprire Users.
- [ ] Creare oppure verificare il proprio utente amministratore.
- [ ] Copiare soltanto l'indirizzo email del proprio utente.
- [ ] Inserire quell'email in `.env.local`:

```text
RSVP_ADMIN_EMAILS=la-tua-email@example.com
```

- [ ] Non inserire altre email.
- [ ] Fermare e riavviare `npm run dev` dopo la modifica.

### 8.3 Login e protezione

- [ ] Aprire `http://localhost:3000/sign-in`.
- [ ] Accedere con l'utente Development autorizzato.
- [ ] Dopo il login si arriva a `http://localhost:3000/admin/rsvp`.
- [ ] La pagina saluta l'amministratore e mostra il riepilogo RSVP.
- [ ] I conteggi sono coerenti con il fixture: un nucleo e due invitati, oltre a
  eventuali altri fixture deliberatamente presenti nel branch di test.
- [ ] Ada e Teo mostrano le ultime risposte salvate.

### 8.4 Export CSV

- [ ] Premere “Esporta CSV”.
- [ ] Il download ha un nome simile a `rsvp-AAAA-MM-GG.csv`.
- [ ] Aprire il file con Numbers o Excel.
- [ ] Controllare nucleo, invitato, presenza, menu e data di aggiornamento.
- [ ] Il CSV non contiene token, hash, email, telefono o note sanitarie.
- [ ] Chiudere e cancellare il CSV di prova quando non serve più.

Verificare l'audit dal SQL Editor:

```sql
select event_type, metadata, created_at
from rsvp.admin_events
order by created_at desc
limit 5;
```

- [ ] L'ultimo export produce un evento `rsvp_exported` con il numero di righe,
  senza copiare le risposte nel metadata.

### 8.5 Logout

- [ ] Premere “Esci”.
- [ ] Tornare manualmente a `/admin/rsvp`.
- [ ] L'area non deve mostrare i dati senza una nuova sessione autorizzata.
- [ ] Usare il tasto Indietro del browser: i dati non devono riapparire da una
  cache pubblica.

---

## Fase 9 — Header e controlli tecnici locali

Con `npm run dev` ancora attivo, aprire un secondo Terminale nella cartella del
progetto.

- [ ] Controllare la home:

```bash
curl -I http://localhost:3000/
```

- [ ] Sono presenti almeno CSP, `X-Content-Type-Options: nosniff`, protezione
  frame e policy referrer/permissions.

- [ ] Controllare la route RSVP di prova:

```bash
curl -I http://localhost:3000/rsvp/site-love-local-test-only-2026
```

- [ ] Sono presenti `Cache-Control: private, no-store` e
  `X-Robots-Tag: noindex`.

- [ ] Controllare l'area sposi:

```bash
curl -I http://localhost:3000/admin/rsvp
```

- [ ] Senza sessione la risposta non espone dati e resta privata/non indicizzabile.

Nota: HSTS è atteso soltanto in produzione HTTPS, non sul server locale HTTP.

---

## Fase 10 — Verifica finale del codice

- [ ] Fermare `npm run dev` con `Control + C`. Dev e build non devono scrivere
  contemporaneamente in `.next`.
- [ ] Controllare spazi e file:

```bash
git diff --check
```

- [ ] Eseguire lint:

```bash
npm run lint
```

- [ ] Eseguire TypeScript:

```bash
npx tsc --noEmit --incremental false
```

- [ ] Eseguire la build di produzione:

```bash
npm run build
```

- [ ] Tutti i comandi terminano senza errori.
- [ ] La build mostra `/` e `/privacy` come statiche e RSVP/admin come dinamiche.

---

## Fase 11 — Pulizia dei dati di prova

Soltanto dopo aver terminato il giro e sempre nel branch Neon di test:

```sql
delete from rsvp.households
where display_name = 'TEST LOCALE — DA ELIMINARE';
```

- [ ] Verificare che il fixture sia scomparso:

```sql
select count(*)
from rsvp.households
where display_name = 'TEST LOCALE — DA ELIMINARE';
```

Risultato atteso: `0`.

- [ ] Cancellare CSV e screenshot che contengono dati del fixture se non servono.
- [ ] Lasciare `.env.local` fuori da Git.
- [ ] Controllare:

```bash
git status --short
```

- [ ] `.env.local`, CSV, dump e screenshot privati non compaiono fra i file da
  pubblicare.

---

## Rapporto personale del test

Data: `________________`  Browser/versione: `________________`

Mac/modello: `________________`  Branch Git: `________________`

Branch Neon di test: `________________`

| N. | Pagina o fase | Risultato atteso | Risultato reale | Gravità | Screenshot/note |
| ---: | --- | --- | --- | --- | --- |
| 1 | | | | bloccante / alta / media / bassa | |
| 2 | | | | bloccante / alta / media / bassa | |
| 3 | | | | bloccante / alta / media / bassa | |

### Esito complessivo

- [ ] Giro visivo superato.
- [ ] Responsive superato.
- [ ] Italiano/inglese superato.
- [ ] RSVP con persistenza superato.
- [ ] Concorrenza superata.
- [ ] Login e allowlist superati.
- [ ] Dashboard ed export superati.
- [ ] Header e stati privati superati.
- [ ] Lint, TypeScript e build superati.
- [ ] Fixture e file di prova eliminati.

Decisione finale personale:

- [ ] pronto per configurare la Preview online;
- [ ] non pronto: correggere prima i problemi annotati.
