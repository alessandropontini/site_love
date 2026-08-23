# Changelog

Le modifiche completate vengono annotate qui in modo conciso. Le voci sono raggruppate per attività, non per commit.

## Unreleased

### Added

- Aggiunte al menu RSVP schede cliccabili bilingui con fotografie gastronomiche originali, descrizioni, ingredienti tipici e interazione accessibile da tastiera e telefono.
- Aggiunte la provenienza sposa/sposo/entrambi unica per ogni nucleo, la visualizzazione esplicita dei suoi componenti e i relativi campi nell'export privato.
- Aggiunta al form RSVP una proposta di menu piacentino tradizionale, vegetariano e per bambini, indicata come bozza da confermare con location e catering.
- Aggiunti il ripristino visibile delle scelte RSVP salvate, la conferma prima di sovrascriverle, il blocco degli invii identici e il badge amministrativo per gli invitati modificati nell'ultimo invio.
- Aggiunta la bozza locale `/proposal`: Alessandro e Bridget come burattini che si baciano sotto una Venere Apuana originale e stilizzata, con Carrara e le Alpi Apuane sullo sfondo.
- Aggiunto il flusso RSVP bilingue per nucleo con token opachi, validazione server-side, persistenza Neon, controllo di concorrenza, rate limit e Cloudflare Turnstile.
- Aggiunta l’area sposi protetta con Clerk e allowlist email, riepilogo risposte, export CSV sicuro e audit delle esportazioni.
- Aggiunte migrazioni PostgreSQL, backup locale a permessi ristretti e generatore privato di inviti/QR da 256 bit che rifiuta input e output nel repository.
- Aggiunte la pagina privacy provvisoria e le guide per pubblicazione a costo minimo, conservazione, ripristino e lancio.
- Aggiunti il diagramma architetturale completo e la guida operativa in italiano per controllare servizi, comandi, deploy, backup ed emergenze.
- Aggiunta una checklist personale per provare in locale home, responsive, lingue, RSVP fittizio, accesso sposi, dashboard, export e pulizia finale.

### Changed

- Ridisegnata la galleria come un mazzo fotografico circolare: le otto immagini salgono dal basso, si raccolgono e si aprono su traiettorie curve con tempi sfalsati, poi restano vive con un movimento lento e continuo; si aprono al centro con tocco o clic e si sfogliano con swipe, frecce e tastiera, preservando i formati naturali e senza barra inferiore sovrapposta.
- Forzato l'aggiornamento del form RSVP dopo ogni salvataggio, evitando che i controlli React mostrino valori precedenti nonostante Neon contenga già la nuova risposta.
- Rifiutati anche lato server gli invii RSVP identici e allineato il conteggio dei nuclei modificati alle sole persone cambiate nell'ultimo invio.
- Rafforzata la guida Neon con un ruolo runtime creato via SQL, privilegi per colonna, password separate per branch e verifica esplicita dell'assenza di `neon_superuser`.
- Ridisegnato il marchio tartaruga come sigillo editoriale visto dall'alto, coerente tra invito HTML, texture 3D e motivo RSVP.
- Resa statica la home con metadata canonici basati sulla configurazione di produzione; limitato il runtime server alle route RSVP e amministrative.
- Applicate CSP e intestazioni di sicurezza globali, header no-store/noindex sulle route private e 404 di produzione per le superfici interne di revisione.
- Limitata la raccolta RSVP a presenza e menu strutturato, escludendo note sanitarie libere, email e telefono.
- Nascosta temporaneamente dalla home pubblica la lettera finale, inclusa la relativa voce di navigazione; il contenuto resta disponibile nel codice.
- Sostituito il globo di Casa Nuova con un teatrino di carta originale che presenta una scena illustrata della location.
- Ridisegnato l'invito in hero come biglietto di viaggio Milano → Niviano · Casa Nuova, eliminando il motivo della tartaruga e la rotazione 3D.
- Riequilibrata l'intera facciata: sfondo avorio più leggero, architettura attenuata, tipografia della hero più compatta e biglietto senza riquadro esterno.
- Trasformata la hero nella composizione selezionata “Il viaggio in tavola”: il collage di itinerario, invito e cartolina ora è la scena completa, non più un biglietto isolato.
- Inserita nel blocco RSVP un'illustrazione originale in carta con tartaruga e percorso curvo; è decorativa e non associata a dati personali.
- Nascoste temporaneamente dalla home pubblica le quattro fermate della storia; la timeline e i relativi contenuti restano disponibili nel codice per un eventuale ripristino.
- Aggiornato lo stack a Next.js 16, React 19, TypeScript 6 ed ESLint 9 per la compatibilità con Node.js 26; corrette le migrazioni richieste da Next e React.
- Sostituito l’obbligo di review per ogni patch con una review Codex indipendente soltanto per release o modifiche ad alto rischio.
- Reso obbligatorio l’aggiornamento di questo changelog e della documentazione direttamente interessata a ogni consegna.

### Fixed

- Autorizzato l'indirizzo locale `192.168.1.3` per gli asset di sviluppo Next.js, così il test da telefono sulla stessa Wi-Fi carica chunk e HMR senza blocchi cross-origin.
- Rigenerata la build di sviluppo e risolte le incompatibilità che causavano errori di modulo e di tipi nel server locale.
