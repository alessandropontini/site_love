'use client';

import Image from "next/image";

import { scrollToEditorialSection } from "@/components/editorial/editorialScroll";
import type { EditorialContent } from "@/lib/editorialConfig";
import {
  editorialElementIds,
  editorialSectionIds
} from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";

export function HeroInvitation({ content }: { content: EditorialContent }) {
  return (
    <section
      className={styles.hero}
      id={editorialSectionIds.story}
      data-nav-section={editorialSectionIds.story}
      aria-labelledby="editorial-title"
    >
      <div className={styles.heroBackdrop} aria-hidden="true">
        <Image
          src="/hero/itinerary-tabletop-full.png"
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

      </div>
      <div className={styles.storyIntro} id={editorialElementIds.storyIntro}>
        <span aria-hidden="true">01</span>
        <p>{content.hero.back.body}</p>
      </div>
    </section>
  );
}
