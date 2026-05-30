'use client';

import Image from "next/image";
import { useMemo, useState } from "react";

import { FinalReveal } from "@/components/finale/FinalReveal";
import { HiddenObjectGame } from "@/components/games/HiddenObjectGame";
import { MemoryGame } from "@/components/games/MemoryGame";
import { PuzzleGame } from "@/components/games/PuzzleGame";
import { QuizGame } from "@/components/games/QuizGame";
import { ProgressIndicator } from "@/components/story/ProgressIndicator";
import { ScrollScene } from "@/components/story/ScrollScene";
import { gameLabels, gameOrder, storyChapters, type GameId } from "@/lib/storyConfig";
import { useStoryProgress } from "@/lib/useStoryProgress";

import styles from "./StoryShell.module.css";

const portalChapters = [
  { id: "timeline", number: "01", label: "Il primo passo" },
  { id: "map", number: "02", label: "I ricordi" },
  { id: "emotion", number: "03", label: "La promessa" },
  { id: "finale", number: "04", label: "Il finale" }
];

function getGameLabel(gameId: GameId) {
  return gameLabels[gameId].toLowerCase();
}

function buildChapterRequirements() {
  let previousGame: GameId | null = null;

  return storyChapters.reduce<Record<string, GameId | null>>((requirements, chapter) => {
    requirements[chapter.id] = previousGame;
    if (chapter.gameId) {
      previousGame = chapter.gameId;
    }
    return requirements;
  }, {});
}

export function StoryShell() {
  const [audioReady, setAudioReady] = useState(false);
  const {
    completedCount,
    completeGame,
    finaleUnlocked,
    isGameComplete,
    isGameUnlocked,
    progress,
    resetStory,
    startStory,
    totalGames
  } = useStoryProgress();

  const firstGameId = gameOrder[0] ?? null;
  const chapterRequirements = useMemo(buildChapterRequirements, []);

  const renderGame = (gameId: GameId) => {
    const completed = isGameComplete(gameId);
    const unlocked = isGameUnlocked(gameId);

    if (gameId === firstGameId && !progress.started) {
      return (
        <div className={styles.localStart} role="status">
          <p>The first mini-game is ready when you are.</p>
          <button type="button" className={styles.secondaryButton} onClick={startStory}>
            Inizia il capitolo
          </button>
        </div>
      );
    }

    if (!unlocked) {
      return (
        <div className={styles.lockedNote} role="status">
          Finish the previous chapter to unlock the {getGameLabel(gameId)} game.
        </div>
      );
    }

    switch (gameId) {
      case "quiz":
        return <QuizGame completed={completed} onComplete={() => completeGame(gameId)} />;
      case "memory":
        return <MemoryGame completed={completed} onComplete={() => completeGame(gameId)} />;
      case "puzzle":
        return <PuzzleGame completed={completed} onComplete={() => completeGame(gameId)} />;
      case "hidden":
        return (
          <HiddenObjectGame completed={completed} onComplete={() => completeGame(gameId)} />
        );
    }
  };

  return (
    <div className={styles.storyShell}>
      <a className={styles.skipLink} href="#story-content">
        Skip to story content
      </a>

      <ProgressIndicator
        completedCount={completedCount}
        totalGames={totalGames}
        isGameComplete={isGameComplete}
        isGameUnlocked={isGameUnlocked}
      />

      <header className={styles.intro}>
        <div className={styles.introCopy}>
          <div className={styles.portalTopline}>
            <span className={styles.eyebrow}>Capitolo 01</span>
            <button
              type="button"
              className={styles.audioToggle}
              aria-pressed={audioReady}
              aria-label={
                audioReady
                  ? "Audio ambience placeholder active"
                  : "Audio ambience placeholder inactive"
              }
              onClick={() => setAudioReady((current) => !current)}
            >
              {audioReady ? "Audio ready" : "Audio off"}
            </button>
          </div>
          <h1>Alessandro & Bridget, a story to enter</h1>
          <p>
            Un portale narrativo fatto di tappe, prove leggere e ricordi da
            sbloccare. Scorri, scegli il capitolo, e lascia che il viaggio apra
            il finale solo quando ogni promessa e stata guadagnata.
          </p>

          <nav className={styles.chapterNav} aria-label="Chapter navigation">
            {portalChapters.map((chapter) => (
              <a key={chapter.id} href={`#${chapter.id}`}>
                <span>{chapter.number}</span>
                <strong>{chapter.label}</strong>
              </a>
            ))}
          </nav>

          <div className={styles.introActions}>
            <a
              className={styles.primaryButton}
              href="#timeline"
              onClick={() => startStory()}
            >
              Inizia il viaggio
            </a>
            <button type="button" className={styles.secondaryButton} onClick={resetStory}>
              Reset progress
            </button>
          </div>

          <a className={styles.scrollCue} href="#timeline" aria-label="Scorri per continuare">
            <span aria-hidden="true" />
            Scorri per continuare
          </a>
        </div>

        <div className={styles.introArt} aria-hidden="true">
          <div className={styles.citySign}>MILANO</div>
          <span className={styles.routeMarker} />
          <span className={styles.routeMarker} />
          <span className={styles.routeMarker} />
          <div className={styles.duomoFrame}>
            <Image
              src="/scene/duomo-milano-bitzee-warm-v2.png"
              alt=""
              width={282}
              height={248}
              priority
              unoptimized
            />
          </div>
        </div>
      </header>

      <div className={styles.storyTrack} id="story-content">
        {storyChapters.map((chapter, chapterIndex) => {
          const gameId = chapter.gameId;
          const requiredPreviousGame = chapterRequirements[chapter.id] ?? null;
          const chapterUnlocked = requiredPreviousGame
            ? isGameComplete(requiredPreviousGame)
            : true;
          const locked = !chapterUnlocked || Boolean(gameId && !isGameUnlocked(gameId));
          const complete = gameId ? isGameComplete(gameId) : progress.started;

          if (chapter.id === "finale") {
            return (
              <ScrollScene
                key={chapter.id}
                chapter={chapter}
                locked={!finaleUnlocked}
                complete={finaleUnlocked}
              >
                <FinalReveal unlocked={finaleUnlocked} onReset={resetStory} />
              </ScrollScene>
            );
          }

          return (
            <ScrollScene
              key={chapter.id}
              chapter={chapter}
              locked={locked}
              complete={complete}
            >
              {chapter.gameId && !locked && (
                <div className={styles.gameSlot}>{renderGame(chapter.gameId)}</div>
              )}
            </ScrollScene>
          );
        })}
      </div>
    </div>
  );
}
