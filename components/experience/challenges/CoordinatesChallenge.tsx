'use client';

import { useEffect, useState } from "react";

import { useLocale } from "@/components/experience/LocaleProvider";
import styles from "../ExperienceShell.module.css";

export function CoordinatesChallenge({ onComplete }: { onComplete: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const { messages: copy } = useLocale();
  const coordinatePairs = copy.coordinates.pairs;
  const rightOrder = [
    coordinatePairs[1],
    coordinatePairs[2],
    coordinatePairs[0]
  ];
  const [message, setMessage] = useState<string>(copy.coordinates.initial);
  const complete = matchedIds.length === coordinatePairs.length;

  useEffect(() => {
    setMessage(copy.coordinates.initial);
  }, [copy]);

  const chooseRight = (pairId: string) => {
    if (!selectedId) {
      setMessage(copy.coordinates.chooseLeft);
      return;
    }

    if (selectedId !== pairId) {
      setSelectedId(null);
      setMessage(copy.coordinates.mismatch);
      return;
    }

    const nextMatched = [...matchedIds, pairId];
    setMatchedIds(nextMatched);
    setSelectedId(null);
    setMessage(
      nextMatched.length === coordinatePairs.length
        ? copy.coordinates.complete
        : copy.coordinates.matched
    );
  };

  return (
    <article className={styles.challengeCard} aria-labelledby="coordinates-title">
      <div className={styles.challengeHeading}>
        <span className={styles.challengeNumber}>02</span>
        <div>
          <h2 id="coordinates-title">{copy.coordinates.title}</h2>
          <p>{copy.coordinates.intro}</p>
        </div>
      </div>

      <div className={styles.pairBoard}>
        <div
          className={styles.pairColumn}
          aria-label={copy.coordinates.leftLabel}
        >
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
                  setMessage(copy.coordinates.selected(pair.left));
                }}
              >
                <span aria-hidden="true">{pair.symbol}</span>
                {pair.left}
              </button>
            );
          })}
        </div>
        <span className={styles.pairLine} aria-hidden="true">↔</span>
        <div
          className={styles.pairColumn}
          aria-label={copy.coordinates.rightLabel}
        >
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
          {copy.coordinates.collect}
          <span aria-hidden="true">⌖</span>
        </button>
      )}
    </article>
  );
}
