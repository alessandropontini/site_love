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
    id: "neon-stroll",
    imageUrl:
      "https://images.unsplash.com/photo-1520854221050-0f4caff449fb?auto=format&fit=crop&w=1600&q=80",
    title: "Neon Stroll",
    tagline: "Sample night scene drenched in color and city hum.",
    location: "Tokyo",
    capturedOn: "Scene 01 · Night",
    accent: "rgba(255, 210, 237, 0.55)"
  },
  {
    id: "sunrise-express",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    title: "Sunrise Express",
    tagline: "Warming light through the carriage for a cinematic opener.",
    location: "Mediterranean Route",
    capturedOn: "Scene 02 · Dawn",
    accent: "rgba(255, 222, 212, 0.55)"
  },
  {
    id: "seaside-hideout",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=80",
    title: "Seaside Hideout",
    tagline: "Mock engagement shoot washed in marine blues and greens.",
    location: "Amalfi Coast",
    capturedOn: "Scene 03 · Golden Hour",
    accent: "rgba(198, 227, 255, 0.55)"
  },
  {
    id: "desert-sway",
    imageUrl:
      "https://images.unsplash.com/photo-1502323777036-f29e3972d82f?auto=format&fit=crop&w=1600&q=80",
    title: "Desert Sway",
    tagline: "Editorial shot staged in warm dunes with long shadows.",
    location: "Morocco",
    capturedOn: "Scene 04 · Sunset",
    accent: "rgba(255, 213, 194, 0.55)"
  },
  {
    id: "moonlit-overlook",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80",
    title: "Moonlit Overlook",
    tagline: "Steps, string lights, and an easy stand-in for the romantic beat.",
    location: "Venice",
    capturedOn: "Scene 05 · Evening",
    accent: "rgba(198, 255, 235, 0.55)"
  },
  {
    id: "forest-campfire",
    imageUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1600&q=80",
    title: "Forest Campfire",
    tagline: "Closing scene with muted tones and twilight ambience.",
    location: "Dolomites",
    capturedOn: "Scene 06 · Twilight",
    accent: "rgba(214, 206, 255, 0.55)"
  }
];

export const wallPhotos = photos.slice(0, 4);
export const storyStack = photos.slice(2);
