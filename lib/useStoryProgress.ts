'use client';

import { useEffect, useMemo, useState } from "react";

import { gameOrder, type GameId } from "@/lib/storyConfig";

const STORAGE_KEY = "site-love-story-progress-v1";

type StoredProgress = {
  started: boolean;
  completedGames: GameId[];
};

const initialProgress: StoredProgress = {
  started: false,
  completedGames: []
};

function isGameId(value: string): value is GameId {
  return gameOrder.includes(value as GameId);
}

function parseStoredProgress(value: string | null): StoredProgress {
  if (!value) return initialProgress;

  try {
    const parsed = JSON.parse(value) as Partial<StoredProgress>;
    return {
      started: Boolean(parsed.started),
      completedGames: Array.isArray(parsed.completedGames)
        ? parsed.completedGames.filter(isGameId)
        : []
    };
  } catch {
    return initialProgress;
  }
}

export function useStoryProgress() {
  const [progress, setProgress] = useState<StoredProgress>(initialProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProgress(parseStoredProgress(window.localStorage.getItem(STORAGE_KEY)));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  const completedSet = useMemo(
    () => new Set<GameId>(progress.completedGames),
    [progress.completedGames]
  );

  const completedCount = progress.completedGames.length;
  const totalGames = gameOrder.length;
  const finaleUnlocked = completedCount === totalGames;

  const isGameComplete = (gameId: GameId) => completedSet.has(gameId);

  const isGameUnlocked = (gameId: GameId) => {
    const index = gameOrder.indexOf(gameId);
    if (index <= 0) return progress.started;
    return gameOrder.slice(0, index).every((id) => completedSet.has(id));
  };

  const startStory = () => {
    setProgress((current) => ({
      ...current,
      started: true
    }));
  };

  const completeGame = (gameId: GameId) => {
    setProgress((current) => {
      if (current.completedGames.includes(gameId)) {
        return current;
      }

      return {
        started: true,
        completedGames: [...current.completedGames, gameId]
      };
    });
  };

  const resetStory = () => {
    setProgress(initialProgress);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    completedCount,
    completeGame,
    finaleUnlocked,
    hydrated,
    isGameComplete,
    isGameUnlocked,
    progress,
    resetStory,
    startStory,
    totalGames
  };
}
