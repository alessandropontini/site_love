# Alessandro & Bridget — La nostra avventura

Un microsito Next.js mobile-first costruito come una piccola storia interattiva. Non è una landing page né un lungo scorrimento: il visitatore entra in una mappa illustrata di Milano, completa quattro fermate, raccoglie ricordi e apre una lettera finale.

Il teatro di cartone montato da `app/page.tsx` è la linea narrativa principale e l'esperienza destinata alla produzione. Le implementazioni precedenti restano nel repository soltanto come riferimenti non montati.

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
2. **Mappa viva** — una sola fermata disponibile alla volta.
3. **La scintilla** — sintonizzazione di un segnale.
4. **Le coordinate** — tre abbinamenti accessibili tramite tap.
5. **Le scelte** — quattro gesti da ricomporre.
6. **Le finestre accese** — tre sequenze luminose da osservare e ripetere.
7. **Ricompense** — un oggetto entra nello zaino dopo ogni prova.
8. **Finale** — i quattro oggetti aprono una lettera HTML.

Il progresso è sequenziale, idempotente e salvato soltanto nel browser tramite `localStorage`. Inventario e finale sono derivati dai capitoli completati; non servono account, database, API o servizi a pagamento. Il comando per ridurre il movimento è visibile e viene ricordato sul dispositivo, mentre la preferenza di sistema ha sempre la precedenza.

Le vecchie implementazioni scrollytelling e arcade restano nel repository come riferimento, ma non sono montate nel percorso pubblico.

## Where To Customize

- `lib/experienceConfig.ts` – titoli, luoghi, istruzioni e ricompense delle quattro fermate.
- `lib/useExperienceProgress.ts` – stato versionato, gating, migrazione e persistenza locale.
- `components/experience/ExperienceShell.tsx` – regia di invito, mappa, capitoli, ricompense e finale.
- `components/experience/JourneyMap.tsx` – hub visuale e stati `completata`, `disponibile`, `bloccata`.
- `components/experience/challenges/*` – le quattro interazioni leggere.
- `components/experience/art/*` – quinte, landmark e marionette del teatro di cartone.
- `components/experience/ExperienceShell.module.css` – design system, scene e layout responsive.
- `components/QuestGame.tsx` – legacy arcade quest shell kept intact.
- `components/quest/questSchema.tsx` – legacy arcade chapter metadata.
- `components/quest/games/*` – legacy arcade mini-game mechanics.
- `components/pixel/` – componenti legacy, non montati dalla route pubblica.
- `public/scene/paper-theatre/` – Duomo, tram e coppia di cartone locali; nessuna immagine remota è necessaria.
- `data/` – still ignored; stash heavyweight concept art or exports here if needed.

- Per struttura, stato e confini legacy: `docs/architecture.md`.
- Per personalizzare capitoli, prove e ricompense: `docs/quest-guide.md`.
- Per la direzione visiva corrente: `docs/visual-direction.md`.
- Per il workflow AI e le review: `docs/ai-workflow.md` e `docs/multiagent-workflow.md`.
- Per l'infrastruttura CrewAI candidata: `docs/crewai-orchestration.md`.

## Local Review Workflow

Ruflo is not part of this project workflow. Real multi-agent review uses Codex CLI only:

```bash
npm run lint
npm run build
MULTIAGENT_PROVIDER=codex ./scripts/local-review.sh
RUN_DIR="$(ls -td .agent/reports/* | head -1)"
cat "$RUN_DIR/99_final-verdict.md"
```

`noop` is only for smoke tests and must produce `INFRASTRUCTURE BLOCKED`; it is not review evidence. A valid review requires `Provider: codex` and `Real execution: yes` in the required reports. `PASS` and `PASS WITH NOTES` still require final human approval, and `PASS WITH NOTES` requires notes to be resolved or explicitly accepted before merge.

CrewAI is scaffolded only for future orchestration of implementation and review lanes; it does not replace Codex review or approve patches.

## Experience checklist

- L&apos;invito resta sempre leggibile e non parte automaticamente.
- La mappa mostra una sola tappa disponibile; le successive restano bloccate.
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

La build è statica sul percorso `/` e può essere pubblicata su un piano gratuito compatibile con Next.js. Per preview temporanee si può usare un tunnel gratuito; l&apos;URL del tunnel cambia quando il processo viene riavviato.

## Tech Stack Highlights

- **Next.js 14** with the App Router powering the single-page quest.
- **React hooks** per stato, persistenza e interazioni.
- **CSS Modules e SVG** per mappa, transizioni e scene senza librerie runtime aggiuntive.
- **Diorama di carta stratificato** per Duomo, tram e protagonisti.
- **TypeScript strict** per gating e configurazione dei capitoli.

Le fotografie personali non sono ancora presenti in `public/photos/`. Quando saranno disponibili, devono essere locali, ottimizzate e inserite nei reveal narrativi senza sostituire l’interfaccia HTML accessibile.
