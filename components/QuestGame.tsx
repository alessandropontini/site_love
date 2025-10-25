'use client';

import { useEffect, useMemo, useState } from "react";

import {
  PixelCharacter,
  type PixelCharacterVariant
} from "@/components/pixel/PixelCharacter";
import { QuestEventPanel } from "@/components/quest/QuestEventPanel";
import { QuestMap } from "@/components/quest/QuestMap";
import {
  QuestLeaderboard,
  type QuestLeaderboardEntry
} from "@/components/quest/QuestLeaderboard";
import { QuestSummary } from "@/components/quest/QuestSummary";
import {
  EventKey,
  QUEST_EVENTS,
  type QuestProgressSnapshot
} from "@/components/quest/questSchema";

type ScreenState = "intro" | "map" | "game" | "ending";

const CHARACTER_OPTIONS: Array<{
  key: PixelCharacterVariant;
  label: string;
  note: string;
}> = [
  {
    key: "alessandro",
    label: "Alessandro",
    note: "Milanese cuore, city rooftop poet"
  },
  {
    key: "bridget",
    label: "Bridget",
    note: "Brooklyn-born, Italian-American spark"
  }
];

export function QuestGame() {
  const [screen, setScreen] = useState<ScreenState>("intro");
  const [activeEvent, setActiveEvent] = useState<EventKey | null>(null);
  const [progress, setProgress] = useState<Record<EventKey, boolean>>({
    tetris: false,
    pacmaze: false,
    flappy: false,
    platformer: false
  });
  const [heartsCollected, setHeartsCollected] = useState<number>(0);
  const [playerCharacter, setPlayerCharacter] =
    useState<PixelCharacterVariant>("alessandro");
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [leaderboardEntries, setLeaderboardEntries] = useState<QuestLeaderboardEntry[]>(
    []
  );

  const completedCount = useMemo(
    () => Object.values(progress).filter(Boolean).length,
    [progress]
  );

  const progressSnapshot: QuestProgressSnapshot = useMemo(
    () => ({
      completedCount,
      total: QUEST_EVENTS.length,
      heartsCollected
    }),
    [completedCount, heartsCollected]
  );

  const partnerCharacter: PixelCharacterVariant =
    playerCharacter === "alessandro" ? "bridget" : "alessandro";

  const handleStart = () => {
    setScreen("map");
  };

  useEffect(() => {
    if (screen === "game") {
      const panel = document.getElementById("quest-event-panel");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (screen === "map" || screen === "ending") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [screen, activeEvent]);

  const handleSelectEvent = (eventKey: EventKey) => {
    setActiveEvent(eventKey);
    setScreen("game");
    setAttemptCount((prev) => prev + 1);
  };

  const handleCompleteEvent = (eventKey: EventKey, heartsEarned: number) => {
    const eventMeta = QUEST_EVENTS.find((event) => event.key === eventKey);
    setProgress((prev) => {
      const snapshot = { ...prev, [eventKey]: true };
      const finished = QUEST_EVENTS.every((event) => snapshot[event.key]);
      setScreen(finished ? "ending" : "map");
      return snapshot;
    });
    setHeartsCollected((prev) => prev + heartsEarned);
    if (eventMeta) {
      setLeaderboardEntries((previous) => {
        const nextEntry: QuestLeaderboardEntry = {
          id: Date.now(),
          eventKey,
          eventTitle: eventMeta.title,
          hearts: heartsEarned,
          character: playerCharacter,
          completedAt: Date.now()
        };
        return [...previous, nextEntry]
          .sort((a, b) => {
            if (b.hearts !== a.hearts) return b.hearts - a.hearts;
            return b.completedAt - a.completedAt;
          })
          .slice(0, 8);
      });
    }
    setActiveEvent(null);
  };

  const handleReturnToMap = () => {
    setActiveEvent(null);
    setScreen("map");
  };

  return (
    <section className="quest-shell">
      <header className="quest-hero">
        <PixelCharacter variant={playerCharacter} size={148} />
        <div className="quest-hero-copy">
          <p className="quest-prelude">A pixel tale</p>
          <h1>
            The Story of <span>Alessandro</span> & <span>Bridget</span>
          </h1>
          <p>
            Press start to hop onto the nostalgia trail. Each retro mini-game
            unlocks a slice of our story—from rooftop starts to forever vows.
          </p>
          <div className="quest-character-selector">
            <span>Choose your avatar</span>
            <div className="quest-character-options">
              {CHARACTER_OPTIONS.map(({ key, label, note }) => {
                const isActive = playerCharacter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className="quest-character-option"
                    data-active={isActive}
                    aria-pressed={isActive}
                    onClick={() => setPlayerCharacter(key)}
                  >
                    <PixelCharacter
                      variant={key}
                      size={60}
                      className="quest-character-sprite"
                    />
                    <span className="quest-character-label">{label}</span>
                    <span className="quest-character-note">{note}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {screen === "intro" ? (
            <button type="button" className="quest-primary" onClick={handleStart}>
              Start Quest
            </button>
          ) : (
            <div className="quest-hero-stats">
              <PixelCharacter
                variant={partnerCharacter}
                size={72}
                className="quest-hero-companion"
              />
              <QuestSummary snapshot={progressSnapshot} />
            </div>
          )}
          <QuestLeaderboard
            attempts={attemptCount}
            totalHearts={heartsCollected}
            entries={leaderboardEntries}
          />
        </div>
      </header>

      {screen === "map" && (
        <QuestMap
          progress={progress}
          onSelect={handleSelectEvent}
        />
      )}

      {screen === "game" && activeEvent && (
        <QuestEventPanel
          event={QUEST_EVENTS.find((event) => event.key === activeEvent)!}
          onComplete={handleCompleteEvent}
          onExit={handleReturnToMap}
          playerCharacter={playerCharacter}
          partnerCharacter={partnerCharacter}
        />
      )}

      {screen === "ending" && (
        <div className="quest-ending">
          <h2>Quest Complete!</h2>
          <p>
            All four arcade memories are glowing. Keep replaying, unlock new dialogue,
            and let the credit roll become vows in real life.
          </p>
          <button
            type="button"
            className="quest-secondary"
            onClick={() => {
              setScreen("map");
            }}
          >
            Replay map
          </button>
        </div>
      )}
    </section>
  );
}

export default QuestGame;
