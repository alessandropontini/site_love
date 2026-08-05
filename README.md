# Alessandro & Bridget — La nostra avventura

Un microsito Next.js mobile-first costruito come una piccola storia interattiva. Non è una landing page né un lungo scorrimento: il visitatore entra in un teatro di cartone, sceglie dall'indice, apre quattro capitoli illustrati di Milano, raccoglie ricordi e arriva al Duomo per la lettera finale.

Il teatro di cartone montato da `app/page.tsx` è la linea narrativa principale e l'esperienza destinata alla produzione. Le implementazioni precedenti restano nel repository soltanto come riferimenti non montati.

## Lingue

L'esperienza è disponibile integralmente in italiano e inglese, compresi giochi, messaggi di stato, controlli accessibili e metadata aggiornati nel browser. Alla prima visita il sito usa gratuitamente il fuso geografico e la lingua del dispositivo: i fusi italiani aprono in italiano, la lingua browser italiana è il secondo segnale e tutti gli altri casi usano l'inglese.

Il selettore visibile **IT / EN** permette sempre di cambiare lingua. La scelta viene salvata soltanto nel browser e ha priorità sui rilevamenti successivi; non vengono usati servizi IP, cookie di profilazione o API di traduzione.

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Start the dev server
   ```bash
   npm run dev
   ```
3. Apri http://localhost:3000 e premi **Entra nella storia**.

## Customer journey

Il percorso pubblico montato da `app/page.tsx` è:

1. **Invito** — promessa, durata e ingresso esplicito.
2. **Indice del teatro** — una sola pagina disponibile alla volta.
3. **La scintilla** — sintonizzazione di un segnale.
4. **Le coordinate** — tre abbinamenti accessibili tramite tap.
5. **Le scelte** — quattro gesti da ricomporre.
6. **Le luci di Adelchi** — tre sequenze luminose sulla facciata di via Adelchi.
7. **Ricompense** — un oggetto entra nello zaino dopo ogni prova.
8. **Finale al Duomo** — Alessandro e Bridget riuniscono i quattro oggetti e aprono una lettera HTML.

Il progresso è sequenziale, idempotente e salvato soltanto nel browser tramite `localStorage`. Inventario e finale sono derivati dai capitoli completati; non servono account, database, API o servizi a pagamento. Il comando per ridurre il movimento è visibile e viene ricordato sul dispositivo, mentre la preferenza di sistema ha sempre la precedenza.

Le vecchie implementazioni scrollytelling e arcade restano nel repository come riferimento, ma non sono montate nel percorso pubblico.

## Where To Customize

- `lib/experienceConfig.ts` – titoli, luoghi, istruzioni e ricompense delle quattro fermate.
- `lib/i18n.ts` – dizionari IT/EN, metadata e rilevamento iniziale della lingua.
- `components/experience/LocaleProvider.tsx` – stato locale, persistenza e selettore lingua.
- `lib/useExperienceProgress.ts` – stato versionato, gating, migrazione e persistenza locale.
- `components/experience/ExperienceShell.tsx` – regia di invito, indice, capitoli, ricompense e finale.
- `components/experience/JourneyMap.tsx` – indice visuale e stati `completata`, `disponibile`, `bloccata`.
- `components/experience/challenges/*` – le quattro interazioni leggere.
- `components/experience/art/*` – quinte, landmark e marionette del teatro di cartone.
- `components/experience/ExperienceShell.module.css` – design system, scene e layout responsive.
- `components/QuestGame.tsx` – legacy arcade quest shell kept intact.
- `components/quest/questSchema.tsx` – legacy arcade chapter metadata.
- `components/quest/games/*` – legacy arcade mini-game mechanics.
- `components/pixel/` – componenti legacy, non montati dalla route pubblica.
- `public/scene/paper-theatre/` – Duomo, tram, coppia e landmark milanesi locali, inclusi il Naviglio Grande primaverile e l'esterno serale di Adelchi; nessuna immagine remota è necessaria a runtime.
- `data/` – still ignored; stash heavyweight concept art or exports here if needed.

- Per struttura, stato e confini legacy: `docs/architecture.md`.
- Per personalizzare capitoli, prove e ricompense: `docs/quest-guide.md`.
- Per la direzione visiva corrente: `docs/visual-direction.md`.
- Per il workflow AI e le review: `docs/ai-workflow.md` e `docs/multiagent-workflow.md`.
- Per lo stato degli esperimenti CrewAI e OpenClaw: `docs/crewai-orchestration.md` e `docs/openclaw-orchestration.md`.

## Lean Codex Review

Codex è l'unico strumento AI operativo. La sessione interattiva sviluppa; una nuova esecuzione Codex in sola lettura svolge una sola review combinata Code + QA. Inserisci obiettivo e criteri di accettazione in un file locale, poi esegui:

```bash
git diff --check
MULTIAGENT_PROVIDER=codex \
  ./scripts/local-review.sh --request-file /tmp/site-love-review-request.md
RUN_DIR="$(ls -td .agent/reports/* | head -1)"
cat "$RUN_DIR/10_review-code-qa.md"
cat "$RUN_DIR/99_final-verdict.md"
```

Lo script esegue anche lint, build e smoke workflow, non modifica file applicativi e non fa commit, merge o push. `noop` resta gratuito per testare soltanto l'infrastruttura e deve produrre `INFRASTRUCTURE BLOCKED`. Anche `PASS` richiede approvazione umana finale. CrewAI e OpenClaw sono esperimenti inattivi, non passaggi di rilascio.

## Experience checklist

- L&apos;invito resta sempre leggibile e non parte automaticamente.
- L'indice mostra una sola tappa disponibile; le successive restano bloccate.
- Ogni successo assegna la ricompensa una volta sola.
- Il finale richiede tutti e quattro gli ID configurati, non soltanto un conteggio.
- Il reset richiede conferma e cancella soltanto i dati locali del sito.
- Tutte le prove sono completabili con pulsanti o controlli HTML nativi, senza drag obbligatorio.
- Il layout resta usabile tra 320 e 430 px e rispetta `prefers-reduced-motion`.

## Production Build

```bash
npm run build
npm start
```

Arresta sempre `npm run dev` prima di eseguire `npm run build`: entrambi scrivono nella directory `.next` e non devono girare contemporaneamente. Dopo una build, riavvia il server di sviluppo da una cache `.next` pulita prima di condividere la preview locale.

La build è statica sul percorso `/` e può essere pubblicata su un piano gratuito compatibile con Next.js. Per preview temporanee si può usare un tunnel gratuito; l&apos;URL del tunnel cambia quando il processo viene riavviato.

## Tech Stack Highlights

- **Next.js 14** with the App Router powering the single-page quest.
- **React hooks** per stato, persistenza e interazioni.
- **CSS Modules e SVG** per mappa, transizioni e scene senza librerie runtime aggiuntive.
- **Diorama di carta stratificato** per Duomo, tram e protagonisti.
- **TypeScript strict** per gating e configurazione dei capitoli.

Le fotografie personali non sono ancora presenti in `public/photos/`. Quando saranno disponibili, devono essere locali, ottimizzate e inserite nei reveal narrativi senza sostituire l’interfaccia HTML accessibile.
