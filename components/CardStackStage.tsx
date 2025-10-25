"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { storyStack } from "@/lib/photos";

export function CardStackStage() {
  return (
    <section className="stack-stage">
      <header className="stack-copy">
        <h2>Three Acts of Us</h2>
        <p>
          A tactile stack of memories—pull one forward, feel the depth, relive
          the vibe. Every card is a chapter we promise to keep writing.
        </p>
      </header>
      <div className="stack-container">
        <ul className="stack-list">
          {storyStack.map((photo, index) => (
            <motion.li
              key={photo.id}
              className="stack-card"
              style={{ "--card-index": index } as CSSProperties}
              initial={{ y: 64, opacity: 0, rotateX: 12 }}
              whileInView={{ y: 0, opacity: 1, rotateX: 0 }}
              whileHover={{ rotateX: -6, rotateY: 6, z: 24, scale: 1.03 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 18,
                delay: index * 0.08
              }}
              viewport={{ once: true, amount: 0.4 }}
            >
              <div className="stack-card-visual">
                <Image
                  src={photo.imageUrl}
                  alt={photo.title}
                  fill
                  sizes="(max-width: 768px) 85vw, 420px"
                />
                <div
                  className="stack-card-glow"
                  style={{ background: photo.accent }}
                />
              </div>
              <div className="stack-card-meta">
                <span>{photo.capturedOn}</span>
                <h3>{photo.title}</h3>
                <p>{photo.tagline}</p>
                <strong>{photo.location}</strong>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
