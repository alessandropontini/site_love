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
  const [message, setMessage] = useState("Trova i quattro indizi nascosti nella scena.");

  const reveal = (id: string) => {
    if (completed || found.includes(id)) return;

    const nextFound = [...found, id];
    const object = hiddenObjects.find((item) => item.id === id);
    setFound(nextFound);
    setMessage(object ? object.hint : "Indizio trovato.");

    if (nextFound.length === hiddenObjects.length) {
      setMessage("Tutti gli indizi sono stati trovati. Il finale è aperto.");
      window.setTimeout(onComplete, 350);
    }
  };

  return (
    <article className={`${styles.gameCard} ${completed ? styles.success : ""}`}>
      <header>
        <h3>Indizi nascosti</h3>
        <p>Cerca nella scena gli oggetti che hanno accompagnato il viaggio.</p>
      </header>

      <div className={styles.hiddenScene} aria-label="Scena con oggetti nascosti">
        {hiddenObjects.map((object) => (
          <button
            key={object.id}
            type="button"
            className={styles.hotspot}
            style={{ left: `${object.x}%`, top: `${object.y}%` }}
            data-found={found.includes(object.id) || completed}
            aria-label={`Trova ${object.label}`}
            onClick={() => reveal(object.id)}
          />
        ))}
      </div>

      <div className={styles.objectList} aria-label="Oggetti trovati">
        {hiddenObjects.map((object) => (
          <button
            key={object.id}
            type="button"
            className={styles.objectButton}
            data-found={found.includes(object.id) || completed}
            disabled
          >
            {found.includes(object.id) || completed ? object.label : "Da scoprire"}
          </button>
        ))}
      </div>

      <p className={styles.status} aria-live="polite">
        {completed ? "Completato. Il finale è pronto." : message}
      </p>
    </article>
  );
}
