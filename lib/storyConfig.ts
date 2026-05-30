export type GameId = "quiz" | "memory" | "puzzle" | "hidden";

export type StoryChapter = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  place: string;
  year: string;
  tone: "sky" | "olive" | "amber" | "rose";
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
  quiz: "Signal quiz",
  memory: "Memory pairs",
  puzzle: "Picture sequence",
  hidden: "Hidden clues"
};

export const storyChapters: StoryChapter[] = [
  {
    id: "intro",
    eyebrow: "Prologo",
    title: "La citta si apre come una soglia luminosa",
    body:
      "Tutto comincia da una scelta piccola: seguire la strada. Ogni tappa custodisce un indizio, una prova leggera e un ricordo che apre il capitolo successivo.",
    place: "Milano",
    year: "Start",
    tone: "sky"
  },
  {
    id: "timeline",
    eyebrow: "Capitolo 01",
    title: "Il primo passo",
    body:
      "La strada non rivela tutto insieme. Leggi la scena, attraversa il momento e lascia che il prossimo frammento arrivi con calma.",
    place: "Prima rotta",
    year: "Inizio",
    tone: "olive"
  },
  {
    id: "quiz",
    eyebrow: "Mini-game 01",
    title: "Personal signal check",
    body:
      "A short quiz opens the route. It is not about being perfect; it is about noticing the little details that make the story feel like yours.",
    place: "Coffee table",
    year: "Memory",
    tone: "amber",
    gameId: "quiz"
  },
  {
    id: "map",
    eyebrow: "Capitolo 02",
    title: "I ricordi",
    body:
      "Alcuni luoghi non restano sfondo. Diventano coordinate: un cartello, una facciata, una strada che sa gia dove riportarti.",
    place: "Rotta Milano",
    year: "Dopo",
    tone: "sky"
  },
  {
    id: "memory",
    eyebrow: "Mini-game 02",
    title: "Match the memory pairs",
    body:
      "Turn over the fragments and pair each place with the feeling it kept. The route unlocks when every match is found.",
    place: "Shared archive",
    year: "Collected",
    tone: "olive",
    gameId: "memory"
  },
  {
    id: "emotion",
    eyebrow: "Capitolo 03",
    title: "La promessa",
    body:
      "Tra una prova e l'altra resta una pausa: una cornice piu morbida, uno sguardo tenuto, una frase che non ha bisogno di decorazioni.",
    place: "Pausa",
    year: "Sempre",
    tone: "rose"
  },
  {
    id: "puzzle",
    eyebrow: "Mini-game 03",
    title: "Rebuild the picture",
    body:
      "Arrange the visual beats in order: meeting, choosing, returning, promising. A simple puzzle for the shape of the whole story.",
    place: "Tabletop",
    year: "Sequence",
    tone: "amber",
    gameId: "puzzle"
  },
  {
    id: "hidden",
    eyebrow: "Mini-game 04",
    title: "Find the small clues",
    body:
      "The last lock is hidden in plain sight. Find the objects that carried the story from one chapter to the next.",
    place: "Final scene",
    year: "Now",
    tone: "sky",
    gameId: "hidden"
  },
  {
    id: "finale",
    eyebrow: "Capitolo 04",
    title: "Il finale",
    body:
      "Quando ogni gioco e completo, la rotta smette di essere una mappa e diventa una promessa: continuare a scegliere la prossima pagina insieme.",
    place: "Finale sbloccato",
    year: "Per sempre",
    tone: "rose"
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    prompt: "What should this story feel like?",
    options: ["A classic wedding page", "A playable journey", "A single quiz"],
    answer: "A playable journey"
  },
  {
    prompt: "Which city sign anchors the route?",
    options: ["Milano", "Paris", "Tokyo"],
    answer: "Milano"
  },
  {
    prompt: "What unlocks the finale?",
    options: ["Scrolling fast", "Completing each game", "Refreshing the page"],
    answer: "Completing each game"
  }
];

export const memoryCards: MemoryCard[] = [
  { id: "duomo", label: "Duomo", pair: "Milano" },
  { id: "milano", label: "Milano", pair: "Duomo" },
  { id: "letter", label: "Letter", pair: "Promise" },
  { id: "promise", label: "Promise", pair: "Letter" },
  { id: "route", label: "Route", pair: "Journey" },
  { id: "journey", label: "Journey", pair: "Route" }
];

export const puzzleTiles: PuzzleTile[] = [
  { id: "meet", label: "Meet", order: 1 },
  { id: "notice", label: "Notice", order: 2 },
  { id: "choose", label: "Choose", order: 3 },
  { id: "return", label: "Return", order: 4 },
  { id: "promise", label: "Promise", order: 5 }
];

export const hiddenObjects: HiddenObject[] = [
  {
    id: "sign",
    label: "Milano sign",
    hint: "The city name that starts the route.",
    x: 18,
    y: 31
  },
  {
    id: "ticket",
    label: "Train ticket",
    hint: "A small proof that distance can be crossed.",
    x: 72,
    y: 64
  },
  {
    id: "note",
    label: "Folded note",
    hint: "The sentence saved for later.",
    x: 42,
    y: 76
  },
  {
    id: "ring",
    label: "Tiny ring",
    hint: "The smallest object with the biggest meaning.",
    x: 82,
    y: 28
  }
];
