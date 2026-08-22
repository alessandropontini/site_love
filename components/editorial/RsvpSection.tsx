import Image from "next/image";

import type { EditorialContent } from "@/lib/editorialConfig";
import { editorialSectionIds } from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";
import { WaterTurtleMark } from "./WaterTurtleMark";

type RsvpSectionProps = {
  content: EditorialContent;
};

export function RsvpSection({ content }: RsvpSectionProps) {
  const rsvp = content.rsvp;

  return (
    <section
      className={styles.rsvpSection}
      id={editorialSectionIds.rsvp}
      data-nav-section={editorialSectionIds.rsvp}
      aria-labelledby="rsvp-title"
    >
      <div className={styles.rsvpInner}>
        <header className={styles.rsvpHeader} data-reveal>
          <p className={styles.sectionKicker}>{rsvp.kicker}</p>
          <h2 id="rsvp-title">{rsvp.title}</h2>
          <p>{rsvp.intro}</p>
          <p className={styles.rsvpStatus}>
            <span>{rsvp.statusLabel}</span>
            <strong>{rsvp.status}</strong>
          </p>
        </header>

        <div className={styles.rsvpCard} data-reveal>
          <div className={styles.rsvpQrColumn}>
            <div className={styles.rsvpArtwork} aria-hidden="true">
              <Image
                alt=""
                fill
                priority={false}
                sizes="(max-width: 780px) calc(100vw - 68px), 390px"
                src="/rsvp/turtle-paper-rsvp.png"
              />
            </div>
            <WaterTurtleMark className={styles.rsvpTurtle} />
          </div>

          <div className={styles.rsvpDetails}>
            <p className={styles.rsvpEyebrow}>{rsvp.statusLabel}</p>
            <h3>{rsvp.householdTitle}</h3>
            <p>{rsvp.householdBody}</p>

            <ol className={styles.rsvpSteps}>
              {rsvp.steps.map((step, index) => (
                <li key={step}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>

            <p className={styles.rsvpNote}>{rsvp.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
