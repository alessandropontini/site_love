'use client';

import { useMemo, useState } from "react";

import { PixelCharacter } from "@/components/pixel/PixelCharacter";
import { QuestEventPanel } from "@/components/quest/QuestEventPanel";
import { QuestMap } from "@/components/quest/QuestMap";
import { QuestSummary } from "@/components/quest/QuestSummary";
import {
  EventKey,
  QUEST_EVENTS,
  type QuestProgressSnapshot
} from "@/components/quest/questSchema";

type ScreenState = "intro" | "map" | "game" | "ending";

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

  const handleStart = () => {
    setScreen("map");
  };

  const handleSelectEvent = (eventKey: EventKey) => {
    setActiveEvent(eventKey);
    setScreen("game");
  };

  const handleCompleteEvent = (eventKey: EventKey, heartsEarned: number) => {
    setProgress((prev) => {
      const snapshot = { ...prev, [eventKey]: true };
      const finished = QUEST_EVENTS.every((event) => snapshot[event.key]);
      setScreen(finished ? "ending" : "map");
      return snapshot;
    });
    setHeartsCollected((prev) => prev + heartsEarned);
    setActiveEvent(null);
  };

  const handleReturnToMap = () => {
    setActiveEvent(null);
    setScreen("map");
  };

  return (
    <section className="quest-shell">
      <header className="quest-hero">
        <PixelCharacter variant="alessandro" />
        <div className="quest-hero-copy">
          <p className="quest-prelude">A pixel tale</p>
          <h1>
            The Story of <span>Alessandro</span> & <span>Bridget</span>
          </h1>
          <p>
            Press start to hop onto the nostalgia trail. Each retro mini-game
            unlocks a slice of our story—from rooftop starts to forever vows.
          </p>
          {screen === "intro" ? (
            <button type="button" className="quest-primary" onClick={handleStart}>
              Start Quest
            </button>
          ) : (
            <div className="quest-hero-stats">
              <PixelCharacter variant="bridget" />
              <QuestSummary snapshot={progressSnapshot} />
            </div>
          )}
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
