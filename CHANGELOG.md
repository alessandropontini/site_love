# Changelog

Le modifiche completate vengono annotate qui in modo conciso. Le voci sono raggruppate per attività, non per commit.

## Unreleased

### Added

- Aggiunto il flusso RSVP bilingue per nucleo con token opachi, validazione server-side, persistenza Neon, controllo di concorrenza, rate limit e Cloudflare Turnstile.
- Aggiunta l’area sposi protetta con Clerk e allowlist email, riepilogo risposte, export CSV sicuro e audit delle esportazioni.
- Aggiunte migrazioni PostgreSQL, backup locale a permessi ristretti e generatore privato di inviti/QR da 256 bit che rifiuta input e output nel repository.
- Aggiunte la pagina privacy provvisoria e le guide per pubblicazione a costo minimo, conservazione, ripristino e lancio.
- Aggiunti il diagramma architetturale completo e la guida operativa in italiano per controllare servizi, comandi, deploy, backup ed emergenze.
- Aggiunta una checklist personale per provare in locale home, responsive, lingue, RSVP fittizio, accesso sposi, dashboard, export e pulizia finale.

### Changed

- Ridisegnato il marchio tartaruga come sigillo editoriale visto dall'alto, coerente tra invito HTML, texture 3D e motivo RSVP.
- Resa statica la home con metadata canonici basati sulla configurazione di produzione; limitato il runtime server alle route RSVP e amministrative.
- Applicate CSP e intestazioni di sicurezza globali, header no-store/noindex sulle route private e 404 di produzione per le superfici interne di revisione.
- Limitata la raccolta RSVP a presenza e menu strutturato, escludendo note sanitarie libere, email e telefono.
- Nascosta temporaneamente dalla home pubblica la lettera finale, inclusa la relativa voce di navigazione; il contenuto resta disponibile nel codice.
- Sostituito il globo di Casa Nuova con un teatrino di carta originale che presenta una scena illustrata della location.
- Nascoste temporaneamente dalla home pubblica le quattro fermate della storia; la timeline e i relativi contenuti restano disponibili nel codice per un eventuale ripristino.
- Aggiornato lo stack a Next.js 16, React 19, TypeScript 6 ed ESLint 9 per la compatibilità con Node.js 26; corrette le migrazioni richieste da Next e React.
- Sostituito l’obbligo di review per ogni patch con una review Codex indipendente soltanto per release o modifiche ad alto rischio.
- Reso obbligatorio l’aggiornamento di questo changelog e della documentazione direttamente interessata a ogni consegna.

### Fixed

- Autorizzato l'indirizzo locale `192.168.1.3` per gli asset di sviluppo Next.js, così il test da telefono sulla stessa Wi-Fi carica chunk e HMR senza blocchi cross-origin.
- Rigenerata la build di sviluppo e risolte le incompatibilità che causavano errori di modulo e di tipi nel server locale.
