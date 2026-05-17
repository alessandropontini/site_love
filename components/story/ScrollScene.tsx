import type { ReactNode } from "react";

import type { StoryChapter } from "@/lib/storyConfig";

import styles from "./StoryShell.module.css";

type ScrollSceneProps = {
  chapter: StoryChapter;
  children?: ReactNode;
  locked?: boolean;
  complete?: boolean;
};

export function ScrollScene({
  chapter,
  children,
  locked = false,
  complete = false
}: ScrollSceneProps) {
  return (
    <section
      className={styles.scene}
      data-tone={chapter.tone}
      data-locked={locked}
      data-complete={complete}
      id={chapter.id}
      aria-labelledby={`${chapter.id}-title`}
      aria-describedby={locked ? `${chapter.id}-locked-note` : undefined}
    >
      <div className={styles.sceneVisual} aria-hidden="true">
        <div className={styles.orbit}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.placeCard}>
          <span>{chapter.place}</span>
          <strong>{chapter.year}</strong>
        </div>
      </div>

      <div className={styles.sceneCopy}>
        <span className={styles.eyebrow}>{chapter.eyebrow}</span>
        <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>
        <p>
          {locked
            ? "This chapter is still locked. Complete the required mini-game to continue the route."
            : chapter.body}
        </p>
        {locked && (
          <p className={styles.lockedNote} id={`${chapter.id}-locked-note`}>
            Complete the previous mini-game to unlock this chapter.
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
