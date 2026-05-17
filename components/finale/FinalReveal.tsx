import styles from "@/components/story/StoryShell.module.css";

type FinalRevealProps = {
  unlocked: boolean;
  onReset: () => void;
};

export function FinalReveal({ unlocked, onReset }: FinalRevealProps) {
  return (
    <div className={styles.finalReveal} data-unlocked={unlocked}>
      <span className={styles.eyebrow}>{unlocked ? "Unlocked" : "Locked"}</span>
      <h2>{unlocked ? "The next chapter is ours" : "The finale is still sealed"}</h2>
      <p>
        {unlocked
          ? "Every clue, choice, and small challenge points to the same reveal: the story keeps going because you keep choosing it together."
          : "Complete all four mini-games to open the final reveal. The ending should feel earned, not skipped."}
      </p>
      {unlocked && (
        <div className={styles.promiseBox}>
          <strong>Alessandro & Bridget</strong>
          <span>Continue?</span>
          <button type="button" onClick={onReset} aria-label="Replay the full story journey">
            Replay the journey
          </button>
        </div>
      )}
    </div>
  );
}
