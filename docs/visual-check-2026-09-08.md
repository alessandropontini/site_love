# Verifica visiva — 8 settembre 2026

- Progetto: `/Users/alessandropontini/progetti/site_love`.
- Lint, build di produzione con TypeScript e `git diff --check`: superati.
- Browser locale: desktop 1440×1000, telefono 390×844 e 320×568; italiano e inglese.
- Verificati colonna album, apertura delle fotografie 7/8, immagine completa, didascalie e comandi separati, selezione lingua, giardino/portico e stampa RSVP.
- Verificati End → foto 8, Escape → chiusura e ritorno del focus alla foto 8. Nessun overflow orizzontale nei controlli mobile; nessun errore console rilevato nell’ultima verifica.
- In apertura la navbar usa un margine misurato; lo scorrimento viene richiesto dopo l’applicazione del layout aperto. Le transizioni rispettano `prefers-reduced-motion`; non è stato eseguito un test su hardware telefonico reale né un gesto touch fisico.
- Foto personali ed esterni di Casa Nuova: nessun file immagine modificato. RSVP resta informativo; nessuna modifica a dati, token, servizi o route.
- Limite: fotografie reali delle tartarughe non trovate nel repository, nella copia locale alternativa o nei riferimenti sincronizzati (vuoti). Il nuovo vettoriale è uniforme ma la somiglianza individuale resta da verificare. I vecchi raster e la card social restano conservati.
- Guide aggiornate: editorial-home, visual-direction, architecture e CHANGELOG. Nessun’altra guida richiede aggiornamenti per questo intervento.
