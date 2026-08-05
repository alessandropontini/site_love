export type Locale = "it" | "en";

export const localeStorageKey = "site-love-locale-v1";

const italianTimeZones = new Set([
  "Europe/Rome",
  "Europe/San_Marino",
  "Europe/Vatican"
]);

export function isLocale(value: unknown): value is Locale {
  return value === "it" || value === "en";
}

export function detectLocale(): Locale {
  try {
    const savedLocale = window.localStorage.getItem(localeStorageKey);
    if (isLocale(savedLocale)) return savedLocale;
  } catch {
    // Locale detection continues when browser storage is unavailable.
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (italianTimeZones.has(timeZone)) return "it";
  } catch {
    // Language detection remains available when the time zone is unavailable.
  }

  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return languages.some((language) => language.toLowerCase().startsWith("it"))
    ? "it"
    : "en";
}

export const messages = {
  it: {
    meta: {
      title: "Alessandro & Bridget — La nostra avventura",
      description:
        "Un teatro di cartone da attraversare insieme: quattro atti, piccoli giochi e un finale da sbloccare."
    },
    language: {
      label: "Scegli la lingua",
      italian: "Italiano",
      english: "English"
    },
    common: {
      map: "Indice",
      cancel: "Annulla",
      act: "ATTO"
    },
    shell: {
      skip: "Vai all'esperienza",
      backToInvitation: "Torna all'invito iniziale",
      journeyProgress: "Progresso del viaggio",
      memories: "ricordi",
      reducedMotionSystem:
        "Movimento ridotto attivo nelle impostazioni del dispositivo",
      reducedMotion: "Movimento ridotto",
      invitationKicker: "Una storia da attraversare",
      invitationMarker: "Milano · Quattro fermate",
      invitationLede:
        "Non è una pagina da leggere. È una città da accendere, un ricordo alla volta.",
      loading: "Caricamento del viaggio…",
      continueJourney: "Continua il viaggio",
      enterStory: "Entra nella storia",
      duration: "tappe · circa 6 minuti",
      mapAnnouncement: (count: number, total: number) =>
        `Indice aperto. ${count} ${count === 1 ? "ricordo raccolto" : "ricordi raccolti"} su ${total}.`,
      rewardAnnouncement: "Nuovo ricordo raccolto.",
      finaleAnnouncement: "Finale sbloccato."
    },
    map: {
      kicker: "Il teatro apre il suo libro",
      title: "Indice dei ricordi",
      description:
        "Scegli il capitolo disponibile. Ogni pagina apre una diversa scena di Milano e lascia un oggetto nello zaino prima di voltarsi verso la successiva.",
      complete: "Completata",
      available: "Disponibile",
      locked: "Bloccata",
      lockedDetail: "Completa prima la tappa precedente",
      openFinale: "Apri il finale",
      actions: "Azioni dell'indice",
      location: "Milano, Italia",
      inventory: "Zaino"
    },
    chapter: {
      collectedTitle: "Ricordo già raccolto",
      collectedBody: (reward: string) =>
        `${reward} è al sicuro nello zaino.`,
      replay: "Rivedi la prova",
      backToMap: "Torna all'indice",
      testOnly: "Scorciatoia disponibile solo durante i test locali",
      testComplete: "Completa subito la pagina"
    },
    reward: {
      kicker: "Nuovo ricordo raccolto",
      stop: "Fermata",
      complete: "COMPLETATA",
      continue: "Torna alla città"
    },
    inventory: {
      kicker: "Oggetti del viaggio",
      title: "Lo zaino dei ricordi",
      close: "Chiudi lo zaino",
      hidden: "Ricordo nascosto",
      unlock: (number: string) =>
        `Completa la fermata ${number} per scoprirlo.`,
      saved: "I progressi restano salvati su questo dispositivo.",
      confirmGroup: "Conferma reset",
      confirm: "Vuoi cancellare tutti i ricordi raccolti?",
      confirmAction: "Sì, ricomincia",
      reset: "Ricomincia dall'inizio"
    },
    finale: {
      kicker: "Ultima scena · Piazza del Duomo",
      title: "L'ultima pagina ci porta al Duomo",
      description:
        "Alessandro e Bridget arrivano insieme davanti al Duomo. I quattro ricordi possono finalmente stare nella stessa lettera.",
      collected: "Ricordi raccolti",
      openLetter: "Apri la lettera",
      letterTitle: "La prossima fermata è nostra",
      letterParagraphOne: "Ci sono storie che cercano un finale perfetto.",
      letterParagraphTwo:
        "Questa preferisce continuare: nelle strade ancora da attraversare, nelle cose piccole da ricordare e in tutte le volte in cui sceglieremo di tornare dalla stessa parte.",
      question: "Continuiamo?",
      reviewMap: "Rivedi l'indice",
      restart: "Ricomincia la storia",
      confirmGroup: "Conferma nuovo inizio",
      confirm: "Il progresso verrà cancellato.",
      confirmAction: "Sì, ricomincia"
    },
    frequency: {
      title: "Sintonizza il segnale",
      intro: "Porta l'indicatore nella zona luminosa.",
      imageAlt:
        "Radio analogica di cartone che emerge dal segnale",
      label: "Frequenza del ricordo",
      found: "Segnale trovato",
      ready: "Il segnale è nitido. Puoi raccogliere il primo ricordo.",
      searching:
        "Continua a regolare: la zona giusta è vicina al massimo.",
      collect: "Raccogli la scintilla",
      assist: "Aggancia il segnale"
    },
    coordinates: {
      pairs: [
        { id: "duomo", left: "Duomo", right: "Milano", symbol: "⌂" },
        { id: "tram", left: "Tram", right: "Viaggio", symbol: "▰" },
        { id: "letter", left: "Lettera", right: "Promessa", symbol: "✉" }
      ],
      initial: "Scegli il primo elemento di una coppia.",
      chooseLeft: "Prima scegli un elemento nella colonna di sinistra.",
      mismatch:
        "Queste coordinate non coincidono ancora. Prova un altro abbinamento.",
      complete: "Tutte le coordinate portano nella stessa direzione.",
      matched: "Coordinate trovate. Continua con la coppia successiva.",
      selected: (label: string) =>
        `Ora trova la parola collegata a ${label}.`,
      title: "Collega i segni",
      intro: "Tre coppie, una sola strada.",
      leftLabel: "Elementi da abbinare",
      rightLabel: "Parole corrispondenti",
      collect: "Conserva il biglietto"
    },
    timeline: {
      moments: ["Incontrarsi", "Riconoscersi", "Scegliersi", "Costruire"],
      initial: "Tocca la prima tessera da spostare.",
      selected: (moment: string) =>
        `Hai scelto ${moment}. Ora seleziona la tessera da scambiare.`,
      cancelled: "Selezione annullata.",
      complete: "La sequenza è completa. Ogni scelta ha trovato il suo posto.",
      swapped: "Scambio riuscito. Continua a ricomporre la storia.",
      title: "Metti in ordine i gesti",
      intro: "Non servono date: bastano quattro verbi.",
      boardLabel: "Sequenza dei momenti",
      collect: "Prendi il frammento"
    },
    windows: {
      items: [
        { id: "lamp", label: "Lampione", position: "in alto a sinistra" },
        { id: "plant", label: "Edera", position: "al centro" },
        { id: "curtain", label: "Ingresso", position: "in basso a destra" },
        { id: "balcony", label: "Serranda", position: "in alto a destra" }
      ],
      initial: "Round 1 di 3. Avvia la prima sequenza.",
      reduced: (count: number) =>
        `Movimento ridotto: la sequenza di ${count} segnali resta visibile.`,
      observe:
        "Osserva la sequenza. I segnali saranno disponibili tra poco.",
      repeat: (count: number) =>
        `Ora ripeti ${count} segnali nello stesso ordine. Se ti serve, usa la guida testuale.`,
      retry:
        "Ordine diverso. Nessuna penalità: rivedi la sequenza e riprova.",
      correct: (count: number, total: number) =>
        `Corretto. ${count} ${count === 1 ? "segnale inserito" : "segnali inseriti"} su ${total}.`,
      won: "Tutti i segnali di Adelchi sono accesi. La luce di casa è pronta.",
      roundComplete: (round: number) => `Round ${round} completato.`,
      nextRound: (round: number) =>
        `Round ${round} di 3. Osserva la nuova sequenza.`,
      roundLabel: (round: number) => `Round ${round}`,
      title: "Le luci di Adelchi",
      intro: "Osserva il ritmo della facciata e restituiscile la stessa luce.",
      progress: "Avanzamento della prova",
      stateComplete: "completato",
      stateCurrent: "corrente",
      stateUpcoming: "da completare",
      group: "Quattro segnali sulla facciata di Adelchi",
      lit: "segnale attivo",
      guide: (round: number) => `Sequenza del round ${round}`,
      start: "Accendi la prima sequenza",
      watching: "Guarda le luci del palco…",
      alwaysVisible: "Sequenza sempre visibile",
      hide: "Nascondi la sequenza",
      show: "Mostra la sequenza",
      replayLights: "Rivedi le luci",
      replay: "Rivedi la sequenza",
      continue: "Accendi il round successivo",
      collect: "Raccogli la luce"
    }
  },
  en: {
    meta: {
      title: "Alessandro & Bridget — Our adventure",
      description:
        "A cardboard theatre to explore together: four acts, small games, and a finale to unlock."
    },
    language: {
      label: "Choose language",
      italian: "Italiano",
      english: "English"
    },
    common: {
      map: "Index",
      cancel: "Cancel",
      act: "ACT"
    },
    shell: {
      skip: "Skip to the experience",
      backToInvitation: "Return to the opening invitation",
      journeyProgress: "Journey progress",
      memories: "memories",
      reducedMotionSystem:
        "Reduced motion is enabled in your device settings",
      reducedMotion: "Reduced motion",
      invitationKicker: "A story to step into",
      invitationMarker: "Milan · Four stops",
      invitationLede:
        "This is not a page to read. It is a city to light up, one memory at a time.",
      loading: "Loading the journey…",
      continueJourney: "Continue the journey",
      enterStory: "Enter the story",
      duration: "stops · about 6 minutes",
      mapAnnouncement: (count: number, total: number) =>
        `Index open. ${count} ${count === 1 ? "memory collected" : "memories collected"} out of ${total}.`,
      rewardAnnouncement: "New memory collected.",
      finaleAnnouncement: "Finale unlocked."
    },
    map: {
      kicker: "The theatre opens its book",
      title: "Index of memories",
      description:
        "Choose the available chapter. Each page opens onto a different Milan scene and leaves an object in your bag before turning to the next.",
      complete: "Complete",
      available: "Available",
      locked: "Locked",
      lockedDetail: "Complete the previous stop first",
      openFinale: "Open the finale",
      actions: "Index actions",
      location: "Milan, Italy",
      inventory: "Bag"
    },
    chapter: {
      collectedTitle: "Memory already collected",
      collectedBody: (reward: string) =>
        `${reward} is safe in your bag.`,
      replay: "Replay the challenge",
      backToMap: "Return to the index",
      testOnly: "Shortcut available only during local testing",
      testComplete: "Complete this page now"
    },
    reward: {
      kicker: "New memory collected",
      stop: "Stop",
      complete: "COMPLETE",
      continue: "Return to the city"
    },
    inventory: {
      kicker: "Objects from the journey",
      title: "The memory bag",
      close: "Close the bag",
      hidden: "Hidden memory",
      unlock: (number: string) =>
        `Complete stop ${number} to reveal it.`,
      saved: "Progress is saved on this device.",
      confirmGroup: "Confirm reset",
      confirm: "Delete every memory you have collected?",
      confirmAction: "Yes, start over",
      reset: "Start again"
    },
    finale: {
      kicker: "Final scene · Piazza del Duomo",
      title: "The last page takes us to the Duomo",
      description:
        "Alessandro and Bridget arrive together in front of the Duomo. The four memories can finally share the same letter.",
      collected: "Collected memories",
      openLetter: "Open the letter",
      letterTitle: "The next stop is ours",
      letterParagraphOne: "Some stories look for a perfect ending.",
      letterParagraphTwo:
        "This one would rather continue: through the streets still ahead, the small things worth remembering, and every time we choose to return to the same side.",
      question: "Shall we continue?",
      reviewMap: "Review the index",
      restart: "Restart the story",
      confirmGroup: "Confirm restart",
      confirm: "Your progress will be deleted.",
      confirmAction: "Yes, start over"
    },
    frequency: {
      title: "Tune the signal",
      intro: "Move the indicator into the illuminated area.",
      imageAlt:
        "Cardboard analog radio emerging from the signal",
      label: "Memory frequency",
      found: "Signal found",
      ready: "The signal is clear. You can collect the first memory.",
      searching: "Keep tuning: the right area is close to the maximum.",
      collect: "Collect the spark",
      assist: "Lock onto the signal"
    },
    coordinates: {
      pairs: [
        { id: "duomo", left: "Cathedral", right: "Milan", symbol: "⌂" },
        { id: "tram", left: "Tram", right: "Journey", symbol: "▰" },
        { id: "letter", left: "Letter", right: "Promise", symbol: "✉" }
      ],
      initial: "Choose the first item in a pair.",
      chooseLeft: "Choose an item in the left column first.",
      mismatch: "These coordinates do not match yet. Try another pairing.",
      complete: "Every coordinate points in the same direction.",
      matched: "Coordinates found. Continue with the next pair.",
      selected: (label: string) =>
        `Now find the word connected to ${label}.`,
      title: "Connect the signs",
      intro: "Three pairs, one road.",
      leftLabel: "Items to match",
      rightLabel: "Matching words",
      collect: "Keep the ticket"
    },
    timeline: {
      moments: ["Meeting", "Recognising", "Choosing", "Building"],
      initial: "Select the first tile you want to move.",
      selected: (moment: string) =>
        `You selected ${moment}. Now choose the tile to swap.`,
      cancelled: "Selection cancelled.",
      complete: "The sequence is complete. Every choice has found its place.",
      swapped: "Swap complete. Keep rebuilding the story.",
      title: "Put the gestures in order",
      intro: "Dates are not needed: four verbs are enough.",
      boardLabel: "Sequence of moments",
      collect: "Collect the fragment"
    },
    windows: {
      items: [
        { id: "lamp", label: "Lantern", position: "top left" },
        { id: "plant", label: "Ivy", position: "centre" },
        { id: "curtain", label: "Doorway", position: "bottom right" },
        { id: "balcony", label: "Shutter", position: "top right" }
      ],
      initial: "Round 1 of 3. Start the first sequence.",
      reduced: (count: number) =>
        `Reduced motion: the ${count}-signal sequence remains visible.`,
      observe: "Watch the sequence. The signals will be available shortly.",
      repeat: (count: number) =>
        `Now repeat ${count} signals in the same order. Use the text guide if needed.`,
      retry: "Different order. No penalty: review the sequence and try again.",
      correct: (count: number, total: number) =>
        `Correct. ${count} ${count === 1 ? "signal entered" : "signals entered"} out of ${total}.`,
      won: "Every signal at Adelchi is lit. The light of home is ready.",
      roundComplete: (round: number) => `Round ${round} complete.`,
      nextRound: (round: number) =>
        `Round ${round} of 3. Watch the new sequence.`,
      roundLabel: (round: number) => `Round ${round}`,
      title: "The lights of Adelchi",
      intro: "Watch the rhythm of the facade and return the same light.",
      progress: "Challenge progress",
      stateComplete: "complete",
      stateCurrent: "current",
      stateUpcoming: "upcoming",
      group: "Four signals on the Adelchi facade",
      lit: "signal active",
      guide: (round: number) => `Round ${round} sequence`,
      start: "Light the first sequence",
      watching: "Watch the stage lights…",
      alwaysVisible: "Sequence always visible",
      hide: "Hide the sequence",
      show: "Show the sequence",
      replayLights: "Replay the lights",
      replay: "Replay the sequence",
      continue: "Light the next round",
      collect: "Collect the light"
    }
  }
} as const;

export function getMessages(locale: Locale) {
  return messages[locale];
}
