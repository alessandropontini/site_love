import type { PixelCharacterVariant } from "@/components/pixel/PixelCharacter";
import type { EventKey } from "@/components/quest/questSchema";

export type QuestLeaderboardEntry = {
  id: number;
  eventKey: EventKey;
  eventTitle: string;
  hearts: number;
  character: PixelCharacterVariant;
  completedAt: number;
};

export function QuestLeaderboard({
  attempts,
  totalHearts,
  entries
}: {
  attempts: number;
  totalHearts: number;
  entries: QuestLeaderboardEntry[];
}) {
  const hasEntries = entries.length > 0;
  const topEntries = entries.slice(0, 4);

  return (
    <section className="quest-leaderboard" aria-live="polite">
      <header>
        <div>
          <span className="quest-leaderboard-label">Runs logged</span>
          <strong>{attempts}</strong>
        </div>
        <div>
          <span className="quest-leaderboard-label">Hearts banked</span>
          <strong>{totalHearts}</strong>
        </div>
      </header>
      {hasEntries ? (
        <ol>
          {topEntries.map((entry, index) => {
            const placement = index + 1;
            const date = new Date(entry.completedAt);
            const formatted = date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric"
            });
            return (
              <li key={entry.id}>
                <span className="quest-leaderboard-rank">{placement}.</span>
                <div className="quest-leaderboard-details">
                  <span className="quest-leaderboard-event">{entry.eventTitle}</span>
                  <span className="quest-leaderboard-meta">
                    {entry.character === "alessandro" ? "Alessandro" : "Bridget"} · {formatted}
                  </span>
                </div>
                <span className="quest-leaderboard-score">
                  {entry.hearts} <span>pts</span>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="quest-leaderboard-empty">
          No runs logged yet—pick a stage and let the love story scoreboards glow.
        </p>
      )}
    </section>
  );
}

export default QuestLeaderboard;
