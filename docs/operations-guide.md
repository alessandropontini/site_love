# Guida operativa: controllare SITE LOVE

Questa guida è il pannello di controllo umano del sito. Spiega dove guardare,
quali comandi eseguire e cosa fare prima di una pubblicazione o in caso di
problema. È scritta per essere seguita un comando alla volta.

Per il primo giro personale completo usare `docs/local-test-checklist.md`: separa
il controllo visivo immediato dal test con Neon e Clerk Development, contiene un
fixture RSVP fittizio e termina con pulizia e rapporto degli eventuali problemi.

Stato attuale: il codice locale è pronto e il repository GitHub è collegato; il
dominio definitivo e le istanze Production di Vercel, Neon, Clerk e Turnstile
devono ancora essere configurati. Aggiornare questa riga al momento del lancio.

## Regole fondamentali

1. Non incollare mai password, stringhe Neon, chiavi Clerk o segreti Turnstile
   in chat, commit, screenshot o documenti condivisi.
2. Non mettere liste invitati, QR, manifest, CSV o dump nella cartella del
   progetto.
3. Controllare sempre `git status` e il contenuto preparato prima di un commit.
4. Usare Preview per provare le modifiche; rendere Production soltanto ciò che è
   stato verificato.
5. Prima di cancellare o ripristinare dati, creare un backup e verificare il
   bersaglio. Il rollback Vercel ripristina il codice, non il database.
6. Attivare MFA su registrar, GitHub, Vercel, Neon, Clerk e Cloudflare.

## Mappa degli strumenti

| Strumento | Cosa controlla | Dove guardare | Frequenza minima |
| --- | --- | --- | --- |
| Terminale sul Mac | sviluppo, test, backup e QR | cartella `site_love` | a ogni modifica |
| GitHub | copia privata e storia del codice | repository `alessandropontini/site_love` | a ogni pubblicazione |
| Vercel | sito online, Preview, Production, log, dominio e variabili | progetto SITE LOVE | dopo ogni deploy e ogni settimana |
| Neon | inviti e risposte RSVP | progetto e branch Production | ogni settimana durante gli RSVP |
| Clerk | accesso esclusivo degli sposi | istanza Production, Users e Sessions | ogni settimana |
| Cloudflare Turnstile | controllo anti-bot | widget RSVP e Analytics | ogni settimana |
| Registrar del dominio | proprietà, rinnovo e DNS | pannello del dominio | mensile |
| Spazio cifrato privato | backup, manifest e QR | disco/volume accessibile solo agli sposi | dopo ogni backup/import |

## 1. Lavorare in locale

Aprire Terminale e spostarsi nella cartella corretta:

```bash
cd /Users/alessandropontini/progetti/site_love
```

Controllare dove ci si trova e quali file sono cambiati:

```bash
pwd
git status --short
```

Alla prima apertura, oppure dopo una modifica di `package-lock.json`:

```bash
npm install
```

Avviare il sito locale:

```bash
npm run dev
```

Aprire `http://localhost:3000`. L'indirizzo Network funziona soltanto nella
stessa rete Wi-Fi. Per fermare il server premere `Control + C` nel Terminale.

Se la cartella non ha modifiche locali e si vuole scaricare l'ultima versione
da GitHub:

```bash
git pull --ff-only
```

Non eseguire il pull alla cieca se `git status` mostra file modificati: prima
capire se quelle modifiche devono essere conservate.

## 2. Variabili e segreti locali

Il modello delle variabili è `.env.example`; i valori reali appartengono a
`.env.local`, che non deve essere versionato.

```bash
cp .env.example .env.local
```

I nomi richiesti sono:

- `NEXT_PUBLIC_SITE_URL` — dominio pubblico definitivo;
- `NEXT_PUBLIC_PRIVACY_CONTROLLER_NAMES` e
  `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` — identità e recapito pubblici
  dell’informativa, obbligatori prima degli invitati reali;
- `NEXT_PUBLIC_RSVP_TRIAL_MODE=1` — mantiene visibile l’avviso di prova fino al
  completamento dell’intera checklist di lancio;
- `DATABASE_URL` — connessione Neon del ruolo runtime;
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`;
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`;
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`;
- `NEXT_PUBLIC_CLERK_FRONTEND_API_URL` — dominio FAPI di produzione;
- `RSVP_ADMIN_EMAILS` — soltanto le email degli sposi;
- `RSVP_EMAIL_ENABLED`, `RESEND_API_KEY`, `RSVP_EMAIL_FROM` e l'eventuale
  `RSVP_EMAIL_REPLY_TO` — conferme automatiche, da attivare soltanto dopo la
  verifica del dominio mittente e dell'informativa;
- le due variabili `CLERK_TELEMETRY_DISABLED` impostate a `1`.

Le variabili che iniziano con `NEXT_PUBLIC_` sono visibili al browser e non
devono mai contenere un segreto. Dopo una modifica alle variabili Vercel serve
un nuovo deployment: una modifica non cambia i deployment già costruiti.

## 3. Controlli prima di pubblicare

Eseguire nell'ordine:

```bash
git diff --check
```

```bash
npm run lint
```

```bash
npx tsc --noEmit --incremental false
```

```bash
npm run build
```

```bash
npm audit
```

Tutti devono terminare senza errori critici. `npm audit` non autorizza a
eseguire automaticamente `npm audit fix --force`: gli aggiornamenti forzati
possono rompere Next.js e vanno valutati separatamente.

Per provare esattamente la build di produzione in locale, dopo il build:

```bash
npm start
```

Controllare almeno `/`, `/privacy`, un link RSVP di prova, `/sign-in` e
`/admin/rsvp`. Non usare un link RSVP reale in screenshot o ticket.

## 4. Salvare il lavoro su GitHub e ottenere una Preview

Creare un ramo dedicato alla modifica:

```bash
git switch -c update/descrizione-breve
```

Dopo i controlli, aggiungere soltanto i file intenzionali, elencandoli:

```bash
git add percorso/file-1 percorso/file-2
```

Controllare ciò che entrerà nel commit:

```bash
git diff --cached
```

```bash
git status --short
```

Creare il commit e inviarlo a GitHub:

```bash
git commit -m "feat: descrizione breve della modifica"
```

```bash
git push -u origin update/descrizione-breve
```

Su GitHub aprire una Pull Request verso `main`. Vercel crea una Preview per il
ramo: aprirla, controllarla da telefono e computer, quindi unire la Pull Request
soltanto se la Preview è corretta. Il merge su `main` avvia normalmente il
deployment Production.

Non usare `git add .` senza aver prima letto `git status`; non usare force push,
`git reset --hard` o comandi di cancellazione per risolvere un dubbio.

## 5. Controllare Vercel

Nel progetto SITE LOVE verificare:

1. **Overview** — l'ultimo deployment Production è `Ready` e corrisponde al
   commit atteso.
2. **Deployments** — Preview e Production non mostrano errori di build.
3. **Logs** — nessun aumento anomalo di errori `4xx/5xx` sulle route RSVP e
   admin; non copiare nei ticket URL RSVP completi.
4. **Settings → Environment Variables** — tutti i nomi richiesti esistono negli
   ambienti corretti; Preview non deve usare il database Production.
5. **Settings → Domains** — dominio principale e `www` sono validi, uno dei due
   reindirizza all'altro e il certificato HTTPS è attivo.
6. **Usage** — il progetto resta nei limiti Hobby; non attivare Pro,
   integrazioni a pagamento o componenti a consumo senza una decisione.

Vercel assegna una URL distinta a ogni deployment. Le variabili sono separate
per Development, Preview e Production. Riferimenti ufficiali:
[deployment](https://vercel.com/docs/deployments/overview),
[ambienti](https://vercel.com/docs/deployments/environments),
[variabili](https://vercel.com/docs/environment-variables) e
[dominio](https://vercel.com/docs/domains/set-up-custom-domain).

### Verifica rapida del dominio

Sostituire `example.it` con il dominio reale:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://example.it/
```

Il risultato atteso per home e privacy è `200`:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://example.it/privacy
```

Controllare DNS e HTTPS dal pannello Vercel; i valori DNS vanno copiati da quel
pannello, non da esempi trovati online. Vercel genera il certificato dopo la
verifica DNS.

## 6. Controllare Neon

Nel progetto Neon selezionare sempre il branch giusto prima di aprire SQL Editor
o Database Studio.

Controllare:

- branch Production presente e separato da Preview/test;
- regione europea scelta al momento della creazione;
- tabelle `rsvp.households`, `rsvp.invitees`, `rsvp.responses`,
  `rsvp.audit_events` e `rsvp.admin_events` presenti;
- ruolo runtime senza privilegi da proprietario;
- uso di compute, storage e trasferimento entro il piano Free;
- Restore window e aggiornamenti programmati visibili nelle impostazioni;
- assenza di collaboratori non necessari.

Le migrazioni si applicano una volta, in ordine, con una connessione proprietaria
non usata da Vercel:

```bash
read -s "DATABASE_OWNER_URL?Connessione proprietaria Neon: "
export DATABASE_OWNER_URL
```

```bash
psql "$DATABASE_OWNER_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_rsvp.sql
```

```bash
psql "$DATABASE_OWNER_URL" -v ON_ERROR_STOP=1 -f db/migrations/002_admin_audit.sql
```

```bash
psql "$DATABASE_OWNER_URL" -v ON_ERROR_STOP=1 -f db/migrations/003_household_rate_limit.sql
```

```bash
psql "$DATABASE_OWNER_URL" -v ON_ERROR_STOP=1 -f db/migrations/004_invitee_source.sql
```

```bash
psql "$DATABASE_OWNER_URL" -v ON_ERROR_STOP=1 -f db/migrations/005_household_invitation_source.sql
```

```bash
psql "$DATABASE_OWNER_URL" -v ON_ERROR_STOP=1 -f db/migrations/006_attendance_phase.sql
```

```bash
psql "$DATABASE_OWNER_URL" -v ON_ERROR_STOP=1 -f db/migrations/007_household_plus_one_permission.sql
```

```bash
unset DATABASE_OWNER_URL
```

I grant esatti del ruolo runtime sono in `docs/deployment.md`. I ruoli creati
via SQL ricevono soltanto i privilegi esplicitamente concessi. Consultare le
guide Neon su [progetti e Restore window](https://neon.com/docs/manage/projects),
[ruoli](https://neon.com/docs/reference/compatibility) e
[database/branch](https://neon.com/docs/manage/databases).

## 7. Controllare Clerk

Usare sempre l'istanza **Production**, non Development. Nel pannello:

1. impostare Access mode su **Invite-only**;
2. creare soltanto gli account degli sposi;
3. attivare e richiedere MFA, preferibilmente app autenticatore/passkey più
   codici di recupero custoditi separatamente;
4. controllare **Users** e **Sessions**: nessun utente o dispositivo inatteso;
5. verificare che `RSVP_ADMIN_EMAILS` in Vercel contenga esattamente le email
   amministratrici;
6. revocare immediatamente sessioni sospette e ruotare la chiave segreta se è
   stata esposta.

La allowlist del codice resta il secondo controllo: avere un account Clerk non
basta per accedere ai dati. Riferimenti ufficiali:
[istanze Dashboard](https://clerk.com/docs/guides/dashboard/overview),
[accesso limitato](https://clerk.com/docs/guides/secure/restricting-access) e
[MFA](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options).

Per reclamare l'applicazione Clerk di sviluppo già creata localmente:

```bash
npx -y clerk@latest auth login
```

Per verificare la configurazione locale senza stampare segreti:

```bash
npx -y clerk@latest doctor
```

## 8. Controllare Cloudflare Turnstile

Nel widget RSVP verificare:

- hostname di Production corretto; non autorizzare `localhost` nel widget
  Production;
- chiavi diverse tra test e Production;
- validazione server attiva e action `rsvp_submit`;
- Analytics senza improvvisi picchi di traffico, errori o solve rate anomalo;
- secret key mai presente nel browser, in GitHub o in screenshot.

Cloudflare raccomanda widget separati per ambienti, hostname limitati,
monitoraggio e rotazione periodica. Durante una rotazione il vecchio e il nuovo
secret possono convivere per una finestra di due ore: aggiornare Vercel e fare
un nuovo deployment prima della fine della finestra. Riferimenti:
[configurazione](https://developers.cloudflare.com/turnstile/get-started/),
[hostname](https://developers.cloudflare.com/turnstile/additional-configuration/hostname-management/),
[analytics](https://developers.cloudflare.com/turnstile/turnstile-analytics/) e
[rotazione](https://developers.cloudflare.com/turnstile/troubleshooting/rotate-secret-key/).

## 9. Controllare dominio e DNS

Nel registrar:

- attivare MFA e blocco trasferimento;
- verificare email del proprietario e metodo di pagamento;
- attivare il rinnovo automatico e annotare la data di scadenza;
- conservare codici di recupero fuori dal computer;
- non cambiare nameserver o record DNS senza confrontarli con Vercel;
- verificare ogni mese che dominio, `www` e HTTPS funzionino.

Non copiare valori A/CNAME da questa guida: usare quelli mostrati da **Vercel →
Settings → Domains** per il progetto reale.

## 10. Importare invitati e generare i QR

Eseguire questa procedura soltanto dopo dominio HTTPS, database e form finali.
Il JSON degli invitati deve stare fuori dal repository e il suo formato è in
`docs/deployment.md`.

Caricare in modo non visibile una connessione Neon operativa temporanea con
permessi di inserimento su nuclei e invitati:

```bash
read -s "DATABASE_URL?Connessione operativa Neon: "
export DATABASE_URL
```

Impostare il dominio, che è un dato pubblico:

```bash
export NEXT_PUBLIC_SITE_URL='https://example.it'
```

Generare database, manifest e QR in una cartella privata esterna:

```bash
npm run create:rsvp-invitations -- '/percorso/privato/invitati.json' '/percorso/cifrato/rsvp-output'
```

Rimuovere la connessione dalla sessione del Terminale:

```bash
unset DATABASE_URL
```

Contare i nuclei nel manifest, scansionare ogni QR e verificare manualmente
l'abbinamento. Non rigenerare lo stesso lotto senza prima controllare il
database: il comando crea nuovi inviti.

## 11. Dashboard, CSV e backup RSVP

Area sposi:

- login: `https://example.it/sign-in`;
- dashboard: `https://example.it/admin/rsvp`;
- CSV: pulsante nella dashboard protetta.

Il CSV contiene dati personali. Scaricarlo solo quando serve e cancellare le
copie superflue dopo la consegna a location/catering.

Per il backup usare una connessione Neon **unpooled** con accesso in lettura,
inserita senza mostrarla:

```bash
read -s "DATABASE_URL?Connessione Neon unpooled per backup: "
export DATABASE_URL
```

```bash
npm run backup:rsvp -- '/percorso/cifrato/site-love-backups'
```

```bash
unset DATABASE_URL
```

Verificare che il file `.dump` sia presente e custodito con permessi privati.
Una volta al mese provare il ripristino esclusivamente in un branch Neon di
test, mai sopra Production:

```bash
read -s "TEST_DATABASE_URL?Connessione branch di test: "
export TEST_DATABASE_URL
```

```bash
pg_restore --dbname="$TEST_DATABASE_URL" --clean --if-exists --no-owner --no-acl '/percorso/cifrato/site-love-backups/rsvp-DATA.dump'
```

```bash
unset TEST_DATABASE_URL
```

Dopo il restore, controllare dal branch di test che dashboard e conteggi siano
corretti. Neon consiglia connessioni unpooled per `pg_dump`/`pg_restore`.

## 12. Controlli ricorrenti

### Dopo ogni deploy

- home e privacy restituiscono `200`;
- Vercel mostra Production `Ready` e commit corretto;
- un invito di test si apre e salva/modifica una risposta;
- login sposi, dashboard ed export funzionano;
- Turnstile mostra verifiche valide;
- i log non contengono URL personali completi o dati degli invitati.

### Ogni settimana durante la raccolta RSVP

- Vercel: errori e Usage;
- Neon: uso risorse, branch e numero risposte;
- Clerk: utenti e sessioni;
- Turnstile: traffico e fallimenti;
- un backup cifrato riuscito;
- GitHub: Dependabot e secret-scanning, se disponibili sul piano.

### Ogni mese

- restore del backup su branch di test;
- dominio, rinnovo, DNS e HTTPS;
- revisione degli accessi a tutti i pannelli;
- aggiornamenti dipendenze valutati, mai applicati automaticamente alla cieca.

### Dopo il matrimonio

Seguire la data di conservazione approvata in `docs/privacy.md`: esportare solo
ciò che serve, eliminare risposte e backup alla scadenza e annotare l'avvenuta
cancellazione. La pagina privacy è ancora provvisoria e va completata prima di
raccogliere dati reali.

## 13. Emergenze

### Il nuovo sito è rotto ma i dati sono integri

In Vercel aprire **Deployments**, scegliere la precedente Production valida e
usare **Instant Rollback**. Nel piano Hobby è disponibile la precedente
versione di produzione. Il rollback non ricostruisce le variabili e non annulla
modifiche al database. Dopo la correzione, promuovere il nuovo deployment per
ripristinare il flusso normale. Vedere la
[procedura Vercel](https://vercel.com/docs/deployments/rollback-production-deployment).

### Una chiave o password è stata esposta

1. Non cancellare log o prove.
2. Ruotare subito la credenziale nel servizio proprietario.
3. Aggiornare il valore Production e Preview in Vercel.
4. Avviare un nuovo deployment.
5. Revocare sessioni sospette in Clerk.
6. Verificare accessi, log e repository GitHub.
7. Se il segreto è entrato in Git, considerarlo compromesso anche dopo aver
   cancellato il file e chiedere una bonifica controllata della storia.

### Un link RSVP è stato condiviso con la persona sbagliata

Non reinviare lo stesso link. Annotare il nucleo coinvolto, revocare/ruotare il
token con una procedura controllata e consegnare un nuovo QR. Non modificare a
mano righe Production senza backup e doppio controllo.

### Sospetta alterazione o perdita di risposte

Smettere di fare modifiche, creare un backup dello stato attuale e verificare
timestamp/audit. Usare un branch Neon o Time Travel per esaminare un punto
precedente; ripristinare Production soltanto dopo aver verificato il bersaglio.

## 14. Comandi da non usare come scorciatoia

- `git reset --hard`;
- `git push --force`;
- cancellazioni ricorsive della cartella del progetto;
- `npm audit fix --force` senza revisione;
- `DROP`, `TRUNCATE`, restore o migrazioni distruttive su Production senza
  backup e controllo;
- comandi che contengono segreti direttamente nella riga, perché restano nella
  cronologia del Terminale.

## Documenti collegati

- `docs/architecture-diagram.md` — disegno completo dei servizi e dei flussi;
- `docs/architecture.md` — confini tecnici dell'applicazione;
- `docs/local-test-checklist.md` — checklist personale del giro locale completo;
- `docs/deployment.md` — attivazione iniziale e variabili Production;
- `docs/rsvp.md` — token, dati, form e area sposi;
- `docs/privacy.md` — minimizzazione, accesso e cancellazione;
- `db/README.md` — migrazioni e backup database.
