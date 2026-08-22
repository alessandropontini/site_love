import Image from "next/image";

import type { EditorialContent } from "@/lib/editorialConfig";
import { editorialSectionIds } from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";

type WeddingVenueProps = {
  content: EditorialContent;
};

export function WeddingVenue({ content }: WeddingVenueProps) {
  const venue = content.venue;

  return (
    <section
      className={styles.venueSection}
      id={editorialSectionIds.venue}
      data-nav-section={editorialSectionIds.venue}
      aria-labelledby="venue-title"
    >
      <div className={styles.venueInner}>
        <header
          className={`${styles.sectionHeader} ${styles.venueHeader}`}
          data-reveal
        >
          <p className={styles.sectionKicker}>{venue.kicker}</p>
          <h2 id="venue-title">{venue.title}</h2>
          <p>{venue.intro}</p>
        </header>

        <div className={styles.venueComposition}>
          <figure className={styles.venueFigure} data-reveal>
            <div className={styles.venueTheatre} aria-hidden="true">
              <Image
                src="/venue/casa-nuova-paper-theatre.png"
                alt=""
                fill
                sizes="(max-width: 900px) 100vw, 58vw"
              />
            </div>
            <figcaption>
              <span>{venue.name}</span>
              <span>{venue.address}</span>
            </figcaption>
          </figure>

          <article className={styles.venueDetails} data-reveal>
            <p className={styles.venueDate}>{venue.date}</p>
            <h3>{venue.name}</h3>
            <address>{venue.address}</address>
            <p className={styles.venueDescription}>{venue.description}</p>

            <ul className={styles.venueFacts}>
              {venue.facts.map((fact, index) => (
                <li key={fact}>
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {fact}
                </li>
              ))}
            </ul>

            <nav className={styles.venueLinks} aria-label={venue.name}>
              <a
                href={venue.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {venue.mapLabel}
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href={venue.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {venue.websiteLabel}
                <span aria-hidden="true">↗</span>
              </a>
              <a
                href={venue.galleryUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {venue.galleryLabel}
                <span aria-hidden="true">↗</span>
              </a>
            </nav>
          </article>
        </div>
      </div>
    </section>
  );
}
