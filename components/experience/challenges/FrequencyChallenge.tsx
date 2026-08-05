'use client';

import Image from "next/image";
import type { CSSProperties } from "react";
import { useState } from "react";

import { useLocale } from "@/components/experience/LocaleProvider";

import styles from "../ExperienceShell.module.css";

export function FrequencyChallenge({ onComplete }: { onComplete: () => void }) {
  const [frequency, setFrequency] = useState(18);
  const { messages: copy } = useLocale();
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
          <h2 id="frequency-title">{copy.frequency.title}</h2>
          <p>{copy.frequency.intro}</p>
        </div>
      </div>

      <div className={styles.frequencyMemory} style={visualStyle}>
        <Image
          src="/scene/paper-theatre/milan-prop-radio.png"
          alt={copy.frequency.imageAlt}
          width={720}
          height={720}
          unoptimized
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
          {copy.frequency.label}
          <strong>{ready ? copy.frequency.found : `${frequency}%`}</strong>
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
          ? copy.frequency.ready
          : copy.frequency.searching}
      </p>

      <button
        type="button"
        className={ready ? styles.primaryButton : styles.signalAssist}
        onClick={ready ? onComplete : () => setFrequency(92)}
        aria-controls="frequency-status"
      >
        {ready ? copy.frequency.collect : copy.frequency.assist}
        <span aria-hidden="true">{ready ? "✦" : "⌁"}</span>
      </button>
    </article>
  );
}
