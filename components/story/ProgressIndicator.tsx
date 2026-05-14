import { gameLabels, gameOrder, type GameId } from "@/lib/storyConfig";

import styles from "./StoryShell.module.css";

type ProgressIndicatorProps = {
  completedCount: number;
  totalGames: number;
  isGameComplete: (gameId: GameId) => boolean;
  isGameUnlocked: (gameId: GameId) => boolean;
};

export function ProgressIndicator({
  completedCount,
  totalGames,
  isGameComplete,
  isGameUnlocked
}: ProgressIndicatorProps) {
  return (
    <aside className={styles.progress} aria-label="Story progress">
      <div>
        <span className={styles.progressLabel}>Progress</span>
        <strong>
          {completedCount}/{totalGames}
        </strong>
      </div>
      <ol className={styles.progressSteps}>
        {gameOrder.map((gameId, index) => {
          const complete = isGameComplete(gameId);
          const status = complete ? "complete" : isGameUnlocked(gameId) ? "available" : "locked";
          const statusLabel =
            status === "complete"
              ? "complete"
              : status === "available"
                ? "available/current"
                : "locked";

          return (
            <li key={gameId}>
              <span
                className={styles.progressDot}
                data-status={status}
                aria-label={`${gameLabels[gameId]} ${statusLabel}`}
                title={`${gameLabels[gameId]}: ${statusLabel}`}
              >
                {index + 1}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
