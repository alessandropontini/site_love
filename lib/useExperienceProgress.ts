'use client';

import { useEffect, useMemo, useState } from "react";

import {
  chapterOrder,
  type ChapterId
} from "@/lib/experienceConfig";

const STORAGE_KEY = "site-love-experience-v3";
const PREVIOUS_STORAGE_KEY = "site-love-experience-v2";
const LEGACY_STORAGE_KEY = "site-love-story-progress-v1";

export type ExperienceView =
  | "invitation"
  | "map"
  | "chapter"
  | "reward"
  | "finale";

type StoredExperience = {
  version: 3;
  started: boolean;
  completedChapters: ChapterId[];
  view: ExperienceView;
  activeChapter: ChapterId | null;
  motionEnabled: boolean;
};

const initialExperience: StoredExperience = {
  version: 3,
  started: false,
  completedChapters: [],
  view: "invitation",
  activeChapter: null,
  motionEnabled: true
};

function isChapterId(value: unknown): value is ChapterId {
  return typeof value === "string" && chapterOrder.includes(value as ChapterId);
}

function isExperienceView(value: unknown): value is ExperienceView {
  return (
    value === "invitation" ||
    value === "map" ||
    value === "chapter" ||
    value === "reward" ||
    value === "finale"
  );
}

function sanitizeChapterList(value: unknown) {
  if (!Array.isArray(value)) return [];

  const completedChapters: ChapterId[] = [];
  for (const chapterId of chapterOrder) {
    if (!value.includes(chapterId)) break;
    completedChapters.push(chapterId);
  }
  return completedChapters;
}

function parseStoredExperience(value: string | null): StoredExperience | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<StoredExperience>;
    const completedChapters = sanitizeChapterList(parsed.completedChapters);
    const activeChapter = isChapterId(parsed.activeChapter) ? parsed.activeChapter : null;
    let view = isExperienceView(parsed.view) ? parsed.view : "invitation";
    const activeChapterIndex = activeChapter
      ? chapterOrder.indexOf(activeChapter)
      : -1;
    const activeChapterUnlocked =
      activeChapterIndex >= 0 &&
      chapterOrder
        .slice(0, activeChapterIndex)
        .every((chapterId) => completedChapters.includes(chapterId));

    if (view === "chapter" && (!activeChapter || !activeChapterUnlocked)) {
      view = "map";
    }

    if (
      view === "reward" &&
      (!activeChapter || !completedChapters.includes(activeChapter))
    ) {
      view = "map";
    }

    if (view === "finale" && completedChapters.length !== chapterOrder.length) {
      view = "map";
    }

    const normalizedActiveChapter =
      view === "chapter" || view === "reward" ? activeChapter : null;

    return {
      version: 3,
      started: Boolean(parsed.started),
      completedChapters,
      view,
      activeChapter: normalizedActiveChapter,
      motionEnabled: parsed.motionEnabled !== false
    };
  } catch {
    return null;
  }
}

function migrateLegacyExperience(value: string | null): StoredExperience | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as { started?: unknown; completedGames?: unknown };
    const hadLegacyProgress =
      Boolean(parsed.started) ||
      (Array.isArray(parsed.completedGames) && parsed.completedGames.length > 0);

    return {
      ...initialExperience,
      started: hadLegacyProgress,
      view: "invitation"
    };
  } catch {
    return null;
  }
}

function migratePreviousExperience(value: string | null): StoredExperience | null {
  const previous = parseStoredExperience(value);
  if (!previous) return null;

  return {
    ...previous,
    version: 3,
    completedChapters: previous.completedChapters.filter(
      (chapterId) => chapterId !== "future"
    ),
    view: previous.view === "invitation" ? "invitation" : "map",
    activeChapter: null
  };
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The experience remains fully playable when browser storage is unavailable.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

export function useExperienceProgress() {
  const [experience, setExperience] = useState<StoredExperience>(initialExperience);
  const [hydrated, setHydrated] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setSystemReducedMotion(motionPreference.matches);
    const stored = parseStoredExperience(readStorage(STORAGE_KEY));
    const previous = migratePreviousExperience(readStorage(PREVIOUS_STORAGE_KEY));
    const legacy = migrateLegacyExperience(
      readStorage(LEGACY_STORAGE_KEY)
    );
    const restored = stored ?? previous ?? legacy ?? initialExperience;

    syncMotionPreference();
    motionPreference.addEventListener("change", syncMotionPreference);
    setExperience(restored);
    setHydrated(true);

    return () => motionPreference.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(STORAGE_KEY, JSON.stringify(experience));
  }, [experience, hydrated]);

  const completedSet = useMemo(
    () => new Set(experience.completedChapters),
    [experience.completedChapters]
  );
  const completedCount = experience.completedChapters.length;
  const finaleUnlocked = chapterOrder.every((chapterId) => completedSet.has(chapterId));

  const isChapterComplete = (chapterId: ChapterId) => completedSet.has(chapterId);

  const isChapterUnlocked = (chapterId: ChapterId) => {
    const chapterIndex = chapterOrder.indexOf(chapterId);
    if (chapterIndex <= 0) return true;
    return chapterOrder
      .slice(0, chapterIndex)
      .every((previousChapterId) => completedSet.has(previousChapterId));
  };

  const enterJourney = () => {
    setExperience((current) => ({
      ...current,
      started: true,
      view: "map",
      activeChapter: null
    }));
  };

  const openChapter = (chapterId: ChapterId) => {
    if (!isChapterUnlocked(chapterId)) return;
    setExperience((current) => ({
      ...current,
      started: true,
      view: "chapter",
      activeChapter: chapterId
    }));
  };

  const finishChapter = (chapterId: ChapterId) => {
    setExperience((current) => {
      const chapterIndex = chapterOrder.indexOf(chapterId);
      const validCompletion =
        chapterIndex >= 0 &&
        chapterOrder
          .slice(0, chapterIndex)
          .every((previousChapterId) => current.completedChapters.includes(previousChapterId));
      if (!validCompletion) return current;

      const completedChapters = current.completedChapters.includes(chapterId)
        ? current.completedChapters
        : [...current.completedChapters, chapterId];

      return {
        ...current,
        completedChapters,
        view: "reward",
        activeChapter: chapterId
      };
    });
  };

  const returnToMap = () => {
    setExperience((current) => ({
      ...current,
      view: "map",
      activeChapter: null
    }));
  };

  const openFinale = () => {
    if (!finaleUnlocked) return;
    setExperience((current) => ({
      ...current,
      view: "finale",
      activeChapter: null
    }));
  };

  const showInvitation = () => {
    setExperience((current) => ({
      ...current,
      view: "invitation",
      activeChapter: null
    }));
  };

  const toggleMotion = () => {
    if (systemReducedMotion) return;
    setExperience((current) => ({
      ...current,
      motionEnabled: !current.motionEnabled
    }));
  };

  const resetExperience = () => {
    setExperience((current) => ({
      ...initialExperience,
      motionEnabled: current.motionEnabled
    }));
    removeStorage(STORAGE_KEY);
    removeStorage(PREVIOUS_STORAGE_KEY);
    removeStorage(LEGACY_STORAGE_KEY);
  };

  return {
    activeChapter: experience.activeChapter,
    completedCount,
    enterJourney,
    experience: {
      ...experience,
      motionEnabled: experience.motionEnabled && !systemReducedMotion
    },
    finaleUnlocked,
    finishChapter,
    hydrated,
    isChapterComplete,
    isChapterUnlocked,
    openChapter,
    openFinale,
    resetExperience,
    returnToMap,
    showInvitation,
    motionLockedBySystem: systemReducedMotion,
    toggleMotion
  };
}
