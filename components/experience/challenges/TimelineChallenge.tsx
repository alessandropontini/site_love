'use client';

import { useState } from "react";

import { useLocale } from "@/components/experience/LocaleProvider";
import styles from "../ExperienceShell.module.css";

const correctOrder = ["meet", "recognise", "choose", "build"] as const;
type MomentId = (typeof correctOrder)[number];
const initialOrder = [...correctOrder].reverse();

export function TimelineChallenge({ onComplete }: { onComplete: () => void }) {
  const [moments, setMoments] = useState<MomentId[]>(initialOrder);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [messageState, setMessageState] = useState<
    "initial" | "cancelled" | "complete" | "swapped" | "selected"
  >("initial");
  const [selectedMoment, setSelectedMoment] = useState<MomentId | null>(null);
  const { messages: copy } = useLocale();
  const solved = moments.every((moment, index) => moment === correctOrder[index]);
  const momentLabel = (moment: MomentId) =>
    copy.timeline.moments[correctOrder.indexOf(moment)];
  const message = (() => {
    if (messageState === "selected" && selectedMoment) {
      return copy.timeline.selected(momentLabel(selectedMoment));
    }

    switch (messageState) {
      case "initial":
        return copy.timeline.initial;
      case "cancelled":
        return copy.timeline.cancelled;
      case "complete":
        return copy.timeline.complete;
      case "swapped":
        return copy.timeline.swapped;
      case "selected":
        return copy.timeline.initial;
    }
  })();

  const chooseMoment = (index: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
      setSelectedMoment(moments[index]);
      setMessageState("selected");
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null);
      setSelectedMoment(null);
      setMessageState("cancelled");
      return;
    }

    const nextMoments = [...moments];
    [nextMoments[selectedIndex], nextMoments[index]] = [
      nextMoments[index],
      nextMoments[selectedIndex]
    ];
    setMoments(nextMoments);
    setSelectedIndex(null);
    setSelectedMoment(null);
    setMessageState(
      nextMoments.every((moment, momentIndex) => moment === correctOrder[momentIndex])
        ? "complete"
        : "swapped"
    );
  };

  return (
    <article className={styles.challengeCard} aria-labelledby="timeline-title">
      <div className={styles.challengeHeading}>
        <span className={styles.challengeNumber}>03</span>
        <div>
          <h2 id="timeline-title">{copy.timeline.title}</h2>
          <p>{copy.timeline.intro}</p>
        </div>
      </div>

      <ol
        className={styles.timelineBoard}
        aria-label={copy.timeline.boardLabel}
      >
        {moments.map((moment, index) => (
          <li key={moment}>
            <button
              type="button"
              data-selected={selectedIndex === index}
              aria-pressed={selectedIndex === index}
              onClick={() => chooseMoment(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{momentLabel(moment)}</strong>
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
          {copy.timeline.collect}
          <span aria-hidden="true">♡</span>
        </button>
      )}
    </article>
  );
}
