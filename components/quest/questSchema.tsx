import type { ReactNode } from "react";

import type { PixelCharacterVariant } from "@/components/pixel/PixelCharacter";
import { TetrisQuest } from "@/components/quest/games/TetrisQuest";
import { PacMazeQuest } from "@/components/quest/games/PacMazeQuest";
import { FlappyLettersQuest } from "@/components/quest/games/FlappyLettersQuest";
import { PlatformRunQuest } from "@/components/quest/games/PlatformRunQuest";

export type EventKey = "tetris" | "pacmaze" | "flappy" | "platformer";

export type QuestProgressSnapshot = {
  completedCount: number;
  total: number;
  heartsCollected: number;
};

export type QuestEvent = {
  key: EventKey;
  title: string;
  subtitle: string;
  description: string;
  location: string;
  year: string;
  color: string;
  accent: string;
  rewardHearts: number;
  render: (props: {
    onComplete: (hearts: number) => void;
    onExit: () => void;
    rewardHearts: number;
    playerCharacter: PixelCharacterVariant;
  }) => ReactNode;
};

export const QUEST_EVENTS: QuestEvent[] = [
  {
    key: "tetris",
    title: "Block Party Beginnings",
    subtitle: "Tetris rooftops",
    description:
      "Drop the beats (and blocks) into place to remember that neon night where everything clicked.",
    location: "Milan Rooftop",
    year: "2017",
    color: "#d8664f",
    accent: "#8c2f26",
    rewardHearts: 4,
    render: ({ onComplete, rewardHearts, playerCharacter }) => (
      <TetrisQuest
        onComplete={onComplete}
        rewardHearts={rewardHearts}
        playerCharacter={playerCharacter}
      />
    )
  },
  {
    key: "pacmaze",
    title: "Hearts in the Arcade",
    subtitle: "Pac-Maze chase",
    description:
      "Navigate the maze, collect every heart, and dodge the doubts that tried to chase us away.",
    location: "Tokyo Arcade",
    year: "2018",
    color: "#3d7d58",
    accent: "#1f4d33",
    rewardHearts: 6,
    render: ({ onComplete, rewardHearts, playerCharacter }) => (
      <PacMazeQuest
        onComplete={onComplete}
        rewardHearts={rewardHearts}
        playerCharacter={playerCharacter}
      />
    )
  },
  {
    key: "flappy",
    title: "Skyline Letters",
    subtitle: "Flappy love notes",
    description:
      "Keep the rooftop letters aloft through gusty winds. Every obstacle is another promise we made.",
    location: "Paris Balconies",
    year: "2019",
    color: "#f2c36b",
    accent: "#c07a32",
    rewardHearts: 8,
    render: ({ onComplete, rewardHearts, playerCharacter }) => (
      <FlappyLettersQuest
        onComplete={onComplete}
        rewardHearts={rewardHearts}
        playerCharacter={playerCharacter}
      />
    )
  },
  {
    key: "platformer",
    title: "Side-Scroller Vows",
    subtitle: "Pixel promise run",
    description:
      "Sprint through the forest of jitters, leap over what-ifs, and gather the vows that seal our story.",
    location: "Dolomites Trail",
    year: "2021",
    color: "#85bfa0",
    accent: "#427a5a",
    rewardHearts: 10,
    render: ({ onComplete, rewardHearts, playerCharacter }) => (
      <PlatformRunQuest
        onComplete={onComplete}
        rewardHearts={rewardHearts}
        playerCharacter={playerCharacter}
      />
    )
  }
];

export function isEventUnlocked(
  key: EventKey,
  progress: Record<EventKey, boolean>
): boolean {
  const order: EventKey[] = ["tetris", "pacmaze", "flappy", "platformer"];
  const index = order.indexOf(key);
  if (index === -1) return false;
  if (index === 0) return true;
  return order.slice(0, index).every((eventKey) => progress[eventKey]);
}
