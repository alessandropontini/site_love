'use client';

import { useRef } from "react";

import type { EditorialContent } from "@/lib/editorialConfig";
import { editorialSectionIds } from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";
import { WaterTurtleMark } from "./WaterTurtleMark";

export function FinalLetter({ content }: { content: EditorialContent }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const openLetter = (trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    dialogRef.current?.showModal();
  };

  const closeLetter = () => {
    dialogRef.current?.close();
  };

  return (
    <section
      className={styles.letterSection}
      id={editorialSectionIds.letter}
      data-nav-section={editorialSectionIds.letter}
      aria-labelledby="letter-section-title"
    >
      <div className={styles.letterCopy} data-reveal>
        <p className={styles.sectionKicker}>{content.letter.kicker}</p>
        <h2 id="letter-section-title">{content.letter.title}</h2>
        <p>{content.letter.intro}</p>
        <button
          type="button"
          className={styles.letterOpenButton}
          onClick={(event) => openLetter(event.currentTarget)}
          ref={triggerRef}
        >
          {content.letter.open}
          <span aria-hidden="true">↘</span>
        </button>
      </div>

      <button
        type="button"
        className={styles.envelope}
        onClick={(event) => openLetter(event.currentTarget)}
        aria-label={content.letter.open}
      >
        <span className={styles.envelopeFlap} aria-hidden="true" />
        <WaterTurtleMark className={styles.envelopeTurtleMark} />
        <span>{content.letter.envelopeFront}</span>
        <small>{content.letter.envelopeBack}</small>
      </button>

      <dialog
        className={styles.letterDialog}
        ref={dialogRef}
        aria-labelledby="letter-dialog-title"
        aria-label={content.letter.dialogLabel}
        onClose={() => (lastTriggerRef.current ?? triggerRef.current)?.focus()}
        onCancel={(event) => {
          event.preventDefault();
          closeLetter();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeLetter();
          }
        }}
      >
        <article className={styles.letterPaper}>
          <button
            type="button"
            className={styles.dialogClose}
            onClick={closeLetter}
            aria-label={content.letter.close}
          >
            <span aria-hidden="true">×</span>
          </button>
          <p className={styles.sectionKicker}>{content.letter.kicker}</p>
          <h2 id="letter-dialog-title">{content.letter.letterTitle}</h2>
          {content.letter.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className={styles.letterQuestion}>{content.letter.question}</p>
          <div className={styles.letterDialogActions}>
            <button type="button" onClick={closeLetter}>
              {content.letter.close}
            </button>
          </div>
        </article>
      </dialog>
    </section>
  );
}
