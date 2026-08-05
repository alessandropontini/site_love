import type { ExperienceChapter } from "@/lib/experienceConfig";
import { PaperSymbol } from "@/components/experience/art/PaperArt";
import { useLocale } from "@/components/experience/LocaleProvider";

import styles from "./ExperienceShell.module.css";

export function RewardScene({
  chapter,
  onContinue
}: {
  chapter: ExperienceChapter;
  onContinue: () => void;
}) {
  const { messages: copy } = useLocale();

  return (
    <section
      className={styles.rewardScreen}
      data-tone={chapter.tone}
      aria-labelledby="reward-title"
    >
      <div className={styles.rewardGlow} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={styles.rewardCard}>
        <span className={styles.kicker}>{copy.reward.kicker}</span>
        <div className={styles.rewardObject} aria-hidden="true">
          <PaperSymbol chapterId={chapter.id} />
        </div>
        <h1 id="reward-title">{chapter.reward.title}</h1>
        <p>{chapter.reward.description}</p>
        <div className={styles.rewardStamp}>
          <span>
            {copy.reward.stop} {chapter.number}
          </span>
          <strong>{copy.reward.complete}</strong>
        </div>
        <button type="button" className={styles.primaryButton} onClick={onContinue}>
          {copy.reward.continue}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
