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
            <div className={styles.venueIllustration} aria-hidden="true">
              <svg
                className={styles.venueSketch}
                viewBox="0 0 920 700"
                fill="none"
                focusable="false"
              >
                <path
                  className={styles.venueHillBack}
                  d="M-20 316c105-72 213-100 326-71 54 14 91 16 146-7 99-42 213-19 310 50 55 39 110 51 181 40"
                />
                <path
                  className={styles.venueHillFront}
                  d="M-30 372c131-46 236-31 327 10 72 33 139 34 223 5 111-38 238-41 430 31"
                />
                <path
                  className={styles.venueBuildingFill}
                  d="M180 329 460 190l282 139v229H180V329Z"
                />
                <path
                  className={styles.venueLine}
                  d="m146 347 314-157 315 157M180 329v229h562V329M239 299v-60h74v23M608 263v-82h62v113"
                />
                <path
                  className={styles.venueLine}
                  d="M229 558V406h462v152M229 406h462M274 558V454M367 558V454M460 558V454M553 558V454M646 558V454"
                />
                <path
                  className={styles.venueArch}
                  d="M274 454c0-38 23-62 46-62s47 24 47 62M367 454c0-38 23-62 46-62s47 24 47 62M460 454c0-38 23-62 46-62s47 24 47 62M553 454c0-38 23-62 46-62s47 24 47 62"
                />
                <path
                  className={styles.venueLineFine}
                  d="M206 361h508M405 266h110v73H405zM434 266v73M486 266v73M405 302h110"
                />
                <path
                  className={styles.venueTreeFill}
                  d="M95 523c-20-18-11-42 10-48-16-28 7-62 38-53 5-34 52-43 68-12 32-8 53 29 36 54 29 13 25 52-6 65H95Z"
                />
                <path
                  className={styles.venueLine}
                  d="M169 454v159M138 500l31 31 38-44M794 443v170M766 493l28 28 31-37"
                />
                <path
                  className={styles.venueTreeFill}
                  d="M744 512c-19-19-7-45 15-50-13-26 9-56 36-47 9-32 53-37 67-7 27-6 48 24 34 49 27 11 28 47 0 60H744Z"
                />
                <path
                  className={styles.venueGroundLine}
                  d="M52 614c171-22 286-16 414 2 134 19 247 16 405-7M109 649c119-15 215-11 326 4 100 14 212 12 337-5"
                />
              </svg>
              <span className={styles.venueSun} />
              <span className={styles.venueDateStamp}>{venue.date}</span>
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

            <p className={styles.venuePhotoNote}>{venue.photoNote}</p>

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
