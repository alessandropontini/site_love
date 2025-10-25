import Image from "next/image";
import type { CSSProperties } from "react";
import { wallPhotos } from "@/lib/photos";

export function KenBurnsWall() {
  return (
    <section className="kenburns">
      <div className="kenburns-grid">
        {wallPhotos.map((photo, index) => (
          <article
            key={photo.id}
            className="kenburns-tile"
            style={{ "--tile-index": index } as CSSProperties}
          >
            <Image
              src={photo.imageUrl}
              alt={photo.title}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 45vw, 33vw"
            />
            <div
              className="kenburns-overlay"
              style={{ background: photo.accent }}
            />
            <div className="kenburns-text">
              <span>{photo.capturedOn}</span>
              <h2>{photo.title}</h2>
              <p>{photo.tagline}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
