import { QUEST_EVENTS, isEventUnlocked, type EventKey } from "@/components/quest/questSchema";

export function QuestMap({
  progress,
  onSelect
}: {
  progress: Record<EventKey, boolean>;
  onSelect: (key: EventKey) => void;
}) {
  return (
    <section className="quest-map">
      <h2>Quest Timeline</h2>
      <p>
        Follow the glowing route across the map. Each stage unlocks after you clear
        the previous one—collect every heart to reveal the epilogue.
      </p>
      <div className="quest-map-board">
        <svg
          viewBox="0 0 560 180"
          role="presentation"
          aria-hidden="true"
          className="quest-map-path"
        >
          <path
            d="M20 150 C140 80 200 80 310 140 S460 200 540 110"
            stroke="#3a4a7e"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <ul className="quest-map-nodes">
          {QUEST_EVENTS.map((event, index) => {
            const isCleared = progress[event.key];
            const unlocked = isEventUnlocked(event.key, progress);
            const status = isCleared ? "cleared" : unlocked ? "ready" : "locked";
            return (
              <li
                key={event.key}
                data-status={status}
                style={{
                  left: `${12 + index * 24}%`,
                  top: index % 2 === 0 ? "34%" : "62%"
                }}
              >
                <button
                  type="button"
                  onClick={() => unlocked && onSelect(event.key)}
                  disabled={!unlocked}
                >
                  <span className="quest-node-title">{event.title}</span>
                  <span className="quest-node-sub">{event.subtitle}</span>
                  <span className="quest-node-meta">
                    {event.location} · {event.year}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default QuestMap;
