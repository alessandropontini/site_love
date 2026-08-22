import Image from "next/image";

import type { EditorialContent } from "@/lib/editorialConfig";
import {
  editorialElementIds,
  editorialSectionIds
} from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";

export function RelationshipTimeline({
  content
}: {
  content: EditorialContent;
}) {
  return (
    <section
      className={styles.timelineSection}
      id={editorialElementIds.timeline}
      data-nav-section={editorialSectionIds.story}
      aria-labelledby="timeline-title"
    >
      <header className={styles.sectionHeader} data-reveal>
        <p className={styles.sectionKicker}>{content.timeline.kicker}</p>
        <h2 id="timeline-title">{content.timeline.title}</h2>
        <p>{content.timeline.intro}</p>
      </header>

      <ol className={styles.timelineList}>
        {content.timeline.items.map((item, index) => (
          <li
            className={styles.timelineItem}
            data-tone={item.tone}
            data-reveal
            key={item.id}
          >
            <div className={styles.timelineRail} aria-hidden="true">
              <span>{item.number}</span>
            </div>
            <div className={styles.timelineImage}>
              <Image
                src={item.image.src}
                alt={item.imageAlt}
                fill
                loading="lazy"
                sizes="(max-width: 767px) 92vw, (max-width: 1199px) 56vw, 46vw"
              />
              <span className={styles.timelineImageNumber} aria-hidden="true">
                0{index + 1}
              </span>
            </div>
            <article className={styles.timelineCopy}>
              <p className={styles.timelinePeriod}>{item.period}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className={styles.timelineFoot}>
                <span>{item.location}</span>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
