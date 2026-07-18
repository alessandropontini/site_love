import type { CSSProperties, RefObject } from "react";

import { PaperStage } from "@/components/experience/art/PaperArt";
import {
  experienceChapters,
  type ChapterId
} from "@/lib/experienceConfig";

import styles from "./ExperienceShell.module.css";

const nodePositions: Record<ChapterId, { x: string; y: string }> = {
  spark: { x: "19%", y: "67%" },
  coordinates: { x: "42%", y: "48%" },
  promise: { x: "66%", y: "63%" },
  future: { x: "82%", y: "34%" }
};

export function JourneyMap({
  completedCount,
  finaleUnlocked,
  isChapterComplete,
  isChapterUnlocked,
  onOpenChapter,
  onOpenFinale,
  onOpenInventory,
  inventoryTriggerRef
}: {
  completedCount: number;
  finaleUnlocked: boolean;
  isChapterComplete: (chapterId: ChapterId) => boolean;
  isChapterUnlocked: (chapterId: ChapterId) => boolean;
  onOpenChapter: (chapterId: ChapterId) => void;
  onOpenFinale: () => void;
  onOpenInventory: () => void;
  inventoryTriggerRef: RefObject<HTMLButtonElement>;
}) {
  return (
    <section className={styles.mapScreen} aria-labelledby="map-title">
      <div className={styles.mapHeading}>
        <div>
          <span className={styles.kicker}>La città si ricorda</span>
          <h1 id="map-title">Mappa dei ricordi</h1>
        </div>
        <p>
          Segui la strada illuminata. Ogni fermata cambia il mondo e lascia un
          oggetto nello zaino. Completa la tappa disponibile per accendere la
          successiva.
        </p>
      </div>

      <div className={styles.mapWorld}>
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
              strokeDasharray: `${(completedCount / experienceChapters.length) * 100} 100`
            }}
          />
        </svg>

        <ol className={styles.mapNodes}>
          {experienceChapters.map((chapter) => {
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
                      ? "Completata"
                      : unlocked
                        ? "Disponibile"
                        : "Bloccata. Completa prima la tappa precedente"
                  }`}
                >
                  <span className={styles.nodeNumber}>
                    {complete ? "✓" : chapter.number}
                  </span>
                  <span className={styles.nodeLabel}>{chapter.mapLabel}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {finaleUnlocked && (
          <button type="button" className={styles.finaleBeacon} onClick={onOpenFinale}>
            <span aria-hidden="true">♥</span>
            Apri il finale
          </button>
        )}
      </div>

      <nav className={styles.mapDock} aria-label="Azioni della mappa">
        <span className={styles.currentLocation}>
          <span aria-hidden="true">⌖</span>
          Milano, Italia
        </span>
        <button type="button" onClick={onOpenInventory} ref={inventoryTriggerRef}>
          <span aria-hidden="true">▣</span>
          Zaino
          <strong>
            {completedCount}/{experienceChapters.length}
          </strong>
        </button>
      </nav>
    </section>
  );
}
