import Image from "next/image";

import type { EditorialContent, GalleryItem } from "@/lib/editorialConfig";
import { editorialSectionIds } from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";

function GalleryFigure({ item, index }: { item: GalleryItem; index: number }) {
  return (
    <figure
      className={styles.galleryFigure}
      data-aspect={item.aspect}
      data-tone={item.tone}
      style={{ "--gallery-index": index } as React.CSSProperties}
    >
      <div className={styles.galleryMedia}>
        {item.src ? (
          <Image
            src={item.src}
            alt={item.alt ?? ""}
            fill
            loading="lazy"
            sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 30vw"
            style={item.position ? { objectPosition: item.position } : undefined}
          />
        ) : (
          <div
            className={styles.photoPlaceholder}
            role="img"
            aria-label={item.placeholder}
          >
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.placeholder}</strong>
            <i aria-hidden="true" />
          </div>
        )}
      </div>
      <figcaption>{item.caption}</figcaption>
    </figure>
  );
}

export function PhotoGallery({ content }: { content: EditorialContent }) {
  return (
    <section
      className={styles.gallerySection}
      id={editorialSectionIds.photos}
      data-nav-section={editorialSectionIds.photos}
      aria-labelledby="gallery-title"
    >
      <header className={styles.sectionHeaderWide} data-reveal>
        <div>
          <p className={styles.sectionKicker}>{content.gallery.kicker}</p>
          <h2 id="gallery-title">{content.gallery.title}</h2>
        </div>
        <div>
          <p>{content.gallery.intro}</p>
          <small>{content.gallery.note}</small>
        </div>
      </header>
      <div className={styles.galleryGrid}>
        {content.gallery.items.map((item, index) => (
          <GalleryFigure item={item} index={index} key={item.id} />
        ))}
      </div>
    </section>
  );
}
