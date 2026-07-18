import Image from "next/image";

import type { ChapterId, ChapterTone } from "@/lib/experienceConfig";

import styles from "./PaperArt.module.css";

type PaperStageVariant = "invitation" | "map" | "chapter" | "finale";

const imageSizes: Record<
  PaperStageVariant,
  { duomo: string; tram: string; couple: string }
> = {
  invitation: {
    duomo: "(max-width: 899px) 79vw, 34vw",
    tram: "(max-width: 899px) 39vw, 17vw",
    couple: "(max-width: 899px) 25vw, 11vw"
  },
  map: {
    duomo: "(max-width: 899px) 65vw, 36vw",
    tram: "(max-width: 899px) 31vw, 19vw",
    couple: "(max-width: 899px) 18vw, 11vw"
  },
  chapter: {
    duomo: "(max-width: 899px) 84vw, 32vw",
    tram: "(max-width: 899px) 38vw, 15vw",
    couple: "(max-width: 899px) 24vw, 10vw"
  },
  finale: {
    duomo: "(max-width: 899px) 70vw, 35vw",
    tram: "0px",
    couple: "(max-width: 899px) 32vw, 15vw"
  }
};

export function PaperStage({
  variant,
  tone = "dawn",
  priority = false,
  chapterId,
  chapterNumber,
  location
}: {
  variant: PaperStageVariant;
  tone?: ChapterTone;
  priority?: boolean;
  chapterId?: ChapterId;
  chapterNumber?: string;
  location?: string;
}) {
  return (
    <div
      className={`${styles.stage} ${styles[variant]}`}
      data-tone={tone}
      data-chapter={chapterId}
      aria-hidden="true"
    >
      <span className={styles.backdrop} />
      <span className={styles.paperMoon} />
      <span className={styles.hangingCloud} />
      <span className={styles.backSkyline} />
      <span className={styles.frontSkyline} />
      <span className={styles.stageRoad} />

      <div className={styles.duomoLayer}>
        <Image
          src="/scene/paper-theatre/duomo-cardboard.webp"
          alt=""
          fill
          priority={priority}
          sizes={imageSizes[variant].duomo}
        />
      </div>

      {variant !== "finale" && (
        <div className={styles.tramLayer}>
          <Image
            src="/scene/paper-theatre/tram-cardboard.webp"
            alt=""
            fill
            sizes={imageSizes[variant].tram}
          />
        </div>
      )}

      <div className={styles.coupleLayer}>
        <Image
          src="/scene/paper-theatre/couple-cardboard.webp"
          alt=""
          fill
          sizes={imageSizes[variant].couple}
        />
      </div>

      {chapterNumber && (
        <span className={styles.actBadge}>
          <small>ATTO</small>
          {chapterNumber}
        </span>
      )}
      {location && <span className={styles.locationTicket}>{location}</span>}

      <span className={styles.footlights} />
      <span className={styles.prosceniumTop} />
      <span className={styles.curtainLeft} />
      <span className={styles.curtainRight} />
    </div>
  );
}

export function PaperSymbol({
  chapterId,
  className
}: {
  chapterId: ChapterId;
  className?: string;
}) {
  const sharedProps = {
    className: `${styles.paperSymbol}${className ? ` ${className}` : ""}`,
    viewBox: "0 0 64 64",
    "data-symbol": chapterId,
    "aria-hidden": true,
    focusable: false
  } as const;
  const board = (
    <path
      className={styles.symbolBoard}
      d="M11 8 51 10 56 48 47 56 10 52 7 17 11 8Z"
    />
  );

  switch (chapterId) {
    case "spark":
      return (
        <svg {...sharedProps}>
          {board}
          <path d="M32 5 38.5 25.5 59 32l-20.5 6.5L32 59l-6.5-20.5L5 32l20.5-6.5L32 5Z" />
          <circle cx="32" cy="32" r="5" />
        </svg>
      );
    case "coordinates":
      return (
        <svg {...sharedProps}>
          {board}
          <path d="M9 17h46v32H9z" />
          <path d="M9 25c5 0 5-8 0-8m46 8c-5 0-5-8 0-8M9 41c5 0 5 8 0 8m46-8c-5 0-5 8 0 8" />
          <path d="M24 23h16M24 32h16M24 41h10" />
        </svg>
      );
    case "promise":
      return (
        <svg {...sharedProps}>
          {board}
          <path d="M8 15h48v34H8z" />
          <path d="m9 17 23 19 23-19M9 48l17-17m29 17L38 31" />
        </svg>
      );
    case "future":
      return (
        <svg {...sharedProps}>
          {board}
          <path d="M12 9h40v46H12z" />
          <path d="M32 9v46M12 32h40" />
          <path d="M25 23c0-5 3-9 7-9s7 4 7 9v2H25v-2Z" />
          <path d="M23 25h18l-3 6H26l-3-6Z" />
        </svg>
      );
  }
}
