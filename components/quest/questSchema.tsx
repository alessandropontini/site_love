import type { ReactNode } from "react";

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
    color: "#82c1ff",
    accent: "#214872",
    rewardHearts: 4,
    render: ({ onComplete, rewardHearts }) => (
      <TetrisQuest onComplete={onComplete} rewardHearts={rewardHearts} />
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
    color: "#ffd966",
    accent: "#5e4908",
    rewardHearts: 6,
    render: ({ onComplete, rewardHearts }) => (
      <PacMazeQuest onComplete={onComplete} rewardHearts={rewardHearts} />
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
    color: "#ff98d5",
    accent: "#641647",
    rewardHearts: 8,
    render: ({ onComplete, rewardHearts }) => (
      <FlappyLettersQuest onComplete={onComplete} rewardHearts={rewardHearts} />
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
    color: "#78f5ae",
    accent: "#0f6a3a",
    rewardHearts: 10,
    render: ({ onComplete, rewardHearts }) => (
      <PlatformRunQuest onComplete={onComplete} rewardHearts={rewardHearts} />
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
