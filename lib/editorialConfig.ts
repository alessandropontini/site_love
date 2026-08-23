export const TODO_CONTENT = "TODO_CONTENT";

export type EditorialLocale = "it" | "en";
export type EditorialStoryId = "spark" | "coordinates" | "promise" | "future";
type EditorialStoryTone = "dawn" | "day" | "sunset" | "night";

export const editorialSectionIds = {
  story: "story",
  photos: "photos",
  venue: "venue",
  rsvp: "rsvp",
  letter: "letter"
} as const;

export const editorialElementIds = {
  storyIntro: "story-intro",
  timeline: "story-timeline"
} as const;

export type EditorialSectionId =
  (typeof editorialSectionIds)[keyof typeof editorialSectionIds];

type EditorialNavigationItem = {
  id: EditorialSectionId;
  label: string;
  shortLabel: string;
};

type EditorialImage = {
  src: string;
  width: number;
  height: number;
};

export type TimelineItem = {
  id: EditorialStoryId;
  number: string;
  period: string;
  title: string;
  description: string;
  location: string;
  tone: EditorialStoryTone;
  image: EditorialImage;
  imageAlt: string;
};

export type GalleryItem = {
  id: string;
  aspect: "portrait" | "landscape" | "square";
  tone: "blush" | "cream" | "olive" | "taupe";
  placeholder: string;
  caption: string;
  src?: string;
  alt?: string;
  position?: string;
};

export type EditorialContent = {
  metadata: {
    title: string;
    description: string;
    ogAlt: string;
  };
  accessibility: {
    skip: string;
    navigation: string;
    mobileNavigation: string;
    footerNavigation: string;
    currentSection: string;
  };
  language: {
    label: string;
    italian: string;
    english: string;
  };
  navigation: {
    brand: string;
    rsvp: string;
    items: EditorialNavigationItem[];
  };
  hero: {
    kicker: string;
    title: string;
    italicTitle: string;
    lede: string;
    place: string;
    date: string;
    primaryAction: string;
    secondaryAction: string;
    invitationLabel: string;
    invitationHint: string;
    invitationLoading: string;
    invitationUnavailable: string;
    invitationFrontAction: string;
    invitationBackAction: string;
    invitationFrontStatus: string;
    invitationBackStatus: string;
    invitationKeyboardHint: string;
    front: {
      eyebrow: string;
      title: string;
      footnote: string;
    };
    back: {
      eyebrow: string;
      title: string;
      body: string;
      footnote: string;
    };
  };
  timeline: {
    kicker: string;
    title: string;
    intro: string;
    items: TimelineItem[];
  };
  gallery: {
    kicker: string;
    title: string;
    intro: string;
    note: string;
    browseHint: string;
    previousLabel: string;
    nextLabel: string;
    closeLabel: string;
    items: GalleryItem[];
  };
  venue: {
    kicker: string;
    title: string;
    intro: string;
    name: string;
    date: string;
    address: string;
    description: string;
    facts: string[];
    websiteLabel: string;
    galleryLabel: string;
    mapLabel: string;
    websiteUrl: string;
    galleryUrl: string;
    mapUrl: string;
  };
  rsvp: {
    kicker: string;
    title: string;
    intro: string;
    statusLabel: string;
    status: string;
    householdTitle: string;
    householdBody: string;
    steps: string[];
    note: string;
  };
  letter: {
    kicker: string;
    title: string;
    intro: string;
    open: string;
    close: string;
    dialogLabel: string;
    letterTitle: string;
    paragraphs: string[];
    question: string;
    envelopeFront: string;
    envelopeBack: string;
  };
  footer: {
    names: string;
    place: string;
    date: string;
    rsvpLabel: string;
    colophonLabel: string;
    colophonTitle: string;
    colophonBody: string;
    colophonDetail: string;
    close: string;
    languageLabel: string;
    note: string;
    decorative: string;
  };
};

const chapterImages: Record<EditorialStoryId, EditorialImage> = {
  spark: {
    src: "/scene/paper-theatre/scene-entrance-galleria-v6.jpg",
    width: 1600,
    height: 900
  },
  coordinates: {
    src: "/scene/paper-theatre/scene-chapter-naviglio.jpg",
    width: 1440,
    height: 800
  },
  promise: {
    src: "/scene/paper-theatre/scene-chapter-arco.jpg",
    width: 1440,
    height: 800
  },
  future: {
    src: "/scene/paper-theatre/scene-chapter-adelchi.jpg",
    width: 1440,
    height: 800
  }
};

const baseContent: Record<EditorialLocale, EditorialContent> = {
  it: {
    metadata: {
      title: "Alessandro & Bridget — 13 maggio 2028",
      description:
        "La nostra storia e le informazioni per il matrimonio a Casa Nuova, Niviano di Rivergaro.",
      ogAlt: "Alessandro e Bridget — 13 maggio 2028"
    },
    accessibility: {
      skip: "Vai al racconto",
      navigation: "Navigazione principale",
      mobileNavigation: "Navigazione delle sezioni",
      footerNavigation: "Navigazione a piè di pagina",
      currentSection: "Sezione corrente"
    },
    language: {
      label: "Scegli la lingua",
      italian: "Italiano",
      english: "English"
    },
    navigation: {
      brand: "Alessandro & Bridget",
      rsvp: "RSVP",
      items: [
        { id: editorialSectionIds.story, label: "Storia", shortLabel: "Storia" },
        { id: editorialSectionIds.photos, label: "Foto", shortLabel: "Foto" },
        { id: editorialSectionIds.venue, label: "Dove", shortLabel: "Dove" },
        { id: editorialSectionIds.rsvp, label: "RSVP", shortLabel: "RSVP" }
      ]
    },
    hero: {
      kicker: "Casa Nuova · 13 maggio 2028",
      title: "La nostra",
      italicTitle: "avventura",
      lede:
        "La nostra storia attraversa Milano e ci accompagna verso il giorno in cui ci diremo sì.",
      place: "Casa Nuova · Niviano",
      date: "13 maggio 2028",
      primaryAction: "Scorri la storia",
      secondaryAction: "Vai all’RSVP",
      invitationLabel: "Invito di Alessandro e Bridget",
      invitationHint: "Trascina o usa i pulsanti per girare l’invito",
      invitationLoading: "L’invito 3D si sta preparando",
      invitationUnavailable: "Versione illustrata dell’invito",
      invitationFrontAction: "Mostra il fronte",
      invitationBackAction: "Mostra il retro",
      invitationFrontStatus: "Fronte dell’invito visibile",
      invitationBackStatus: "Retro dell’invito visibile",
      invitationKeyboardHint: "Usa freccia sinistra o destra per girarlo",
      front: {
        eyebrow: "La nostra avventura",
        title: "A & B",
        footnote: "Casa Nuova · Niviano"
      },
      back: {
        eyebrow: "Ci sposiamo",
        title: "Alessandro & Bridget",
        body: "La nostra storia ci porta a Casa Nuova. Il prossimo capitolo lo festeggiamo insieme.",
        footnote: "Continua a scorrere"
      }
    },
    timeline: {
      kicker: "La nostra avventura",
      title: "Quattro fermate, raccontate senza fretta",
      intro:
        "Quattro luoghi di Milano, quattro frammenti della strada che ci ha portati fin qui.",
      items: [
        {
          id: "spark",
          number: "01",
          period: "Prima fermata",
          title: "Trova la nostra frequenza",
          description:
            "Ogni storia comincia con un segnale quasi invisibile. Avvicinalo, rendilo nitido e lascia apparire il primo frammento.",
          location: "Milano · Prima luce",
          tone: "dawn",
          image: chapterImages.spark,
          imageAlt: "Scena di carta della Galleria nella prima luce"
        },
        {
          id: "coordinates",
          number: "02",
          period: "Seconda fermata",
          title: "Ritrova le coordinate",
          description:
            "Ci sono luoghi che smettono di essere semplici indirizzi. Abbina ogni segno alla parola che lo riporta a casa.",
          location: "Milano · Strade condivise",
          tone: "day",
          image: chapterImages.coordinates,
          imageAlt: "Scena di carta del Naviglio Grande"
        },
        {
          id: "promise",
          number: "03",
          period: "Terza fermata",
          title: "Ricomponi le nostre scelte",
          description:
            "Non è una data a tenere insieme una storia, ma i gesti che tornano. Rimetti in ordine le quattro parole del viaggio.",
          location: "Milano · Ora dorata",
          tone: "sunset",
          image: chapterImages.promise,
          imageAlt: "Scena di carta dell’Arco della Pace nell’ora dorata"
        },
        {
          id: "future",
          number: "04",
          period: "Ultima fermata",
          title: "Accendi la sera ad Adelchi",
          description:
            "Fuori dal birrificio di via Adelchi, l'ingresso illuminato, l'edera e i lampioni diventano una sequenza da ricordare insieme.",
          location: "Milano · Via Adelchi 5",
          tone: "night",
          image: chapterImages.future,
          imageAlt: "Scena di carta dell’esterno serale di Adelchi"
        }
      ]
    },
    gallery: {
      kicker: "Il nostro album",
      title: "Momenti che ci somigliano",
      intro:
        "Otto frammenti scelti tra viaggi, giornate semplici, arte e risate condivise.",
      note:
        "Fotografie personali ottimizzate per il sito, senza dati di posizione incorporati.",
      browseHint: "Tocca una fotografia per aprire l’album",
      previousLabel: "Precedente",
      nextLabel: "Successiva",
      closeLabel: "Torna al mazzo",
      items: [
        { id: "photo-01", aspect: "portrait", tone: "cream", placeholder: "Noi in giardino", caption: "Noi, in una giornata elegante", src: "/photos/editorial/photo-01.jpg", alt: "Alessandro e Bridget in abiti eleganti in un giardino, con ortensie alle spalle.", position: "55% 55%" },
        { id: "photo-02", aspect: "landscape", tone: "olive", placeholder: "Noi al mare", caption: "Una giornata al mare", src: "/photos/editorial/photo-02.jpg", alt: "Alessandro e Bridget sorridono con gli occhiali da sole su una spiaggia; Alessandro alza una mano verso l’obiettivo.", position: "50% 55%" },
        { id: "photo-03", aspect: "landscape", tone: "taupe", placeholder: "Noi vicini", caption: "Sempre più vicini", src: "/photos/editorial/photo-03.jpg", alt: "Alessandro e Bridget sorridono vicini in un selfie al chiuso.", position: "72% 54%" },
        { id: "photo-04", aspect: "landscape", tone: "blush", placeholder: "Bridget e l’arte", caption: "Tra le cose che ci incuriosiscono", src: "/photos/editorial/photo-04.jpg", alt: "Bridget posa accanto a un dipinto incorniciato in una galleria.", position: "35% 58%" },
        { id: "photo-05", aspect: "portrait", tone: "cream", placeholder: "Dentro una cornice", caption: "Dentro una cornice rosa", src: "/photos/editorial/photo-05.jpg", alt: "Alessandro e Bridget si fotografano in uno specchio dalla cornice rosa ondulata.", position: "50% 55%" },
        { id: "photo-06", aspect: "portrait", tone: "olive", placeholder: "Una risata", caption: "Una risata da tenere", src: "/photos/editorial/photo-06.jpg", alt: "Alessandro e Bridget ridono insieme in giardino, vestiti per un’occasione.", position: "50% 75%" },
        { id: "photo-07", aspect: "portrait", tone: "taupe", placeholder: "Una passeggiata", caption: "Una passeggiata in buona compagnia", src: "/photos/editorial/photo-07.jpg", alt: "Bridget porta al guinzaglio un cane bianco e nero lungo una strada alberata.", position: "72% 72%" },
        { id: "photo-08", aspect: "landscape", tone: "blush", placeholder: "Bridget e un’opera", caption: "Nuove immagini da scoprire", src: "/photos/editorial/photo-08.jpg", alt: "Bridget posa accanto a una grande opera murale.", position: "78% 50%" }
      ]
    },
    venue: {
      kicker: "Il matrimonio",
      title: "Ci vediamo a Casa Nuova",
      intro:
        "Ci sposeremo tra la campagna piacentina e le colline della Val Trebbia, in un luogo raccolto e circondato dal verde.",
      name: "Casa Nuova",
      date: "13 maggio 2028",
      address: "Via Casa Nuova 31 · 29029 Niviano di Rivergaro (PC)",
      description:
        "Festeggeremo tra il giardino, il grande portico e le sale interne. La struttura dispone anche di sei alloggi matrimoniali indipendenti; disponibilità e assegnazioni verranno comunicate più avanti.",
      facts: [
        "Campagna piacentina, ai piedi delle colline della Val Trebbia",
        "Giardino, grande portico e sale interne",
        "Sei alloggi matrimoniali indipendenti nella struttura"
      ],
      websiteLabel: "Sito ufficiale",
      galleryLabel: "Guarda la galleria ufficiale",
      mapLabel: "Apri la mappa",
      websiteUrl: "https://www.casanuovaniviano.com/",
      galleryUrl: "https://www.casanuovaniviano.com/ricevimenti/",
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Casa+Nuova+Via+Casa+Nuova+31+29029+Niviano+di+Rivergaro+PC"
    },
    rsvp: {
      kicker: "Conferma la tua presenza",
      title: "Un invito, un QR personale",
      intro:
        "Ogni nucleo di invitati riceverà un QR personale per confermare chi sarà con noi il 13 maggio.",
      statusLabel: "Stato RSVP",
      status: "In preparazione",
      householdTitle: "Pensato per il vostro nucleo",
      householdBody:
        "Il QR aprirà una pagina privata con i nomi del vostro invito. Da lì potrete confermare le presenze e aggiornare la risposta entro la scadenza.",
      steps: [
        "Ricevete il vostro QR personale",
        "Aprite l’invito riservato al vostro nucleo",
        "Confermate o aggiornate la risposta"
      ],
      note:
        "Genereremo i QR solo dopo aver definito dominio, lista degli invitati e gestione sicura delle risposte. Per ora nessun dato viene raccolto."
    },
    letter: {
      kicker: "La lettera",
      title: "Una lettera, senza prove da superare",
      intro:
        "Questa pagina resta aperta a tutti, come il racconto che ci ha portati fin qui.",
      open: "Apri la lettera",
      close: "Chiudi la lettera",
      dialogLabel: "Lettera finale di Alessandro e Bridget",
      letterTitle: "La prossima fermata è nostra",
      paragraphs: [
        "Ci sono storie che cercano un finale perfetto.",
        "Questa preferisce continuare: nelle strade ancora da attraversare, nelle cose piccole da ricordare e in tutte le volte in cui sceglieremo di tornare dalla stessa parte."
      ],
      question: "Continuiamo?",
      envelopeFront: "Per noi, da aprire insieme",
      envelopeBack: "A & B · Casa Nuova"
    },
    footer: {
      names: "Alessandro & Bridget",
      place: "Casa Nuova · Niviano",
      date: "13 maggio 2028",
      rsvpLabel: "Vai all’RSVP",
      colophonLabel: "Apri il colophon",
      colophonTitle: "Colophon",
      colophonBody:
        "Un racconto digitale costruito con tipografia editoriale, scene illustrate, fotografie personali e un invito 3D leggero.",
      colophonDetail:
        "Instrument Sans per l’interfaccia, Newsreader per la voce editoriale. Nessun servizio esterno è necessario durante la visita.",
      close: "Chiudi il colophon",
      languageLabel: "Lingua del sito",
      note: "Fatto con cura, carta digitale e una tartaruga d’acqua.",
      decorative: "A & B"
    }
  },
  en: {
    metadata: {
      title: "Alessandro & Bridget — 13 May 2028",
      description:
        "Our story and wedding information for Casa Nuova in Niviano di Rivergaro.",
      ogAlt: "Alessandro and Bridget — 13 May 2028"
    },
    accessibility: {
      skip: "Skip to the story",
      navigation: "Main navigation",
      mobileNavigation: "Section navigation",
      footerNavigation: "Footer navigation",
      currentSection: "Current section"
    },
    language: {
      label: "Choose language",
      italian: "Italiano",
      english: "English"
    },
    navigation: {
      brand: "Alessandro & Bridget",
      rsvp: "RSVP",
      items: [
        { id: editorialSectionIds.story, label: "Story", shortLabel: "Story" },
        { id: editorialSectionIds.photos, label: "Photos", shortLabel: "Photos" },
        { id: editorialSectionIds.venue, label: "Venue", shortLabel: "Venue" },
        { id: editorialSectionIds.rsvp, label: "RSVP", shortLabel: "RSVP" }
      ]
    },
    hero: {
      kicker: "Casa Nuova · 13 May 2028",
      title: "Our",
      italicTitle: "adventure",
      lede:
        "Our story crosses Milan and carries us toward the day we say yes.",
      place: "Casa Nuova · Niviano",
      date: "13 May 2028",
      primaryAction: "Read our story",
      secondaryAction: "Go to RSVP",
      invitationLabel: "Alessandro and Bridget’s invitation",
      invitationHint: "Drag or use the buttons to turn the invitation",
      invitationLoading: "The 3D invitation is getting ready",
      invitationUnavailable: "Illustrated version of the invitation",
      invitationFrontAction: "Show the front",
      invitationBackAction: "Show the back",
      invitationFrontStatus: "Front of the invitation is visible",
      invitationBackStatus: "Back of the invitation is visible",
      invitationKeyboardHint: "Use the left or right arrow to turn it",
      front: {
        eyebrow: "Our adventure",
        title: "A & B",
        footnote: "Casa Nuova · Niviano"
      },
      back: {
        eyebrow: "We’re getting married",
        title: "Alessandro & Bridget",
        body: "Our story leads us to Casa Nuova. We would love to celebrate the next chapter with you.",
        footnote: "Keep scrolling"
      }
    },
    timeline: {
      kicker: "Our adventure",
      title: "Four stops, told without rushing",
      intro:
        "Four places in Milan, four fragments of the road that brought us here.",
      items: [
        {
          id: "spark",
          number: "01",
          period: "First stop",
          title: "Find our frequency",
          description:
            "Every story begins with an almost invisible signal. Bring it closer, tune it clearly, and let the first fragment appear.",
          location: "Milan · First light",
          tone: "dawn",
          image: chapterImages.spark,
          imageAlt: "Paper scene of the Galleria in the first light"
        },
        {
          id: "coordinates",
          number: "02",
          period: "Second stop",
          title: "Find the coordinates",
          description:
            "Some places stop being simple addresses. Match each sign with the word that leads it home.",
          location: "Milan · Shared streets",
          tone: "day",
          image: chapterImages.coordinates,
          imageAlt: "Paper scene of Naviglio Grande"
        },
        {
          id: "promise",
          number: "03",
          period: "Third stop",
          title: "Rebuild our choices",
          description:
            "A story is held together not by a date, but by the gestures that return. Put the four words of the journey back in order.",
          location: "Milan · Golden hour",
          tone: "sunset",
          image: chapterImages.promise,
          imageAlt: "Paper scene of Arco della Pace at golden hour"
        },
        {
          id: "future",
          number: "04",
          period: "Final stop",
          title: "Light up the evening at Adelchi",
          description:
            "Outside the brewery on Via Adelchi, the warm entrance, ivy, and lanterns become a sequence to remember together.",
          location: "Milan · 5 Via Adelchi",
          tone: "night",
          image: chapterImages.future,
          imageAlt: "Paper scene of Adelchi in the evening"
        }
      ]
    },
    gallery: {
      kicker: "Our album",
      title: "Moments that feel like us",
      intro:
        "Eight glimpses of travels, ordinary days, art, and laughter shared along the way.",
      note:
        "Personal photographs optimized for the site, with embedded location data removed.",
      browseHint: "Tap a photograph to open the album",
      previousLabel: "Previous",
      nextLabel: "Next",
      closeLabel: "Return to the stack",
      items: [
        { id: "photo-01", aspect: "portrait", tone: "cream", placeholder: "Us in a garden", caption: "The two of us, dressed for the day", src: "/photos/editorial/photo-01.jpg", alt: "Alessandro and Bridget dressed for an occasion in a garden, with hydrangeas behind them.", position: "55% 55%" },
        { id: "photo-02", aspect: "landscape", tone: "olive", placeholder: "Us by the sea", caption: "A day by the sea", src: "/photos/editorial/photo-02.jpg", alt: "Alessandro and Bridget smile in sunglasses on a beach as Alessandro raises a hand toward the camera.", position: "50% 55%" },
        { id: "photo-03", aspect: "landscape", tone: "taupe", placeholder: "Close together", caption: "Always a little closer", src: "/photos/editorial/photo-03.jpg", alt: "Alessandro and Bridget smile close together in an indoor selfie.", position: "72% 54%" },
        { id: "photo-04", aspect: "landscape", tone: "blush", placeholder: "Bridget and art", caption: "Among the things that make us curious", src: "/photos/editorial/photo-04.jpg", alt: "Bridget poses beside a framed painting in a gallery.", position: "35% 58%" },
        { id: "photo-05", aspect: "portrait", tone: "cream", placeholder: "Inside a frame", caption: "Inside a pink frame", src: "/photos/editorial/photo-05.jpg", alt: "Alessandro and Bridget take a mirror photo framed by rippled pink curves.", position: "50% 55%" },
        { id: "photo-06", aspect: "portrait", tone: "olive", placeholder: "A laugh", caption: "A laugh worth keeping", src: "/photos/editorial/photo-06.jpg", alt: "Alessandro and Bridget laugh together in a garden, dressed for an occasion.", position: "50% 75%" },
        { id: "photo-07", aspect: "portrait", tone: "taupe", placeholder: "A walk", caption: "A walk in good company", src: "/photos/editorial/photo-07.jpg", alt: "Bridget walks a black-and-white dog along a tree-lined street.", position: "72% 72%" },
        { id: "photo-08", aspect: "landscape", tone: "blush", placeholder: "Bridget and an artwork", caption: "New images to discover", src: "/photos/editorial/photo-08.jpg", alt: "Bridget poses beside a large wall artwork.", position: "78% 50%" }
      ]
    },
    venue: {
      kicker: "The wedding",
      title: "Meet us at Casa Nuova",
      intro:
        "We’ll celebrate in the Piacenza countryside, at the foot of the Trebbia Valley hills, in a quiet place surrounded by green.",
      name: "Casa Nuova",
      date: "13 May 2028",
      address: "Via Casa Nuova 31 · 29029 Niviano di Rivergaro (PC), Italy",
      description:
        "We’ll celebrate across the garden, large portico, and indoor rooms. The venue also has six independent double accommodations; availability and room arrangements will be shared later.",
      facts: [
        "Piacenza countryside, at the foot of the Trebbia Valley hills",
        "Garden, large portico, and indoor rooms",
        "Six independent double accommodations at the venue"
      ],
      websiteLabel: "Official website",
      galleryLabel: "View the official gallery",
      mapLabel: "Open the map",
      websiteUrl: "https://www.casanuovaniviano.com/en/",
      galleryUrl: "https://www.casanuovaniviano.com/en/ricevimenti/",
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Casa+Nuova+Via+Casa+Nuova+31+29029+Niviano+di+Rivergaro+PC"
    },
    rsvp: {
      kicker: "Confirm your attendance",
      title: "One invitation, one personal QR",
      intro:
        "Each household will receive a personal QR code to confirm who will be joining us on 13 May.",
      statusLabel: "RSVP status",
      status: "Coming soon",
      householdTitle: "Designed for your household",
      householdBody:
        "The QR will open a private page with the names included in your invitation. You’ll be able to confirm attendance and update your response before the deadline.",
      steps: [
        "Receive your personal QR code",
        "Open your household’s private invitation",
        "Confirm or update your response"
      ],
      note:
        "We’ll generate the QR codes only after the final domain, guest list, and secure response handling are in place. No information is being collected yet."
    },
    letter: {
      kicker: "The letter",
      title: "A letter, with no challenges to pass",
      intro:
        "This page remains open to everyone, just like the story that brought us here.",
      open: "Open the letter",
      close: "Close the letter",
      dialogLabel: "Final letter from Alessandro and Bridget",
      letterTitle: "The next stop is ours",
      paragraphs: [
        "Some stories look for a perfect ending.",
        "This one would rather continue: through the streets still ahead, the small things worth remembering, and every time we choose to return to the same side."
      ],
      question: "Shall we continue?",
      envelopeFront: "For us, to open together",
      envelopeBack: "A & B · Casa Nuova"
    },
    footer: {
      names: "Alessandro & Bridget",
      place: "Casa Nuova · Niviano",
      date: "13 May 2028",
      rsvpLabel: "Go to RSVP",
      colophonLabel: "Open the colophon",
      colophonTitle: "Colophon",
      colophonBody:
        "A digital story built with editorial typography, illustrated scenes, personal photographs, and a lightweight 3D invitation.",
      colophonDetail:
        "Instrument Sans for the interface, Newsreader for the editorial voice. No external service is required during the visit.",
      close: "Close the colophon",
      languageLabel: "Site language",
      note: "Made with care, digital paper, and a little water turtle.",
      decorative: "A & B"
    }
  }
};

export function getEditorialContent(locale: EditorialLocale): EditorialContent {
  return baseContent[locale];
}
