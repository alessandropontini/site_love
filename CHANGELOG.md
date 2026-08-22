# Changelog

Le modifiche completate vengono annotate qui in modo conciso. Le voci sono raggruppate per attività, non per commit.

## Unreleased

### Changed

- Aggiornato lo stack a Next.js 16, React 19, TypeScript 6 ed ESLint 9 per la compatibilità con Node.js 26; corrette le migrazioni richieste da Next e React.
- Sostituito l’obbligo di review per ogni patch con una review Codex indipendente soltanto per release o modifiche ad alto rischio.
- Reso obbligatorio l’aggiornamento di questo changelog e della documentazione direttamente interessata a ogni consegna.

### Fixed

- Rigenerata la build di sviluppo e risolte le incompatibilità che causavano errori di modulo e di tipi nel server locale.
