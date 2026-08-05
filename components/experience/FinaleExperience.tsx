'use client';

import { useEffect, useRef, useState } from "react";

import { PaperStage, PaperSymbol } from "@/components/experience/art/PaperArt";
import { useLocale } from "@/components/experience/LocaleProvider";
import { getExperienceChapters } from "@/lib/experienceConfig";

import styles from "./ExperienceShell.module.css";

export function FinaleExperience({
  onBack,
  onReplay
}: {
  onBack: () => void;
  onReplay: () => void;
}) {
  const [letterOpen, setLetterOpen] = useState(false);
  const [confirmReplay, setConfirmReplay] = useState(false);
  const { locale, messages: copy } = useLocale();
  const experienceChapters = getExperienceChapters(locale);
  const letterTitleRef = useRef<HTMLHeadingElement>(null);
  const replayTriggerRef = useRef<HTMLButtonElement>(null);

  const cancelReplay = () => {
    setConfirmReplay(false);
    window.requestAnimationFrame(() => replayTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!letterOpen) return;
    window.requestAnimationFrame(() => letterTitleRef.current?.focus());
  }, [letterOpen]);

  return (
    <section className={styles.finaleScreen} aria-labelledby="finale-title">
      <button type="button" className={styles.backButton} onClick={onBack}>
        <span aria-hidden="true">←</span>
        {copy.common.map}
      </button>

      {!letterOpen ? (
        <div className={styles.finaleAssembly}>
          <div className={styles.finalSky} aria-hidden="true">
            <PaperStage variant="finale" tone="night" />
          </div>
          <span className={styles.kicker}>{copy.finale.kicker}</span>
          <h1 id="finale-title">{copy.finale.title}</h1>
          <p>{copy.finale.description}</p>
          <div
            className={styles.assemblyObjects}
            role="list"
            aria-label={copy.finale.collected}
          >
            {experienceChapters.map((chapter) => (
              <span
                key={chapter.id}
                role="listitem"
              >
                <PaperSymbol chapterId={chapter.id} />
                <span className={styles.srOnly}>{chapter.reward.title}</span>
              </span>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.envelopeButton} ${styles.primaryButton}`}
            onClick={() => setLetterOpen(true)}
          >
            <span aria-hidden="true">✉</span>
            {copy.finale.openLetter}
          </button>
        </div>
      ) : (
        <div className={styles.openLetter}>
          <div className={styles.letterCouple} aria-hidden="true">
            <PaperStage variant="finale" tone="night" />
          </div>
          <span className={styles.kicker}>Alessandro &amp; Bridget</span>
          <h1 id="finale-title" ref={letterTitleRef} tabIndex={-1}>
            {copy.finale.letterTitle}
          </h1>
          <div className={styles.letterBody}>
            <p>{copy.finale.letterParagraphOne}</p>
            <p>{copy.finale.letterParagraphTwo}</p>
            <strong>{copy.finale.question}</strong>
          </div>
          <div className={styles.finaleActions}>
            <button type="button" className={styles.secondaryButton} onClick={onBack}>
              {copy.finale.reviewMap}
            </button>
            {!confirmReplay ? (
              <button
                type="button"
                className={styles.textButton}
                ref={replayTriggerRef}
                onClick={() => setConfirmReplay(true)}
              >
                {copy.finale.restart}
              </button>
            ) : (
              <div
                className={styles.replayConfirm}
                role="group"
                aria-label={copy.finale.confirmGroup}
              >
                <span>{copy.finale.confirm}</span>
                <button type="button" className={styles.textButton} onClick={cancelReplay} autoFocus>
                  {copy.common.cancel}
                </button>
                <button type="button" className={styles.primaryButton} onClick={onReplay}>
                  {copy.finale.confirmAction}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
