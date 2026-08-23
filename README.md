# Alessandro & Bridget — La nostra avventura

Un microsito matrimoniale Next.js mobile-first e bilingue. La home `/` è liberamente leggibile; il flusso personale `/rsvp/[token]` è riservato agli invitati tramite link opaco. Nessun gioco, challenge o percorso a progressione è montato o raggiungibile dal sito. Le route non collegate `/proposal`, `/duomo-proposals` e `/sun-proposals` restano superfici interne di revisione visiva e in produzione restituiscono 404.

La pagina accompagna gli invitati attraverso un unico flusso:

1. **Invito** — apertura interattiva e racconto editoriale.
2. **Foto** — immagini personali locali della coppia.
3. **Location** — Casa Nuova Niviano, descritta con dati e link ufficiali.
4. **RSVP** — sezione informativa sulla home e accesso personale per nucleo invitato.

## Stato dei giochi

`ExperienceShell`, le quattro challenge, la configurazione dei capitoli e `lib/useExperienceProgress.ts` restano nel repository come lavoro conservato per una possibile esperienza separata. Non sono importati da una route pubblica e non devono essere rimontati senza una decisione esplicita.

Questa separazione non cancella codice, migrazioni, chiavi o progressi già presenti nel browser. Non eseguire reset o pulizie di `localStorage` come effetto collaterale del sito matrimoniale.

## Lingue

La home è disponibile in italiano e inglese. Alla prima visita usa, nell'ordine, una scelta manuale già salvata, il fuso geografico italiano, la lingua italiana del browser e infine l'inglese.

Il selettore visibile **IT / EN** salva soltanto la preferenza linguistica nel browser. Non vengono usati servizi IP, cookie di profilazione o API di traduzione.

## Avvio locale

1. Installa le dipendenze:

   ```bash
   npm install
   ```

2. Copia `.env.example` in `.env.local` e compila soltanto le variabili dei servizi che vuoi provare. Non condividere né versionare `.env.local`.

3. Avvia il server di sviluppo:

   ```bash
   npm run dev
   ```

4. Apri http://localhost:3000.

## RSVP

La sezione RSVP della home resta informativa. Il form reale esiste soltanto su `/rsvp/[token]` e salva esclusivamente nel database Neon quando `DATABASE_URL` è configurata. Senza database mostra un messaggio neutro e non finge che la risposta sia stata registrata.

Il flusso implementato prevede:

- un QR diverso per ogni nucleo di invitati;
- una destinazione stabile `/rsvp/[token]`;
- un token casuale, opaco e non riconducibile ai nomi nel suo contenuto;
- risoluzione dell'invito e salvataggio delle risposte esclusivamente lato server;
- modifica fino alla scadenza dell’invito, con controllo di concorrenza e limite anti-abuso;
- ripristino delle scelte salvate quando il link viene riaperto, conferma
  esplicita prima di una modifica e segnalazione amministrativa dell'invitato
  cambiato nell'ultimo invio;
- verifica Cloudflare Turnstile in produzione;
- dashboard protetta `/admin/rsvp`, allowlist email ed esportazione CSV per gli sposi.
- appartenenza delle persone al nucleo e provenienza privata unica per l'intero
  nucleo, visibili soltanto nella dashboard e nell'export;
- prima fase dedicata a email di contatto, presenza, un eventuale +1 nominativo
  e una sola indicazione sì/no sulla presenza di figli, senza loro dati anagrafici;
- scelta menu rinviata a una seconda fase sullo stesso link personale, dopo la
  conferma definitiva di location e catering.

Liste invitati, token, risposte, esportazioni e QR generati non devono entrare in `public/`, nel bundle client, in file versionati o in `localStorage`. `npm run create:rsvp-invitations` genera token e QR soltanto in una cartella privata esterna al repository e rifiuta domini non HTTPS. Va eseguito solo dopo aver stabilizzato dominio e backend. Il contratto completo è in `docs/rsvp.md`.

## Area sposi, export e backup

Clerk gestisce login e sessione; `RSVP_ADMIN_EMAILS` aggiunge l’autorizzazione esplicita. Essere registrati su Clerk non basta per leggere le risposte. Dashboard, export e relative azioni verificano autonomamente l’utente sul server e non espongono token RSVP.

`npm run backup:rsvp` crea un dump PostgreSQL locale con permessi riservati al proprietario. La cartella `backups/` è esclusa da Git, ma il file contiene dati personali e va spostato in uno spazio cifrato e privato. Procedura e ripristino di prova sono descritti in `db/README.md`.

## Messa online e costi

La soluzione prevista è Vercel Hobby + Neon Free + Clerk Free + Cloudflare Turnstile Free. Finché il traffico resta entro i rispettivi limiti gratuiti, il costo ricorrente obbligatorio è soltanto il dominio: indicativamente un `.it` costa pochi euro il primo anno e circa 11 € al rinnovo, da verificare al checkout. Ordine operativo, variabili, DNS e checklist sono in `docs/deployment.md`; privacy e conservazione sono in `docs/privacy.md`.

Il disegno completo di persone, servizi, dati, Preview, Production e rollback è
in `docs/architecture-diagram.md`. La procedura quotidiana per controllare tutti
i pannelli, eseguire i comandi, creare backup e gestire emergenze è in
`docs/operations-guide.md`.

## Fotografie e location

Le fotografie personali della galleria sono file locali ottimizzati; EXIF, coordinate GPS e metadati non necessari devono essere rimossi prima dell'inclusione. Copy, didascalie e testi alternativi restano HTML bilingue.

La location è [Casa Nuova Niviano](https://www.casanuovaniviano.com/). La home deve usare soltanto informazioni verificabili dal sito ufficiale o fornite direttamente dalla coppia. Le fotografie della struttura trovate online non sono automaticamente riutilizzabili: immagini autorizzate della location devono ancora essere fornite prima di montarle nel sito.

## Dove intervenire

- `app/page.tsx` — ingresso pubblico statico; i metadata canonici sono in `app/layout.tsx`.
- `app/rsvp/[token]/` — form personale bilingue e azione di salvataggio server-side.
- `app/admin/rsvp/` — dashboard ed export riservati agli sposi.
- `components/editorial/` — navigazione, hero, galleria, `WeddingVenue`, `RsvpSection` e footer; timeline e lettera restano conservate ma non montate.
- `lib/editorialConfig.ts` — copy bilingue, ID di sezione, asset e label accessibili della home.
- `components/editorial/EditorialLocaleProvider.tsx` — lingua e preferenza della home, separate dall’esperienza conservata.
- `lib/i18n.ts` — dizionari dell’esperienza a giochi conservata; non è una sorgente di copy della home.
- `public/photos/` — immagini locali approvate e private dei metadati.
- `components/experience/` — esperienza a giochi conservata ma non montata.
- `lib/experienceConfig.ts` e `lib/useExperienceProgress.ts` — configurazione e persistenza conservate; non modificare per lavori ordinari sulla home.
- `docs/editorial-home.md` — manutenzione della pagina pubblica.
- `docs/rsvp.md` — confini privacy e architettura RSVP.
- `docs/menu-proposal.md` — bozza dei percorsi piacentini e fonti territoriali
  da validare con location e catering.
- `docs/deployment.md` — hosting, dominio, servizi e checklist di pubblicazione.
- `docs/architecture-diagram.md` — diagramma dei flussi runtime, rilascio e backup.
- `docs/operations-guide.md` — pannelli, comandi, controlli periodici ed emergenze.
- `docs/local-test-checklist.md` — giro manuale locale completo con risultati attesi e fixture RSVP fittizio.
- `docs/privacy.md` — minimizzazione, accessi e conservazione dei dati.
- `docs/quest-guide.md` — manutenzione dell'esperienza a giochi non montata.
- `docs/visual-direction.md` — direzione visiva.
- `docs/architecture.md` — confini di route, stato e dati.

## Verifica e review

Prima di consegnare una modifica, aggiorna sempre `CHANGELOG.md` nella sezione `Unreleased` e la guida direttamente interessata. La verifica è proporzionata al rischio:

Per percorrere personalmente home, responsive, lingue, stati sicuri, RSVP con
dati fittizi, login sposi, dashboard, export e pulizia finale, seguire
`docs/local-test-checklist.md` dall'inizio alla fine.

Per modifiche a documentazione o copy è sufficiente:

```bash
git diff --check
```

Per codice o configurazione esegui:

```bash
git diff --check
npm run lint
npm run build
```

Le modifiche di codice richiedono lint e build, oltre a un controllo locale quando sono visibili. Per modifiche visibili, controlla tastiera, focus, cambio lingua, `prefers-reduced-motion` e layout a 320, 390, 768, 1024 e 1440 px. Verifica anche che `/` non esponga link o import dei giochi e che una vecchia destinazione di gioco non monti `ExperienceShell`.

La review indipendente combinata Code + QA è necessaria soltanto prima di una release o per cambiamenti ad alto rischio: dipendenze e configurazione, sicurezza/dati RSVP, routing o architettura, logica dei giochi, asset personali o di location, oppure su richiesta esplicita. In quei casi usa una nuova esecuzione Codex in sola lettura:

```bash
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
```

Anche `PASS` richiede approvazione umana finale. Lo script non deve fare commit, merge o push.

## Build di produzione

```bash
npm run build
npm start
```

Arresta `npm run dev` prima della build: entrambi scrivono in `.next`. La home e le pagine informative sono prerenderizzate; soltanto RSVP personale, login, dashboard ed export sono dinamici. `NEXT_PUBLIC_SITE_URL` rende assoluti i metadata social senza trasformare la home in una pagina server-side.

## Stack

- Next.js 16 App Router e React 19.
- TypeScript 6 strict.
- CSS Modules e API native del browser.
- Instrument Sans e Newsreader tramite `next/font`.
- Three.js caricato dinamicamente soltanto nell'invito della hero.
- Immagini locali ottimizzate con `next/image`.
- Neon Postgres serverless per inviti e risposte.
- Zod per la validazione server-side.
- Clerk per l’area amministrativa, separato dai link RSVP.
- Cloudflare Turnstile per ridurre gli abusi sul form.
