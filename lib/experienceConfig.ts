export type ChapterId = "spark" | "coordinates" | "promise" | "future";

export type ChapterTone = "dawn" | "day" | "sunset" | "night";

export type JourneyReward = {
  symbol: string;
  title: string;
  description: string;
};

export type ExperienceChapter = {
  id: ChapterId;
  number: string;
  mapLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  location: string;
  instruction: string;
  tone: ChapterTone;
  reward: JourneyReward;
};

export const experienceChapters: ExperienceChapter[] = [
  {
    id: "spark",
    number: "01",
    mapLabel: "La scintilla",
    eyebrow: "Prima fermata",
    title: "Trova la nostra frequenza",
    description:
      "Ogni storia comincia con un segnale quasi invisibile. Avvicinalo, rendilo nitido e lascia apparire il primo frammento.",
    location: "Milano · Prima luce",
    instruction: "Regola la frequenza fino a mettere a fuoco il ricordo.",
    tone: "dawn",
    reward: {
      symbol: "✦",
      title: "La scintilla",
      description: "Il piccolo segnale da cui ha iniziato a illuminarsi tutta la strada."
    }
  },
  {
    id: "coordinates",
    number: "02",
    mapLabel: "Le coordinate",
    eyebrow: "Seconda fermata",
    title: "Ritrova le coordinate",
    description:
      "Ci sono luoghi che smettono di essere semplici indirizzi. Abbina ogni segno alla parola che lo riporta a casa.",
    location: "Milano · Strade condivise",
    instruction: "Scegli un elemento a sinistra e la sua corrispondenza a destra.",
    tone: "day",
    reward: {
      symbol: "⌖",
      title: "Il biglietto",
      description: "Una prova tascabile che ogni distanza può diventare un incontro."
    }
  },
  {
    id: "promise",
    number: "03",
    mapLabel: "Le scelte",
    eyebrow: "Terza fermata",
    title: "Ricomponi le nostre scelte",
    description:
      "Non è una data a tenere insieme una storia, ma i gesti che tornano. Rimetti in ordine le quattro parole del viaggio.",
    location: "Milano · Ora dorata",
    instruction: "Tocca due tessere per scambiarle e ricostruire la sequenza.",
    tone: "sunset",
    reward: {
      symbol: "♡",
      title: "Il frammento di lettera",
      description: "Una frase incompleta che aspetta soltanto l'ultima pagina."
    }
  },
  {
    id: "future",
    number: "04",
    mapLabel: "Le finestre",
    eyebrow: "Ultima fermata",
    title: "Accendi la città",
    description:
      "La sera conserva piccoli segnali dietro ogni vetro. Osserva il loro ritmo e restituisci alla città la stessa luce.",
    location: "Milano · Luci della sera",
    instruction: "Osserva le luci e ripeti ogni sequenza, senza fretta.",
    tone: "night",
    reward: {
      symbol: "▣",
      title: "La luce di casa",
      description: "Una luce lasciata accesa per ricordare che esiste sempre un posto verso cui tornare."
    }
  }
];

export const chapterOrder = experienceChapters.map((chapter) => chapter.id);

export function getExperienceChapter(chapterId: ChapterId) {
  return experienceChapters.find((chapter) => chapter.id === chapterId);
}
