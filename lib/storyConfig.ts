export type GameId = "quiz" | "memory" | "puzzle" | "hidden";

export type StoryChapter = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  place: string;
  year: string;
  tone: "sky" | "olive" | "amber" | "rose";
  glyph: string;
  index: string;
  gameId?: GameId;
};

export type QuizQuestion = {
  prompt: string;
  options: string[];
  answer: string;
};

export type MemoryCard = {
  id: string;
  label: string;
  pair: string;
};

export type PuzzleTile = {
  id: string;
  label: string;
  order: number;
};

export type HiddenObject = {
  id: string;
  label: string;
  hint: string;
  x: number;
  y: number;
};

export const gameOrder: GameId[] = ["quiz", "memory", "puzzle", "hidden"];

export const gameLabels: Record<GameId, string> = {
  quiz: "il quiz delle affinità",
  memory: "il memory dei ricordi",
  puzzle: "la sequenza della storia",
  hidden: "gli indizi nascosti"
};

export const storyChapters: StoryChapter[] = [
  {
    id: "intro",
    eyebrow: "Prologo",
    title: "La città si apre come una soglia luminosa",
    body:
      "Tutto comincia da una scelta piccola: seguire la strada. Ogni tappa custodisce un indizio, una prova leggera e un ricordo che apre il capitolo successivo.",
    place: "Milano",
    year: "Inizio",
    tone: "sky",
    glyph: "✦",
    index: "00"
  },
  {
    id: "timeline",
    eyebrow: "Capitolo 01",
    title: "Il primo passo",
    body:
      "La strada non rivela tutto insieme. Leggi la scena, attraversa il momento e lascia che il prossimo frammento arrivi con calma.",
    place: "Prima rotta",
    year: "Inizio",
    tone: "olive",
    glyph: "↗",
    index: "01"
  },
  {
    id: "quiz",
    eyebrow: "Mini-game 01",
    title: "Sintonizzati sulla stessa frequenza",
    body:
      "Tre domande leggere per ritrovare la direzione: non serve essere perfetti, basta riconoscere ciò che rende speciale il viaggio.",
    place: "Prima prova",
    year: "Intesa",
    tone: "amber",
    glyph: "?",
    index: "01",
    gameId: "quiz"
  },
  {
    id: "map",
    eyebrow: "Capitolo 02",
    title: "I ricordi",
    body:
      "Alcuni luoghi non restano sfondo. Diventano coordinate: un cartello, una facciata, una strada che sa già dove riportarti.",
    place: "Rotta Milano",
    year: "Dopo",
    tone: "sky",
    glyph: "⌖",
    index: "02"
  },
  {
    id: "memory",
    eyebrow: "Mini-game 02",
    title: "Abbina i ricordi",
    body:
      "Scopri i frammenti e unisci ogni luogo alla sua emozione. Quando tutte le coppie si ritrovano, la strada riparte.",
    place: "Album condiviso",
    year: "Ricordi",
    tone: "olive",
    glyph: "♡",
    index: "02",
    gameId: "memory"
  },
  {
    id: "emotion",
    eyebrow: "Capitolo 03",
    title: "La promessa",
    body:
      "Tra una prova e l'altra resta una pausa: una cornice più morbida, uno sguardo tenuto, una frase che non ha bisogno di decorazioni.",
    place: "Pausa",
    year: "Sempre",
    tone: "rose",
    glyph: "∞",
    index: "03"
  },
  {
    id: "puzzle",
    eyebrow: "Mini-game 03",
    title: "Ricomponi la storia",
    body:
      "Rimetti in ordine i momenti: incontrarsi, riconoscersi, scegliersi, tornare e promettere. Cinque gesti per dare forma alla storia.",
    place: "Terza prova",
    year: "Insieme",
    tone: "amber",
    glyph: "▦",
    index: "03",
    gameId: "puzzle"
  },
  {
    id: "hidden",
    eyebrow: "Mini-game 04",
    title: "Trova i piccoli indizi",
    body:
      "L'ultima chiave è proprio davanti agli occhi. Trova i quattro oggetti che hanno accompagnato il percorso fino a qui.",
    place: "Ultima prova",
    year: "Adesso",
    tone: "sky",
    glyph: "◇",
    index: "04",
    gameId: "hidden"
  },
  {
    id: "finale",
    eyebrow: "Capitolo 04",
    title: "Il finale",
    body:
      "Quando ogni gioco è completo, la rotta smette di essere una mappa e diventa una promessa: continuare a scegliere la prossima pagina insieme.",
    place: "Finale sbloccato",
    year: "Per sempre",
    tone: "rose",
    glyph: "♥",
    index: "04"
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    prompt: "Che forma ha questa storia?",
    options: ["Una pagina qualunque", "Un viaggio da giocare", "Un solo quiz"],
    answer: "Un viaggio da giocare"
  },
  {
    prompt: "Quale città apre il percorso?",
    options: ["Milano", "Parigi", "Tokyo"],
    answer: "Milano"
  },
  {
    prompt: "Che cosa sblocca il finale?",
    options: ["Scorrere in fretta", "Completare ogni tappa", "Ricaricare la pagina"],
    answer: "Completare ogni tappa"
  }
];

export const memoryCards: MemoryCard[] = [
  { id: "duomo", label: "Duomo", pair: "Milano" },
  { id: "milano", label: "Milano", pair: "Duomo" },
  { id: "letter", label: "Lettera", pair: "Promessa" },
  { id: "promise", label: "Promessa", pair: "Lettera" },
  { id: "route", label: "Strada", pair: "Viaggio" },
  { id: "journey", label: "Viaggio", pair: "Strada" }
];

export const puzzleTiles: PuzzleTile[] = [
  { id: "meet", label: "Incontrarsi", order: 1 },
  { id: "notice", label: "Riconoscersi", order: 2 },
  { id: "choose", label: "Scegliersi", order: 3 },
  { id: "return", label: "Ritornare", order: 4 },
  { id: "promise", label: "Promettere", order: 5 }
];

export const hiddenObjects: HiddenObject[] = [
  {
    id: "sign",
    label: "Cartello Milano",
    hint: "Il nome della città da cui parte la strada.",
    x: 18,
    y: 31
  },
  {
    id: "ticket",
    label: "Biglietto del treno",
    hint: "Una piccola prova che ogni distanza può essere attraversata.",
    x: 72,
    y: 64
  },
  {
    id: "note",
    label: "Biglietto piegato",
    hint: "La frase conservata per il momento giusto.",
    x: 42,
    y: 76
  },
  {
    id: "ring",
    label: "Piccolo anello",
    hint: "L'oggetto più piccolo con il significato più grande.",
    x: 82,
    y: 28
  }
];
