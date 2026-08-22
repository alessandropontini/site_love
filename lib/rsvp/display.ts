import type {
  InvitationSource,
  MealPreference,
  RsvpLocale
} from "@/lib/rsvp/types";

export const selectableMealPreferences = [
  "standard",
  "vegetarian",
  "children",
  "vegan"
] as const satisfies readonly MealPreference[];

export const mealPreferenceLabels: Record<
  RsvpLocale,
  Record<MealPreference, string>
> = {
  it: {
    standard: "Tradizione piacentina",
    vegetarian: "Piacentino vegetariano",
    vegan: "Vegano — da concordare",
    children: "Piccoli ospiti",
    not_needed: "Non necessario"
  },
  en: {
    standard: "Piacenza tradition",
    vegetarian: "Vegetarian Piacenza menu",
    vegan: "Vegan — to be arranged",
    children: "Young guests",
    not_needed: "Not needed"
  }
};

export const invitationSourceLabels: Record<
  RsvpLocale,
  Record<InvitationSource, string>
> = {
  it: {
    bride: "Bridget · sposa",
    groom: "Alessandro · sposo",
    both: "Entrambi"
  },
  en: {
    bride: "Bridget · bride",
    groom: "Alessandro · groom",
    both: "Both"
  }
};

export const menuDishIds = [
  "chisolini_salumi",
  "chisolini_vegetariani",
  "tortelli_con_la_coda",
  "coppa_arrosto",
  "polenta_funghi",
  "torta_spisigona"
] as const;

export type MenuDishId = (typeof menuDishIds)[number];

export const menuDishImages: Record<MenuDishId, string> = {
  chisolini_salumi: "/rsvp/menu/chisolini-salumi.jpg",
  chisolini_vegetariani: "/rsvp/menu/chisolini-vegetariani.jpg",
  tortelli_con_la_coda: "/rsvp/menu/tortelli-con-la-coda.jpg",
  coppa_arrosto: "/rsvp/menu/coppa-arrosto.jpg",
  polenta_funghi: "/rsvp/menu/polenta-funghi.jpg",
  torta_spisigona: "/rsvp/menu/torta-spisigona.jpg"
};

export const menuDishCopy: Record<
  RsvpLocale,
  Record<
    MenuDishId,
    {
      title: string;
      description: string;
      ingredients: string;
      imageAlt: string;
    }
  >
> = {
  it: {
    chisolini_salumi: {
      title: "Chisolini con salumi piacentini",
      description:
        "I chisolini, o chisulén, sono rettangoli di pasta lievitata fritta: arrivano caldi e si accompagnano ai salumi del territorio.",
      ingredients:
        "Pasta fritta e, nella proposta, Coppa Piacentina DOP, Pancetta Piacentina DOP e Salame Piacentino DOP.",
      imageAlt:
        "Chisolini dorati serviti con coppa, pancetta e salame piacentini"
    },
    chisolini_vegetariani: {
      title: "Chisolini con formaggi e giardiniera",
      description:
        "La variante vegetariana mantiene i chisolini caldi e sostituisce i salumi con formaggi locali e verdure in agrodolce.",
      ingredients:
        "Pasta fritta, selezione di formaggi locali e giardiniera; composizione finale da concordare con il catering.",
      imageAlt:
        "Chisolini dorati serviti con formaggi e verdure in giardiniera"
    },
    tortelli_con_la_coda: {
      title: "Tortelli con la coda",
      description:
        "Una pasta ripiena tipica del Piacentino, chiusa a mano con un intreccio sottile che forma le due caratteristiche code.",
      ingredients:
        "Sfoglia all’uovo, ricotta, erbette o spinaci, formaggio grattugiato e noce moscata; nella proposta, burro e salvia.",
      imageAlt:
        "Tortelli con la coda intrecciati, conditi con burro e salvia"
    },
    coppa_arrosto: {
      title: "Coppa arrosto con patate",
      description:
        "Un secondo della tradizione piacentina preparato con il taglio di maiale della coppa, arrostito e servito a fette.",
      ingredients:
        "Coppa fresca di maiale, aromi e patate al forno; ricetta e fondo di cottura saranno definiti con il catering.",
      imageAlt: "Coppa di maiale arrosto affettata con patate al forno"
    },
    polenta_funghi: {
      title: "Polenta con funghi e verdure",
      description:
        "La proposta vegetariana abbina una polenta morbida a funghi e verdure di stagione, con una presentazione semplice e autunnale.",
      ingredients:
        "Farina di mais, funghi e verdure di stagione; grassi e fondo di cottura dovranno essere confermati vegetariani.",
      imageAlt:
        "Polenta morbida servita con funghi e verdure di stagione"
    },
    torta_spisigona: {
      title: "Torta Spisigona",
      description:
        "Dolce friabile di Gragnano Trebbiense, composto da piccoli pezzi di impasto pizzicati con le dita: da qui il nome spisigona.",
      ingredients:
        "Farina, burro, zucchero e tuorli cotti secondo la ricetta tradizionale; consistenza asciutta e sbriciolata.",
      imageAlt:
        "Torta Spisigona friabile, spezzata in piccoli pezzi irregolari"
    }
  },
  en: {
    chisolini_salumi: {
      title: "Chisolini with Piacenza cured meats",
      description:
        "Chisolini, also called chisulén, are small rectangles of yeasted dough, fried until golden and served warm with local cured meats.",
      ingredients:
        "Fried dough and, in this draft menu, Coppa Piacentina PDO, Pancetta Piacentina PDO, and Salame Piacentino PDO.",
      imageAlt:
        "Golden chisolini served with Piacenza coppa, pancetta, and salami"
    },
    chisolini_vegetariani: {
      title: "Chisolini with cheese and pickled vegetables",
      description:
        "This vegetarian version keeps the warm fried dough and replaces the cured meats with local cheeses and sweet-and-sour vegetables.",
      ingredients:
        "Fried dough, a selection of local cheeses, and giardiniera; the final combination will be agreed with the caterer.",
      imageAlt:
        "Golden chisolini served with cheeses and pickled vegetables"
    },
    tortelli_con_la_coda: {
      title: "Tortelli con la coda",
      description:
        "A filled pasta from the Piacenza area, closed by hand with a fine braid that creates the two distinctive “tails”.",
      ingredients:
        "Egg pasta, ricotta, herbs or spinach, grated cheese, and nutmeg; served with butter and sage in this draft menu.",
      imageAlt:
        "Braided tortelli con la coda pasta dressed with butter and sage"
    },
    coppa_arrosto: {
      title: "Roast coppa with potatoes",
      description:
        "A traditional Piacenza main course made from the pork collar cut used for coppa, roasted and served in slices.",
      ingredients:
        "Fresh pork collar, herbs, and oven-baked potatoes; the final seasoning and cooking juices will be agreed with the caterer.",
      imageAlt: "Sliced roast pork coppa with oven-baked potatoes"
    },
    polenta_funghi: {
      title: "Polenta with mushrooms and vegetables",
      description:
        "The vegetarian proposal pairs soft cornmeal polenta with mushrooms and seasonal vegetables in a simple, autumnal dish.",
      ingredients:
        "Cornmeal, mushrooms, and seasonal vegetables; fats and cooking stock must be confirmed as vegetarian.",
      imageAlt:
        "Soft polenta served with mushrooms and seasonal vegetables"
    },
    torta_spisigona: {
      title: "Torta Spisigona",
      description:
        "A dry, crumbly cake from Gragnano Trebbiense, made from small pieces of dough pinched by hand—an action that gives the cake its name.",
      ingredients:
        "Flour, butter, sugar, and cooked egg yolks in the traditional recipe, producing a crisp, crumbly texture.",
      imageAlt:
        "Crumbly Torta Spisigona broken into small irregular pieces"
    }
  }
};

export const menuProposalCopy = {
  it: {
    kicker: "Sapori del territorio",
    title: "Una proposta piacentina",
    intro:
      "Tre percorsi ispirati alla cucina di Piacenza. Scegli quello più adatto per ogni persona presente.",
    draft:
      "Menu indicativo: portate, ingredienti e allergeni saranno confermati con location e catering.",
    viewDish: "Scopri il piatto",
    closeDish: "Chiudi",
    ingredientsHeading: "Ingredienti tipici",
    imageNote:
      "Immagine illustrativa originale. Presentazione e ingredienti finali possono variare.",
    veganNote:
      "L’opzione vegana resta disponibile e verrà definita direttamente con il catering.",
    menus: [
      {
        value: "standard",
        title: "Tradizione piacentina",
        courses: [
          {
            dish: "chisolini_salumi",
            label:
              "Chisolini con Coppa Piacentina DOP, Pancetta Piacentina DOP e Salame Piacentino DOP"
          },
          {
            dish: "tortelli_con_la_coda",
            label: "Tortelli con la coda al burro e salvia"
          },
          {
            dish: "coppa_arrosto",
            label: "Coppa arrosto con patate al forno"
          },
          { dish: "torta_spisigona", label: "Torta Spisigona" }
        ]
      },
      {
        value: "vegetarian",
        title: "Piacentino vegetariano",
        courses: [
          {
            dish: "chisolini_vegetariani",
            label: "Chisolini con formaggi locali e giardiniera"
          },
          {
            dish: "tortelli_con_la_coda",
            label: "Tortelli con la coda di ricotta, erbette e Grana Padano DOP"
          },
          {
            dish: "polenta_funghi",
            label: "Polenta con funghi e verdure di stagione"
          },
          { dish: "torta_spisigona", label: "Torta Spisigona" }
        ]
      },
      {
        value: "children",
        title: "Piccoli ospiti",
        courses: [
          {
            dish: "tortelli_con_la_coda",
            label: "Tortelli con la coda al burro, in porzione piccola"
          },
          {
            dish: "coppa_arrosto",
            label: "Coppa arrosto con patate al forno"
          },
          { dish: "torta_spisigona", label: "Torta Spisigona" }
        ]
      }
    ]
  },
  en: {
    kicker: "Local flavours",
    title: "A taste of Piacenza",
    intro:
      "Three menus inspired by Piacenza cuisine. Choose the best fit for each guest who will attend.",
    draft:
      "Draft menu: courses, ingredients, and allergens will be confirmed with the venue and caterer.",
    viewDish: "View dish",
    closeDish: "Close",
    ingredientsHeading: "Typical ingredients",
    imageNote:
      "Original illustrative image. Final presentation and ingredients may vary.",
    veganNote:
      "A vegan option remains available and will be arranged directly with the caterer.",
    menus: [
      {
        value: "standard",
        title: "Piacenza tradition",
        courses: [
          {
            dish: "chisolini_salumi",
            label:
              "Chisolini with Coppa Piacentina PDO, Pancetta Piacentina PDO, and Salame Piacentino PDO"
          },
          {
            dish: "tortelli_con_la_coda",
            label: "Tortelli con la coda with butter and sage"
          },
          {
            dish: "coppa_arrosto",
            label: "Roast coppa with oven-baked potatoes"
          },
          { dish: "torta_spisigona", label: "Torta Spisigona" }
        ]
      },
      {
        value: "vegetarian",
        title: "Vegetarian Piacenza menu",
        courses: [
          {
            dish: "chisolini_vegetariani",
            label: "Chisolini with local cheeses and pickled vegetables"
          },
          {
            dish: "tortelli_con_la_coda",
            label:
              "Tortelli con la coda with ricotta, greens, and Grana Padano PDO"
          },
          {
            dish: "polenta_funghi",
            label: "Polenta with mushrooms and seasonal vegetables"
          },
          { dish: "torta_spisigona", label: "Torta Spisigona" }
        ]
      },
      {
        value: "children",
        title: "Young guests",
        courses: [
          {
            dish: "tortelli_con_la_coda",
            label: "A smaller serving of tortelli con la coda with butter"
          },
          {
            dish: "coppa_arrosto",
            label: "Roast coppa with oven-baked potatoes"
          },
          { dish: "torta_spisigona", label: "Torta Spisigona" }
        ]
      }
    ]
  }
} as const;
