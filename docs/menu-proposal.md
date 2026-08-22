# Proposta menu piacentino

## Stato

Questa è una bozza editoriale e organizzativa, non un menu concordato. Prima
della pubblicazione definitiva, Casa Nuova Niviano e il catering devono
confermare disponibilità, stagionalità, quantità, ingredienti, allergeni,
alternative e costi. Il sito non deve presentare come DOP un prodotto che il
fornitore non possa effettivamente certificare.

Nel form RSVP ogni portata è cliccabile. La scheda mostra una fotografia
illustrativa originale, una spiegazione e gli ingredienti tipici nella lingua
selezionata (`it` o `en`). La scheda non sostituisce la conferma ufficiale di
ricetta e allergeni da parte del catering.

## Percorso tradizionale

1. Chisolini con Coppa Piacentina DOP, Pancetta Piacentina DOP e Salame
   Piacentino DOP.
2. Tortelli con la coda al burro e salvia.
3. Coppa arrosto con patate al forno.
4. Torta Spisigona.

## Percorso vegetariano

1. Chisolini con formaggi locali e giardiniera.
2. Tortelli con la coda di ricotta, erbette e Grana Padano DOP.
3. Polenta con funghi e verdure di stagione.
4. Torta Spisigona.

Il tortello con la coda tradizionale ha ripieno di ricotta, erbette e formaggio,
quindi è adatto a una proposta vegetariana ma non vegana. Condimenti e
contaminazioni devono comunque essere verificati con il catering.

## Percorso bambini

1. Tortelli con la coda al burro, in porzione piccola.
2. Coppa arrosto con patate al forno.
3. Torta Spisigona.

La composizione bambini mantiene il legame territoriale con porzioni e
presentazione più semplici. Età, quantità e possibili alternative devono essere
concordate con le famiglie e il catering.

## Opzione vegana

Il database conserva una scelta vegana strutturata, ma il sito non promette
ancora portate specifiche. La proposta va definita direttamente con il catering
senza trasformare automaticamente ricette tradizionali contenenti uova,
formaggi, burro, lardo o salumi.

## Fonti territoriali

- [Emilia-Romagna Turismo — Piacenza](https://emiliaromagnaturismo.it/index.php/it/localita/piacenza): salumi, pisarei e fasö, anolini, tortelli con la coda e altre specialità locali.
- [Consorzio Salumi DOP Piacentini](https://www.salumidoppiacentini.it/prodotti/index.jspeldoc?IdC=159&IdS=159&css=generico_dop.css&menu=1&nav=1&tipo_cliccato=0&tipo_padre=0): Coppa Piacentina DOP, Pancetta Piacentina DOP e Salame Piacentino DOP.
- [Visit Piacenza — Tortello con la coda di Vigolzone De.Co.](https://visitpiacenza.it/enogastronomia/tortello-con-la-coda-di-vigolzone-de-co/): ripieno tradizionale e condimento al burro e salvia.
- [Visit Piacenza — Chisolini / Chisulén De.Co.](https://visitpiacenza.it/enogastronomia/chisolini-chisulen/): pasta fritta tradizionalmente accompagnata da salumi e formaggi.
- [Emilia-Romagna Turismo — secondi piatti](https://emiliaromagnaturismo.it/it/food-valley/emilia-romagna-nel-piatto/secondi-piatti): coppa arrosto tra i piatti di Piacenza e provincia.
- [Visit Piacenza — Torta Spisigona De.Co.](https://visitpiacenza.it/enogastronomia/torta-spisigona-de-co/): storia, riconoscimento e ingredienti del dolce.

Le fonti attestano i piatti e i prodotti territoriali; la sequenza da matrimonio
e le varianti sono una proposta originale del progetto.

## Asset e provenienza

Le sei fotografie sotto `public/rsvp/menu/` sono state create il 22 agosto 2026
con lo strumento ImageGen integrato, partendo soltanto da prompt testuali e senza
immagini di riferimento, fotografie personali o materiale di terzi:

1. chisolini dorati con salumi piacentini;
2. chisolini con formaggi e giardiniera;
3. tortelli con la coda al burro e salvia;
4. coppa arrosto con patate al forno;
5. polenta con funghi e verdure di stagione;
6. Torta Spisigona asciutta e friabile, senza ripieno.

Direzione comune dei prompt: fotografia gastronomica editoriale 4:3, tavola da
matrimonio calda e sobria, luce naturale, tovaglia avorio, piatto realistico e
riconoscibile, senza persone, mani, testo, loghi o confezioni. La prima variante
della Spisigona è stata scartata perché sembrava farcita; quella pubblicata è la
correzione asciutta e sbriciolata.

Gli originali PNG da 1448×1086 px sono stati esportati in JPEG qualità 84 e
ripassati con `jpegtran -copy none -optimize`. La verifica dei marker JPEG
mostra soltanto JFIF e dati immagine: nessun blocco EXIF, GPS, Photoshop o altro
metadato applicativo è conservato. I file pesano circa 384–444 KB e sono serviti
localmente tramite `next/image`; non esiste una richiesta verso servizi
fotografici esterni durante la visita.
