'use client';

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import type { HeroInvitation3DProps } from "@/components/editorial/HeroInvitation3D";
import { scrollToEditorialSection } from "@/components/editorial/editorialScroll";
import type { EditorialContent } from "@/lib/editorialConfig";
import {
  editorialElementIds,
  editorialSectionIds
} from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";
import { WaterTurtleMark } from "./WaterTurtleMark";

const DynamicInvitation3D = dynamic<HeroInvitation3DProps>(
  () =>
    import("@/components/editorial/HeroInvitation3D").then(
      (module) => module.HeroInvitation3D
    ),
  { ssr: false, loading: () => null }
);

export function HeroInvitation({ content }: { content: EditorialContent }) {
  const [flipped, setFlipped] = useState(false);
  const [webglReady, setWebglReady] = useState(false);
  const posterRef = useRef<HTMLButtonElement>(null);
  const threeControlRef = useRef<HTMLButtonElement | null>(null);
  const markReady = useCallback((threeControl: HTMLButtonElement) => {
    const moveFocus = document.activeElement === posterRef.current;
    threeControlRef.current = threeControl;
    setWebglReady(true);
    if (moveFocus) {
      window.requestAnimationFrame(() => threeControl.focus());
    }
  }, []);
  const markUnavailable = useCallback((threeControl: HTMLButtonElement) => {
    const moveFocus =
      document.activeElement === threeControl ||
      document.activeElement === threeControlRef.current;
    setWebglReady(false);
    if (moveFocus) {
      window.requestAnimationFrame(() => posterRef.current?.focus());
    }
  }, []);

  return (
    <section
      className={styles.hero}
      id={editorialSectionIds.story}
      data-nav-section={editorialSectionIds.story}
      aria-labelledby="editorial-title"
    >
      <div className={styles.heroBackdrop} aria-hidden="true">
        <Image
          src="/scene/paper-theatre/scene-entrance-galleria-v6.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className={styles.heroWash} aria-hidden="true" />
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{content.hero.kicker}</p>
          <h1 id="editorial-title">
            {content.hero.title}
            <em>{content.hero.italicTitle}</em>
          </h1>
          <p className={styles.heroLede}>{content.hero.lede}</p>
          <div className={styles.heroMeta}>
            <span>{content.hero.place}</span>
            <span aria-hidden="true">✦</span>
            <span>{content.hero.date}</span>
          </div>
          <div className={styles.heroActions}>
            <a
              className={styles.primaryAction}
              href={`#${editorialElementIds.storyIntro}`}
              onClick={(event) =>
                scrollToEditorialSection(event, editorialElementIds.storyIntro)
              }
            >
              {content.hero.primaryAction}
              <span aria-hidden="true">↓</span>
            </a>
            <a
              className={styles.textAction}
              href={`#${editorialSectionIds.rsvp}`}
              onClick={(event) =>
                scrollToEditorialSection(event, editorialSectionIds.rsvp)
              }
            >
              {content.hero.secondaryAction}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className={styles.invitationStage}>
          <div className={styles.invitationGlow} aria-hidden="true" />
          <button
            type="button"
            className={`${styles.invitationPoster} ${flipped ? styles.invitationPosterFlipped : ""} ${webglReady ? styles.invitationPosterHidden : ""}`}
            aria-label={`${content.hero.invitationLabel}. ${content.hero.invitationHint}`}
            aria-pressed={flipped}
            onClick={() => setFlipped((current) => !current)}
            aria-hidden={webglReady}
            tabIndex={webglReady ? -1 : 0}
            ref={posterRef}
          >
            <span className={styles.invitationCard}>
              <span className={`${styles.invitationFace} ${styles.invitationFront}`}>
                <span>{content.hero.front.eyebrow}</span>
                <WaterTurtleMark className={styles.invitationTurtleMark} />
                <strong>{content.hero.front.title}</strong>
                <small>{content.hero.front.footnote}</small>
              </span>
              <span className={`${styles.invitationFace} ${styles.invitationBack}`}>
                <span>{content.hero.back.eyebrow}</span>
                <strong>{content.hero.back.title}</strong>
                <span className={styles.invitationBackBody}>
                  {content.hero.back.body}
                </span>
                <small>{content.hero.back.footnote}</small>
              </span>
            </span>
          </button>
          <DynamicInvitation3D
            flipped={flipped}
            front={content.hero.front}
            back={content.hero.back}
            label={content.hero.invitationLabel}
            keyboardHint={content.hero.invitationKeyboardHint}
            onFlippedChange={setFlipped}
            onReady={markReady}
            onUnavailable={markUnavailable}
          />
          <div className={styles.invitationControls}>
            <button
              type="button"
              aria-pressed={!flipped}
              onClick={() => setFlipped(false)}
            >
              <span aria-hidden="true">←</span>
              {content.hero.invitationFrontAction}
            </button>
            <button
              type="button"
              aria-pressed={flipped}
              onClick={() => setFlipped(true)}
            >
              {content.hero.invitationBackAction}
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className={styles.invitationHint}>
            {webglReady
              ? content.hero.invitationHint
              : content.hero.invitationUnavailable}
          </p>
          <p className={styles.srOnly} aria-live="polite">
            {flipped
              ? content.hero.invitationBackStatus
              : content.hero.invitationFrontStatus}
          </p>
        </div>
      </div>
      <div className={styles.storyIntro} id={editorialElementIds.storyIntro}>
        <span aria-hidden="true">01</span>
        <p>{content.hero.back.body}</p>
      </div>
    </section>
  );
}
