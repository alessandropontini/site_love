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
          className={`${styles.sectionHeaderWide} ${styles.venueHeader}`}
          data-reveal
        >
          <div>
            <p className={styles.sectionKicker}>{venue.kicker}</p>
            <h2 id="venue-title">{venue.title}</h2>
          </div>
          <div><p>{venue.intro}</p></div>
        </header>

        <div className={styles.venueComposition}>
          <figure className={styles.venueFigure} data-reveal>
            <div className={styles.venuePhotography}>
              <div className={`${styles.venuePhoto} ${styles.venuePhotoMain}`}>
                <Image
                  src="/venue/casa-nuova-garden-ceremony.jpg"
                  alt={venue.photos.gardenAlt}
                  fill
                  sizes="(max-width: 900px) 100vw, 58vw"
                />
              </div>
              <div
                className={`${styles.venuePhoto} ${styles.venuePhotoPorticoGarden}`}
              >
                <Image
                  src="/venue/casa-nuova-portico-garden.jpg"
                  alt={venue.photos.porticoGardenAlt}
                  fill
                  sizes="(max-width: 900px) 100vw, 58vw"
                />
              </div>
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
