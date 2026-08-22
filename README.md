# Alessandro & Bridget — La nostra avventura

Un microsito matrimoniale Next.js mobile-first, bilingue e liberamente leggibile. L'unica route destinata agli invitati è `/`: nessun gioco, challenge o percorso a progressione è montato o raggiungibile dal sito. Le route non collegate `/duomo-proposals` e `/sun-proposals` restano soltanto superfici interne di revisione visiva.

La pagina accompagna gli invitati attraverso un unico flusso:

1. **Storia** — invito interattivo e racconto editoriale.
2. **Foto** — immagini personali locali della coppia.
3. **Location** — Casa Nuova Niviano, descritta con dati e link ufficiali.
4. **RSVP** — oggi una sezione informativa; in futuro l'accesso personale per nucleo di invitati.
5. **Lettera** — chiusura narrativa aperta, senza contenuti da sbloccare.

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

2. Avvia il server di sviluppo:

   ```bash
   npm run dev
   ```

3. Apri http://localhost:3000.

## RSVP

La sezione RSVP corrente è intenzionalmente informativa: non contiene un form e non finge di registrare risposte senza un backend.

Il flusso futuro prevede:

- un QR diverso per ogni nucleo di invitati;
- una destinazione stabile `/rsvp/[token]`;
- un token casuale, opaco e non riconducibile ai nomi nel suo contenuto;
- risoluzione dell'invito e salvataggio delle risposte esclusivamente lato server;
- possibilità di modificare la risposta secondo le regole che verranno definite prima del lancio.

Liste invitati, token, risposte e QR generati non devono entrare in `public/`, nel bundle client, in file versionati o in `localStorage`. I QR definitivi si generano soltanto dopo aver stabilizzato dominio e backend. Il contratto completo è in `docs/rsvp.md`.

## Fotografie e location

Le fotografie personali della galleria sono file locali ottimizzati; EXIF, coordinate GPS e metadati non necessari devono essere rimossi prima dell'inclusione. Copy, didascalie e testi alternativi restano HTML bilingue.

La location è [Casa Nuova Niviano](https://www.casanuovaniviano.com/). La home deve usare soltanto informazioni verificabili dal sito ufficiale o fornite direttamente dalla coppia. Le fotografie della struttura trovate online non sono automaticamente riutilizzabili: immagini autorizzate della location devono ancora essere fornite prima di montarle nel sito.

## Dove intervenire

- `app/page.tsx` — unico ingresso pubblico e metadata social.
- `components/editorial/` — navigazione, hero, storia, galleria, `WeddingVenue`, `RsvpSection`, lettera e footer.
- `lib/editorialConfig.ts` — copy bilingue, ID di sezione, asset e label accessibili della home.
- `components/editorial/EditorialLocaleProvider.tsx` — lingua e preferenza della home, separate dall’esperienza conservata.
- `lib/i18n.ts` — dizionari dell’esperienza a giochi conservata; non è una sorgente di copy della home.
- `public/photos/` — immagini locali approvate e private dei metadati.
- `components/experience/` — esperienza a giochi conservata ma non montata.
- `lib/experienceConfig.ts` e `lib/useExperienceProgress.ts` — configurazione e persistenza conservate; non modificare per lavori ordinari sulla home.
- `docs/editorial-home.md` — manutenzione della pagina pubblica.
- `docs/rsvp.md` — confini privacy e architettura RSVP.
- `docs/quest-guide.md` — manutenzione dell'esperienza a giochi non montata.
- `docs/visual-direction.md` — direzione visiva.
- `docs/architecture.md` — confini di route, stato e dati.

## Verifica e review

Prima di consegnare una modifica, aggiorna sempre `CHANGELOG.md` nella sezione `Unreleased` e la guida direttamente interessata. La verifica è proporzionata al rischio:

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

Arresta `npm run dev` prima della build: entrambi scrivono in `.next`. La home viene resa lato server per produrre metadata social assoluti in base all'host della richiesta e richiede un hosting compatibile con Next.js.

## Stack

- Next.js 16 App Router e React 19.
- TypeScript 6 strict.
- CSS Modules e API native del browser.
- Instrument Sans e Newsreader tramite `next/font`.
- Three.js caricato dinamicamente soltanto nell'invito della hero.
- Immagini locali ottimizzate con `next/image`.
