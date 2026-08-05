'use client';

import { useState } from "react";

import { PaperStage, PaperSymbol } from "@/components/experience/art/PaperArt";
import { CoordinatesChallenge } from "@/components/experience/challenges/CoordinatesChallenge";
import { FrequencyChallenge } from "@/components/experience/challenges/FrequencyChallenge";
import { TimelineChallenge } from "@/components/experience/challenges/TimelineChallenge";
import { WindowsChallenge } from "@/components/experience/challenges/WindowsChallenge";
import { useLocale } from "@/components/experience/LocaleProvider";
import type { ExperienceChapter } from "@/lib/experienceConfig";

import styles from "./ExperienceShell.module.css";

export function ChapterExperience({
  chapter,
  completed,
  motionEnabled,
  onBack,
  onComplete
}: {
  chapter: ExperienceChapter;
  completed: boolean;
  motionEnabled: boolean;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [replaying, setReplaying] = useState(false);
  const { messages: copy } = useLocale();
  const showChallenge = !completed || replaying;
  const showTestCompletion = process.env.NODE_ENV !== "production";

  const challenge = (() => {
    switch (chapter.id) {
      case "spark":
        return <FrequencyChallenge onComplete={onComplete} />;
      case "coordinates":
        return <CoordinatesChallenge onComplete={onComplete} />;
      case "promise":
        return <TimelineChallenge onComplete={onComplete} />;
      case "future":
        return <WindowsChallenge motionEnabled={motionEnabled} onComplete={onComplete} />;
    }
  })();

  return (
    <section
      className={styles.chapterScreen}
      data-tone={chapter.tone}
      data-chapter={chapter.id}
      aria-labelledby="chapter-title"
    >
      <button type="button" className={styles.backButton} onClick={onBack}>
        <span aria-hidden="true">←</span>
        {copy.common.map}
      </button>

      <div className={styles.chapterBook}>
        <div className={styles.chapterCover} aria-hidden="true">
          <span>{copy.common.act}</span>
          <strong>{chapter.number}</strong>
          <em>{chapter.title}</em>
        </div>

        <div className={styles.chapterVisual} aria-hidden="true">
          <div className={styles.chapterStageFrame}>
            <PaperStage
              variant="chapter"
              tone={chapter.tone}
              chapterId={chapter.id}
              chapterNumber={chapter.number}
              location={chapter.location}
              actLabel={copy.common.act}
            />
          </div>
        </div>

        <div className={styles.chapterContent}>
          <header className={styles.chapterIntro}>
            <span className={styles.kicker}>{chapter.eyebrow}</span>
            <h1 id="chapter-title">{chapter.title}</h1>
            <p>{chapter.description}</p>
            <span className={styles.instruction}>
              <span aria-hidden="true">✦</span>
              {chapter.instruction}
            </span>
          </header>

          {showChallenge ? (
            <div className={styles.challengeSlot}>
              {challenge}
              {showTestCompletion && (
                <aside className={styles.testCompletion}>
                  <span>{copy.chapter.testOnly}</span>
                  <button type="button" onClick={onComplete}>
                    {copy.chapter.testComplete}
                    <span aria-hidden="true">↠</span>
                  </button>
                </aside>
              )}
            </div>
          ) : (
            <div className={styles.revisitPanel}>
              <span aria-hidden="true">
                <PaperSymbol chapterId={chapter.id} />
              </span>
              <div>
                <h2>{copy.chapter.collectedTitle}</h2>
                <p>{copy.chapter.collectedBody(chapter.reward.title)}</p>
              </div>
              <button type="button" className={styles.secondaryButton} onClick={() => setReplaying(true)}>
                {copy.chapter.replay}
              </button>
              <button type="button" className={styles.primaryButton} onClick={onBack}>
                {copy.chapter.backToMap}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
