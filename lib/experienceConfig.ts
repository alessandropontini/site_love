import type { Locale } from "@/lib/i18n";

export type ChapterId = "spark" | "coordinates" | "promise" | "future";

export type ChapterTone = "dawn" | "day" | "sunset" | "night";

type LocalizedText = Record<Locale, string>;

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

type ExperienceChapterDefinition = {
  id: ChapterId;
  number: string;
  mapLabel: LocalizedText;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  location: LocalizedText;
  instruction: LocalizedText;
  tone: ChapterTone;
  reward: {
    symbol: string;
    title: LocalizedText;
    description: LocalizedText;
  };
};

const chapterDefinitions: ExperienceChapterDefinition[] = [
  {
    id: "spark",
    number: "01",
    mapLabel: { it: "La scintilla", en: "The spark" },
    eyebrow: { it: "Prima fermata", en: "First stop" },
    title: { it: "Trova la nostra frequenza", en: "Find our frequency" },
    description: {
      it: "Ogni storia comincia con un segnale quasi invisibile. Avvicinalo, rendilo nitido e lascia apparire il primo frammento.",
      en: "Every story begins with an almost invisible signal. Bring it closer, tune it clearly, and let the first fragment appear."
    },
    location: { it: "Milano · Prima luce", en: "Milan · First light" },
    instruction: {
      it: "Regola la frequenza fino a mettere a fuoco il ricordo.",
      en: "Adjust the frequency until the memory comes into focus."
    },
    tone: "dawn",
    reward: {
      symbol: "✦",
      title: { it: "La scintilla", en: "The spark" },
      description: {
        it: "Il piccolo segnale da cui ha iniziato a illuminarsi tutta la strada.",
        en: "The small signal that began to illuminate the whole road."
      }
    }
  },
  {
    id: "coordinates",
    number: "02",
    mapLabel: { it: "Le coordinate", en: "The coordinates" },
    eyebrow: { it: "Seconda fermata", en: "Second stop" },
    title: { it: "Ritrova le coordinate", en: "Find the coordinates" },
    description: {
      it: "Ci sono luoghi che smettono di essere semplici indirizzi. Abbina ogni segno alla parola che lo riporta a casa.",
      en: "Some places stop being simple addresses. Match each sign with the word that leads it home."
    },
    location: {
      it: "Milano · Strade condivise",
      en: "Milan · Shared streets"
    },
    instruction: {
      it: "Scegli un elemento a sinistra e la sua corrispondenza a destra.",
      en: "Choose an item on the left and its match on the right."
    },
    tone: "day",
    reward: {
      symbol: "⌖",
      title: { it: "Il biglietto", en: "The ticket" },
      description: {
        it: "Una prova tascabile che ogni distanza può diventare un incontro.",
        en: "A pocket-sized reminder that every distance can become a meeting."
      }
    }
  },
  {
    id: "promise",
    number: "03",
    mapLabel: { it: "Le scelte", en: "The choices" },
    eyebrow: { it: "Terza fermata", en: "Third stop" },
    title: {
      it: "Ricomponi le nostre scelte",
      en: "Rebuild our choices"
    },
    description: {
      it: "Non è una data a tenere insieme una storia, ma i gesti che tornano. Rimetti in ordine le quattro parole del viaggio.",
      en: "A story is held together not by a date, but by the gestures that return. Put the four words of the journey back in order."
    },
    location: { it: "Milano · Ora dorata", en: "Milan · Golden hour" },
    instruction: {
      it: "Tocca due tessere per scambiarle e ricostruire la sequenza.",
      en: "Select two tiles to swap them and rebuild the sequence."
    },
    tone: "sunset",
    reward: {
      symbol: "♡",
      title: {
        it: "Il frammento di lettera",
        en: "The letter fragment"
      },
      description: {
        it: "Una frase incompleta che aspetta soltanto l'ultima pagina.",
        en: "An unfinished sentence waiting only for the final page."
      }
    }
  },
  {
    id: "future",
    number: "04",
    mapLabel: { it: "Adelchi", en: "Adelchi" },
    eyebrow: { it: "Ultima fermata", en: "Final stop" },
    title: {
      it: "Accendi la sera ad Adelchi",
      en: "Light up the evening at Adelchi"
    },
    description: {
      it: "Fuori dal birrificio di via Adelchi, l'ingresso illuminato, l'edera e i lampioni diventano una sequenza da ricordare insieme.",
      en: "Outside the brewery on Via Adelchi, the warm entrance, ivy, and lanterns become a sequence to remember together."
    },
    location: {
      it: "Milano · Via Adelchi 5",
      en: "Milan · 5 Via Adelchi"
    },
    instruction: {
      it: "Osserva i quattro segnali della facciata e ripeti ogni sequenza, senza fretta.",
      en: "Watch the four signals on the facade and repeat each sequence at your own pace."
    },
    tone: "night",
    reward: {
      symbol: "▣",
      title: { it: "La luce di casa", en: "The light of home" },
      description: {
        it: "Una luce lasciata accesa per ricordare che esiste sempre un posto verso cui tornare.",
        en: "A light left on to remember that there is always a place to return to."
      }
    }
  }
];

export const chapterOrder = chapterDefinitions.map((chapter) => chapter.id);

export function getExperienceChapters(locale: Locale): ExperienceChapter[] {
  return chapterDefinitions.map((chapter) => ({
    id: chapter.id,
    number: chapter.number,
    mapLabel: chapter.mapLabel[locale],
    eyebrow: chapter.eyebrow[locale],
    title: chapter.title[locale],
    description: chapter.description[locale],
    location: chapter.location[locale],
    instruction: chapter.instruction[locale],
    tone: chapter.tone,
    reward: {
      symbol: chapter.reward.symbol,
      title: chapter.reward.title[locale],
      description: chapter.reward.description[locale]
    }
  }));
}

export function getExperienceChapter(chapterId: ChapterId, locale: Locale) {
  return getExperienceChapters(locale).find(
    (chapter) => chapter.id === chapterId
  );
}
