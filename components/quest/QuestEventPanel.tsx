import { useMemo } from "react";

import type { PixelCharacterVariant } from "@/components/pixel/PixelCharacter";
import type { QuestEvent, EventKey } from "@/components/quest/questSchema";

type QuestEventPanelProps = {
  event: QuestEvent;
  onComplete: (key: EventKey, hearts: number) => void;
  onExit: () => void;
  playerCharacter: PixelCharacterVariant;
};

export function QuestEventPanel({
  event,
  onComplete,
  onExit,
  playerCharacter
}: QuestEventPanelProps) {
  const hint = useMemo(() => {
    switch (event.key) {
      case "tetris":
        return "Arrow keys move the falling block. Fill the highlighted column to drop a heart.";
      case "pacmaze":
        return "Use arrow keys to collect hearts. Avoid the neon doubts chasing you.";
      case "flappy":
        return "Tap or press space to keep love letters afloat through the skyline gaps.";
      case "platformer":
        return "Press space to jump, hold to glide a little longer. Collect every vow coin.";
      default:
        return "Have fun!";
    }
  }, [event.key]);

  return (
    <section
      className="quest-event-panel"
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
          <button type="button" className="quest-secondary" onClick={onExit}>
            Back to map
          </button>
        </div>
      </header>

      <p className="quest-event-description">{event.description}</p>
      <p className="quest-event-hint">{hint}</p>

      <div className="quest-event-game">
        {event.render({
          onComplete: (hearts) => onComplete(event.key, hearts),
          onExit,
          rewardHearts: event.rewardHearts,
          playerCharacter
        })}
      </div>
    </section>
  );
}

export default QuestEventPanel;
