export type Photo = {
  id: string;
  imageUrl: string;
  title: string;
  tagline: string;
  location?: string;
  capturedOn?: string;
  accent: string;
};

export const photos: Photo[] = [
  {
    id: "moonlit-steps",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80",
    title: "Moonlit Steps",
    tagline: "Soft jazz in the alleyway, footsteps syncing with our pulses.",
    location: "Venice",
    capturedOn: "May 2023",
    accent: "rgba(255, 186, 250, 0.55)"
  },
  {
    id: "sunrise-train",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    title: "First Light",
    tagline: "Sunrise sneaks in through the train window, painting your smile.",
    location: "Cinque Terre",
    capturedOn: "July 2023",
    accent: "rgba(255, 222, 212, 0.55)"
  },
  {
    id: "coastal-breeze",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=80",
    title: "Sea Breeze",
    tagline: "Salt in the air, laughter wrapped in golden hour shimmer.",
    location: "Amalfi Coast",
    capturedOn: "August 2022",
    accent: "rgba(198, 227, 255, 0.55)"
  },
  {
    id: "desert-dance",
    imageUrl:
      "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?auto=format&fit=crop&w=1600&q=80",
    title: "Desert Waltz",
    tagline: "Wind-sculpted dunes turned into our private dance floor.",
    location: "Morocco",
    capturedOn: "April 2022",
    accent: "rgba(255, 213, 194, 0.55)"
  },
  {
    id: "city-lights",
    imageUrl:
      "https://images.unsplash.com/photo-1520854221050-0f4caff449fb?auto=format&fit=crop&w=1600&q=80",
    title: "City Whispers",
    tagline: "Neon reflections and secrets shared between skyscrapers.",
    location: "Tokyo",
    capturedOn: "October 2021",
    accent: "rgba(198, 255, 235, 0.55)"
  },
  {
    id: "forest-hush",
    imageUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1600&q=80",
    title: "Forest Hush",
    tagline: "Soft moss underfoot and promises weaved between the pines.",
    location: "Dolomites",
    capturedOn: "September 2022",
    accent: "rgba(214, 206, 255, 0.55)"
  }
];

export const wallPhotos = photos.slice(0, 4);
export const storyStack = photos.slice(2);
