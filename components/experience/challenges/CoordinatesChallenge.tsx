'use client';

import { useState } from "react";

import styles from "../ExperienceShell.module.css";

const coordinatePairs = [
  { id: "duomo", left: "Duomo", right: "Milano", symbol: "⌂" },
  { id: "tram", left: "Tram", right: "Viaggio", symbol: "▰" },
  { id: "letter", left: "Lettera", right: "Promessa", symbol: "✉" }
] as const;

const rightOrder = [coordinatePairs[1], coordinatePairs[2], coordinatePairs[0]];

export function CoordinatesChallenge({ onComplete }: { onComplete: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("Scegli il primo elemento di una coppia.");
  const complete = matchedIds.length === coordinatePairs.length;

  const chooseRight = (pairId: string) => {
    if (!selectedId) {
      setMessage("Prima scegli un elemento nella colonna di sinistra.");
      return;
    }

    if (selectedId !== pairId) {
      setSelectedId(null);
      setMessage("Queste coordinate non coincidono ancora. Prova un altro abbinamento.");
      return;
    }

    const nextMatched = [...matchedIds, pairId];
    setMatchedIds(nextMatched);
    setSelectedId(null);
    setMessage(
      nextMatched.length === coordinatePairs.length
        ? "Tutte le coordinate portano nella stessa direzione."
        : "Coordinate trovate. Continua con la coppia successiva."
    );
  };

  return (
    <article className={styles.challengeCard} aria-labelledby="coordinates-title">
      <div className={styles.challengeHeading}>
        <span className={styles.challengeNumber}>02</span>
        <div>
          <h2 id="coordinates-title">Collega i segni</h2>
          <p>Tre coppie, una sola strada.</p>
        </div>
      </div>

      <div className={styles.pairBoard}>
        <div className={styles.pairColumn} aria-label="Elementi da abbinare">
          {coordinatePairs.map((pair) => {
            const matched = matchedIds.includes(pair.id);
            return (
              <button
                key={pair.id}
                type="button"
                data-selected={selectedId === pair.id}
                data-matched={matched}
                disabled={matched}
                aria-pressed={selectedId === pair.id}
                onClick={() => {
                  setSelectedId(pair.id);
                  setMessage(`Ora trova la parola collegata a ${pair.left}.`);
                }}
              >
                <span aria-hidden="true">{pair.symbol}</span>
                {pair.left}
              </button>
            );
          })}
        </div>
        <span className={styles.pairLine} aria-hidden="true">↔</span>
        <div className={styles.pairColumn} aria-label="Parole corrispondenti">
          {rightOrder.map((pair) => {
            const matched = matchedIds.includes(pair.id);
            return (
              <button
                key={pair.id}
                type="button"
                data-matched={matched}
                disabled={matched}
                onClick={() => chooseRight(pair.id)}
              >
                {pair.right}
                <span aria-hidden="true">{matched ? "✓" : "○"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className={styles.challengeStatus} aria-live="polite">
        {message}
      </p>

      {complete && (
        <button type="button" className={styles.primaryButton} onClick={onComplete}>
          Conserva il biglietto
          <span aria-hidden="true">⌖</span>
        </button>
      )}
    </article>
  );
}
