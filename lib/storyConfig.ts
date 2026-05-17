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
    eyebrow: "Prologue",
    title: "A city opens like a quiet game cartridge",
    body:
      "Begin with one small decision: follow the route. The story moves through places, clues, and tiny tests that unlock the next chapter.",
    place: "Milano",
    year: "Start",
    tone: "sky"
  },
  {
    id: "timeline",
    eyebrow: "Chapter 01",
    title: "The timeline starts moving",
    body:
      "Each stop keeps a memory, but nothing is handed over at once. Read the scene, play the moment, and let the next section come into view.",
    place: "First route",
    year: "Then",
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
    eyebrow: "Chapter 02",
    title: "A map of places that kept showing up",
    body:
      "Some cities are not just backgrounds. They become coordinates: a sign, a facade, a path home, a place you can recognize before anyone names it.",
    place: "Milano route",
    year: "After",
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
    eyebrow: "Chapter 03",
    title: "The quiet sentence in the middle",
    body:
      "Between the games there is a pause: a softer frame, a held look, a sentence that does not need decoration to matter.",
    place: "Pause",
    year: "Always",
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
    eyebrow: "Finale",
    title: "The reveal waits until every chapter is earned",
    body:
      "When every game is complete, the route stops being a map and becomes a promise: keep choosing the next page together.",
    place: "Unlocked ending",
    year: "Forever",
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
