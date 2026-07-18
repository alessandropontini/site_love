'use client';

import { useState } from "react";

import styles from "../ExperienceShell.module.css";

const correctOrder = ["Incontrarsi", "Riconoscersi", "Scegliersi", "Costruire"];
const initialOrder = [...correctOrder].reverse();

export function TimelineChallenge({ onComplete }: { onComplete: () => void }) {
  const [moments, setMoments] = useState(initialOrder);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("Tocca la prima tessera da spostare.");
  const solved = moments.every((moment, index) => moment === correctOrder[index]);

  const chooseMoment = (index: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
      setMessage(`Hai scelto ${moments[index]}. Ora seleziona la tessera da scambiare.`);
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null);
      setMessage("Selezione annullata.");
      return;
    }

    const nextMoments = [...moments];
    [nextMoments[selectedIndex], nextMoments[index]] = [
      nextMoments[index],
      nextMoments[selectedIndex]
    ];
    setMoments(nextMoments);
    setSelectedIndex(null);
    setMessage(
      nextMoments.every((moment, momentIndex) => moment === correctOrder[momentIndex])
        ? "La sequenza è completa. Ogni scelta ha trovato il suo posto."
        : "Scambio riuscito. Continua a ricomporre la storia."
    );
  };

  return (
    <article className={styles.challengeCard} aria-labelledby="timeline-title">
      <div className={styles.challengeHeading}>
        <span className={styles.challengeNumber}>03</span>
        <div>
          <h2 id="timeline-title">Metti in ordine i gesti</h2>
          <p>Non servono date: bastano quattro verbi.</p>
        </div>
      </div>

      <ol className={styles.timelineBoard} aria-label="Sequenza dei momenti">
        {moments.map((moment, index) => (
          <li key={moment}>
            <button
              type="button"
              data-selected={selectedIndex === index}
              aria-pressed={selectedIndex === index}
              onClick={() => chooseMoment(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{moment}</strong>
              <span aria-hidden="true">↕</span>
            </button>
          </li>
        ))}
      </ol>

      <p className={styles.challengeStatus} aria-live="polite">
        {message}
      </p>

      {solved && (
        <button type="button" className={styles.primaryButton} onClick={onComplete}>
          Prendi il frammento
          <span aria-hidden="true">♡</span>
        </button>
      )}
    </article>
  );
}
