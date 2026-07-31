'use client';

import Image from "next/image";
import type { CSSProperties } from "react";
import { useState } from "react";

import styles from "../ExperienceShell.module.css";

export function FrequencyChallenge({ onComplete }: { onComplete: () => void }) {
  const [frequency, setFrequency] = useState(18);
  const ready = frequency >= 88;
  const visualStyle = {
    "--clarity": frequency / 100,
    "--noise": Math.max(0, 100 - frequency) / 100,
    "--scan": `${frequency}%`
  } as CSSProperties;

  return (
    <article className={styles.challengeCard} aria-labelledby="frequency-title">
      <div className={styles.challengeHeading}>
        <span className={styles.challengeNumber}>01</span>
        <div>
          <h2 id="frequency-title">Sintonizza il segnale</h2>
          <p>Porta l&apos;indicatore nella zona luminosa.</p>
        </div>
      </div>

      <div className={styles.frequencyMemory} style={visualStyle}>
        <Image
          src="/scene/paper-theatre/duomo-cardboard.webp"
          alt="Modello di cartone del Duomo di Milano che emerge dal segnale"
          width={1050}
          height={700}
          sizes="(max-width: 899px) 84vw, 42vw"
        />
        <span className={styles.frequencyNoise} aria-hidden="true" />
        <span className={styles.frequencyScan} aria-hidden="true" />
        <span className={styles.frequencyReadout} aria-hidden="true">
          {frequency}%
        </span>
      </div>

      <label className={styles.rangeControl}>
        <span>
          Frequenza del ricordo
          <strong>{ready ? "Segnale trovato" : `${frequency}%`}</strong>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          step="2"
          value={frequency}
          onInput={(event) => setFrequency(Number(event.currentTarget.value))}
          aria-describedby="frequency-status"
        />
      </label>

      <p className={styles.challengeStatus} id="frequency-status" aria-live="polite">
        {ready
          ? "Il segnale è nitido. Puoi raccogliere il primo ricordo."
          : "Continua a regolare: la zona giusta è vicina al massimo."}
      </p>

      <button
        type="button"
        className={ready ? styles.primaryButton : styles.signalAssist}
        onClick={ready ? onComplete : () => setFrequency(92)}
        aria-controls="frequency-status"
      >
        {ready ? "Raccogli la scintilla" : "Aggancia il segnale"}
        <span aria-hidden="true">{ready ? "✦" : "⌁"}</span>
      </button>
    </article>
  );
}
