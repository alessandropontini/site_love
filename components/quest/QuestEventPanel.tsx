import { useEffect, useMemo, useRef } from "react";

import {
  PixelCharacter,
  type PixelCharacterVariant
} from "@/components/pixel/PixelCharacter";
import { initCheer, setCharacter, startCheer, stopCheer } from "@/components/quest/cheer";
import type { QuestEvent, EventKey } from "@/components/quest/questSchema";

type QuestEventPanelProps = {
  event: QuestEvent;
  onComplete: (key: EventKey, hearts: number) => void;
  onExit: () => void;
  playerCharacter: PixelCharacterVariant;
  partnerCharacter: PixelCharacterVariant;
};

export function QuestEventPanel({
  event,
  onComplete,
  onExit,
  playerCharacter,
  partnerCharacter
}: QuestEventPanelProps) {
  const devSkipEnabled =
    typeof process !== "undefined" &&
    (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEV_SKIP === "true");

  const hint = useMemo(() => {
    switch (event.key) {
      case "tetris":
        return "← → move, ↑ rotates, space hard-drops. Stack 50 hearts like true Tetris.";
      case "pacmaze":
        return "Hold the arrows to glide—doubts only move every third beat and hearts stay banked.";
      case "flappy":
        return "Tap or press space to keep love letters afloat through the skyline gaps.";
      case "platformer":
        return "Tap space to jump, tap again mid-air for a boost, hold to glide. Collect every vow coin.";
      default:
        return "Have fun!";
    }
  }, [event.key]);

  const cheerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = cheerRef.current;
    if (!container) return;
    initCheer(container, partnerCharacter);
    setCharacter(partnerCharacter);
    startCheer();
    return () => {
      stopCheer();
    };
  }, [partnerCharacter]);

  const handleComplete = (hearts: number) => {
    stopCheer();
    onComplete(event.key, hearts);
  };

  const handleExit = () => {
    stopCheer();
    onExit();
  };

  return (
    <section
      className="quest-event-panel"
      id="quest-event-panel"
      data-player={playerCharacter}
      style={{
        borderColor: event.accent,
        background: `linear-gradient(160deg, ${event.color}33, rgba(8,10,22,0.85))`
      }}
    >
      <header className="quest-event-header">
        <div>
          <span>{event.subtitle}</span>
          <h2>{event.title}</h2>
        </div>
        <div className="quest-event-meta">
          <span>
            Avatar: {playerCharacter === "alessandro" ? "Alessandro" : "Bridget"}
          </span>
          <span>
            {event.location} · {event.year}
          </span>
          <button type="button" className="quest-secondary" onClick={handleExit}>
            Back to map
          </button>
          {devSkipEnabled && (
            <button
              type="button"
              className="quest-dev-button"
              onClick={() => {
                stopCheer();
                onComplete(event.key, event.rewardHearts);
              }}
            >
              Skip (DEV)
            </button>
          )}
        </div>
      </header>

      <div className="quest-event-copy">
        <p className="quest-event-description">{event.description}</p>
        <p className="quest-event-hint">{hint}</p>
      </div>

      <div className="quest-event-stage">
        <div className="quest-event-game">
          <div className="game-shell">
            {event.render({
              onComplete: (hearts) => handleComplete(hearts),
              onExit: handleExit,
              rewardHearts: event.rewardHearts,
              playerCharacter,
              partnerCharacter
            })}
          </div>
        </div>
        <div className="quest-event-cheer" ref={cheerRef}>
          <PixelCharacter variant={partnerCharacter} size={84} className="quest-cheer-sprite" />
          <span data-cheer-line>
            {partnerCharacter === "alessandro" ? "Alessandro" : "Bridget"} says: Vai amore!
          </span>
        </div>
      </div>
    </section>
  );
}

export default QuestEventPanel;
