'use client';

import { useState } from "react";

import { hiddenObjects } from "@/lib/storyConfig";

import styles from "./GameCard.module.css";

type HiddenObjectGameProps = {
  completed: boolean;
  onComplete: () => void;
};

export function HiddenObjectGame({ completed, onComplete }: HiddenObjectGameProps) {
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("Find the four clues hidden in the scene.");

  const reveal = (id: string) => {
    if (completed || found.includes(id)) return;

    const nextFound = [...found, id];
    const object = hiddenObjects.find((item) => item.id === id);
    setFound(nextFound);
    setMessage(object ? object.hint : "Clue found.");

    if (nextFound.length === hiddenObjects.length) {
      setMessage("All clues found. The finale is unlocked.");
      window.setTimeout(onComplete, 350);
    }
  };

  return (
    <article className={`${styles.gameCard} ${completed ? styles.success : ""}`}>
      <header>
        <h3>Hidden clues</h3>
        <p>Search the route scene for the objects that carry the story forward.</p>
      </header>

      <div className={styles.hiddenScene} aria-label="Hidden object scene">
        {hiddenObjects.map((object) => (
          <button
            key={object.id}
            type="button"
            className={styles.hotspot}
            style={{ left: `${object.x}%`, top: `${object.y}%` }}
            data-found={found.includes(object.id) || completed}
            aria-label={`Find ${object.label}`}
            onClick={() => reveal(object.id)}
          />
        ))}
      </div>

      <div className={styles.objectList} aria-label="Found objects">
        {hiddenObjects.map((object) => (
          <button
            key={object.id}
            type="button"
            className={styles.objectButton}
            data-found={found.includes(object.id) || completed}
            disabled
          >
            {found.includes(object.id) || completed ? object.label : "Undiscovered"}
          </button>
        ))}
      </div>

      <p className={styles.status} aria-live="polite">
        {completed ? "Complete. The final reveal is ready." : message}
      </p>
    </article>
  );
}
