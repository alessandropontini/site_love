import type { CSSProperties, RefObject } from "react";
import Image from "next/image";

import {
  chapterLandmarks,
  PaperStage
} from "@/components/experience/art/PaperArt";
import {
  type ExperienceChapter,
  type ChapterId
} from "@/lib/experienceConfig";
import { useLocale } from "@/components/experience/LocaleProvider";

import styles from "./ExperienceShell.module.css";

const nodePositions: Record<ChapterId, { x: string; y: string }> = {
  spark: { x: "19%", y: "67%" },
  coordinates: { x: "42%", y: "48%" },
  promise: { x: "66%", y: "63%" },
  future: { x: "82%", y: "34%" }
};

export function JourneyMap({
  chapters,
  completedCount,
  finaleUnlocked,
  isChapterComplete,
  isChapterUnlocked,
  onOpenChapter,
  onOpenFinale,
  onOpenInventory,
  inventoryTriggerRef
}: {
  chapters: ExperienceChapter[];
  completedCount: number;
  finaleUnlocked: boolean;
  isChapterComplete: (chapterId: ChapterId) => boolean;
  isChapterUnlocked: (chapterId: ChapterId) => boolean;
  onOpenChapter: (chapterId: ChapterId) => void;
  onOpenFinale: () => void;
  onOpenInventory: () => void;
  inventoryTriggerRef: RefObject<HTMLButtonElement>;
}) {
  const { messages: copy } = useLocale();

  return (
    <section className={styles.mapScreen} aria-labelledby="map-title">
      <div className={styles.mapHeading}>
        <div>
          <span className={styles.kicker}>{copy.map.kicker}</span>
          <h1 id="map-title">{copy.map.title}</h1>
        </div>
        <p>{copy.map.description}</p>
      </div>

      <nav className={styles.mapWorld} aria-label={copy.map.title}>
        <PaperStage variant="map" tone="night" />

        <svg className={styles.journeyPath} viewBox="0 0 1000 560" aria-hidden="true">
          <path
            className={styles.pathBase}
            d="M80 450 C170 390 220 400 280 330 S390 210 485 290 S650 450 720 320 S810 145 930 160"
            pathLength="100"
          />
          <path
            className={styles.pathProgress}
            d="M80 450 C170 390 220 400 280 330 S390 210 485 290 S650 450 720 320 S810 145 930 160"
            pathLength="100"
            style={{
              strokeDasharray: `${(completedCount / chapters.length) * 100} 100`
            }}
          />
        </svg>

        <ol className={styles.mapNodes}>
          {chapters.map((chapter) => {
            const complete = isChapterComplete(chapter.id);
            const unlocked = isChapterUnlocked(chapter.id);
            const position = nodePositions[chapter.id];
            const nodeStyle = {
              "--node-x": position.x,
              "--node-y": position.y
            } as CSSProperties;

            return (
              <li
                key={chapter.id}
                className={styles.mapNode}
                data-status={complete ? "complete" : unlocked ? "available" : "locked"}
                style={nodeStyle}
              >
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onOpenChapter(chapter.id)}
                  aria-current={!complete && unlocked ? "step" : undefined}
                  aria-label={`${chapter.number}. ${chapter.mapLabel}. ${
                    complete
                      ? copy.map.complete
                      : unlocked
                        ? copy.map.available
                        : `${copy.map.locked}. ${copy.map.lockedDetail}`
                  }`}
                >
                  <span className={styles.nodeScene} aria-hidden="true">
                    <Image
                      src={chapterLandmarks[chapter.id]}
                      alt=""
                      fill
                      sizes="72px"
                    />
                  </span>
                  <span className={styles.nodeNumber}>
                    {complete ? "✓" : chapter.number}
                  </span>
                  <span className={styles.nodeLabel}>
                    <span>{chapter.mapLabel}</span>
                    <span className={styles.nodeStatus}>
                      {complete
                        ? copy.map.complete
                        : unlocked
                          ? copy.map.available
                          : copy.map.locked}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {finaleUnlocked && (
          <button type="button" className={styles.finaleBeacon} onClick={onOpenFinale}>
            <span aria-hidden="true">♥</span>
            {copy.map.openFinale}
          </button>
        )}
      </nav>

      <nav className={styles.mapDock} aria-label={copy.map.actions}>
        <span className={styles.currentLocation}>
          <span aria-hidden="true">⌖</span>
          {copy.map.location}
        </span>
        <button type="button" onClick={onOpenInventory} ref={inventoryTriggerRef}>
          <span aria-hidden="true">▣</span>
          {copy.map.inventory}
          <strong>
            {completedCount}/{chapters.length}
          </strong>
        </button>
      </nav>
    </section>
  );
}
