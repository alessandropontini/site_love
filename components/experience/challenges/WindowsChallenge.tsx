'use client';

import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/components/experience/LocaleProvider";
import styles from "../ExperienceShell.module.css";

type WindowId = "lamp" | "plant" | "curtain" | "balcony";
type Phase =
  | "ready"
  | "showing"
  | "input"
  | "retry"
  | "round-cleared"
  | "won"
  | "claimed";

type StatusState =
  | { key: "initial" }
  | { key: "reduced"; count: number }
  | { key: "observe" }
  | { key: "repeat"; count: number }
  | { key: "retry" }
  | { key: "correct"; count: number; total: number }
  | { key: "won" }
  | { key: "roundComplete"; round: number }
  | { key: "nextRound"; round: number };

const rounds: readonly (readonly WindowId[])[] = [
  ["lamp", "plant", "curtain"],
  ["balcony", "lamp", "curtain", "plant"],
  ["plant", "balcony", "curtain", "balcony", "lamp"]
];

export function WindowsChallenge({
  motionEnabled,
  onComplete
}: {
  motionEnabled: boolean;
  onComplete: () => void;
}) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [cueIndex, setCueIndex] = useState(-1);
  const [inputIndex, setInputIndex] = useState(0);
  const [guideVisible, setGuideVisible] = useState(false);
  const [statusState, setStatusState] = useState<StatusState>({
    key: "initial"
  });
  const { messages: copy } = useLocale();
  const windows = copy.windows.items;
  const windowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const actionRef = useRef<HTMLButtonElement>(null);
  const playbackSessionRef = useRef(0);
  const claimedRef = useRef(false);
  const currentRound = rounds[roundIndex];
  const showGuide = guideVisible || !motionEnabled;
  const status = (() => {
    switch (statusState.key) {
      case "initial":
        return copy.windows.initial;
      case "reduced":
        return copy.windows.reduced(statusState.count);
      case "observe":
        return copy.windows.observe;
      case "repeat":
        return copy.windows.repeat(statusState.count);
      case "retry":
        return copy.windows.retry;
      case "correct":
        return copy.windows.correct(statusState.count, statusState.total);
      case "won":
        return copy.windows.won;
      case "roundComplete":
        return copy.windows.roundComplete(statusState.round);
      case "nextRound":
        return copy.windows.nextRound(statusState.round);
    }
  })();

  useEffect(() => {
    if (phase !== "showing") return;

    const session = ++playbackSessionRef.current;
    setCueIndex(-1);

    if (!motionEnabled) {
      setGuideVisible(true);
      setStatusState({ key: "reduced", count: currentRound.length });
      setPhase("input");
      return;
    }

    setStatusState({ key: "observe" });
    const timers: number[] = [];
    const initialDelay = 350;
    const stepDuration = 900;

    currentRound.forEach((_, index) => {
      const start = initialDelay + index * stepDuration;
      timers.push(
        window.setTimeout(() => {
          if (playbackSessionRef.current === session) setCueIndex(index);
        }, start)
      );
      timers.push(
        window.setTimeout(() => {
          if (playbackSessionRef.current === session) setCueIndex(-1);
        }, start + 650)
      );
    });

    timers.push(
      window.setTimeout(() => {
        if (playbackSessionRef.current !== session) return;
        setCueIndex(-1);
        setStatusState({ key: "repeat", count: currentRound.length });
        setPhase("input");
      }, initialDelay + currentRound.length * stepDuration + 350)
    );

    return () => {
      playbackSessionRef.current += 1;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [currentRound, motionEnabled, phase]);

  useEffect(() => {
    if (phase === "input") {
      window.requestAnimationFrame(() => windowRefs.current[0]?.focus());
      return;
    }

    if (phase !== "retry" && phase !== "round-cleared" && phase !== "won") return;
    window.requestAnimationFrame(() => actionRef.current?.focus());
  }, [phase]);

  const playRound = () => {
    setInputIndex(0);
    setCueIndex(-1);
    setPhase("showing");
  };

  const chooseWindow = (windowId: WindowId) => {
    if (phase !== "input") return;

    if (currentRound[inputIndex] !== windowId) {
      setInputIndex(0);
      setGuideVisible(true);
      setStatusState({ key: "retry" });
      setPhase("retry");
      return;
    }

    const nextInputIndex = inputIndex + 1;
    setInputIndex(nextInputIndex);

    if (nextInputIndex < currentRound.length) {
      setStatusState({
        key: "correct",
        count: nextInputIndex,
        total: currentRound.length
      });
      return;
    }

    if (roundIndex === rounds.length - 1) {
      setStatusState({ key: "won" });
      setPhase("won");
      return;
    }

    setStatusState({ key: "roundComplete", round: roundIndex + 1 });
    setPhase("round-cleared");
  };

  const startNextRound = () => {
    const nextRound = roundIndex + 1;
    setRoundIndex(nextRound);
    setInputIndex(0);
    setStatusState({ key: "nextRound", round: nextRound + 1 });
    setPhase("showing");
  };

  const claimReward = () => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    setPhase("claimed");
    onComplete();
  };

  const handleWindowKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const movement: Record<string, number> = {
      ArrowLeft: index % 2 === 0 ? index : index - 1,
      ArrowRight: index % 2 === 1 ? index : index + 1,
      ArrowUp: index < 2 ? index : index - 2,
      ArrowDown: index > 1 ? index : index + 2,
      Home: 0,
      End: windows.length - 1
    };
    const nextIndex = movement[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    if (nextIndex !== index) windowRefs.current[nextIndex]?.focus();
  };

  return (
    <article className={styles.challengeCard} aria-labelledby="windows-title">
      <div className={styles.challengeHeading}>
        <span className={styles.challengeNumber}>04</span>
        <div>
          <h2 id="windows-title">{copy.windows.title}</h2>
          <p>{copy.windows.intro}</p>
        </div>
      </div>

      <ol className={styles.roundProgress} aria-label={copy.windows.progress}>
        {rounds.map((_, index) => {
          const state = index < roundIndex
            ? "completed"
            : index === roundIndex
              ? phase === "round-cleared" || phase === "won" || phase === "claimed"
                ? "completed"
                : "current"
              : "upcoming";
          return (
            <li key={index} data-state={state}>
              <span aria-hidden="true">{state === "completed" ? "✓" : index + 1}</span>
              <span className={styles.srOnly}>
                Round {index + 1}:{" "}
                {state === "completed"
                  ? copy.windows.stateComplete
                  : state === "current"
                    ? copy.windows.stateCurrent
                    : copy.windows.stateUpcoming}
              </span>
            </li>
          );
        })}
      </ol>

      <div className={styles.windowScene}>
        <span className={styles.windowMoon} aria-hidden="true" />
        <div
          className={styles.windowFacade}
          role="group"
          aria-label={copy.windows.group}
        >
          {windows.map((item, index) => {
            const litDuringPlayback = cueIndex >= 0 && currentRound[cueIndex] === item.id;
            const entered = phase === "input" && currentRound.slice(0, inputIndex).includes(item.id);
            const lit = litDuringPlayback || entered || phase === "won" || phase === "claimed";
            return (
              <button
                key={item.id}
                ref={(element) => {
                  windowRefs.current[index] = element;
                }}
                type="button"
                className={styles.windowButton}
              data-window={item.id}
              data-lit={lit}
              data-recent={
                phase === "input" &&
                inputIndex > 0 &&
                currentRound[inputIndex - 1] === item.id
              }
                disabled={phase !== "input"}
                onClick={() => chooseWindow(item.id)}
                onKeyDown={(event) => handleWindowKeyDown(event, index)}
                aria-label={`${item.label}, ${item.position}${lit ? `, ${copy.windows.lit}` : ""}`}
              >
                <span className={styles.windowPane} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <strong>{item.label}</strong>
              </button>
            );
          })}
        </div>
        <span className={styles.windowStreet} aria-hidden="true" />
      </div>

      {showGuide && (
        <div className={styles.sequenceGuide}>
          <strong>{copy.windows.guide(roundIndex + 1)}</strong>
          <ol>
            {currentRound.map((windowId, index) => (
              <li key={`${windowId}-${index}`}>
                {windows.find((item) => item.id === windowId)?.label}
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className={styles.challengeStatus} aria-live="polite" aria-atomic="true">
        {status}
      </p>

      <div className={styles.sequenceControls}>
        {phase === "ready" && (
          <button type="button" className={styles.primaryButton} onClick={playRound}>
            {copy.windows.start} <span aria-hidden="true">→</span>
          </button>
        )}
        {phase === "showing" && <span>{copy.windows.watching}</span>}
        {phase === "input" && (
          <>
            <button
              type="button"
              className={styles.secondaryButton}
              aria-pressed={showGuide}
              onClick={() => setGuideVisible((visible) => !visible)}
              disabled={!motionEnabled}
            >
              {!motionEnabled
                ? copy.windows.alwaysVisible
                : showGuide
                  ? copy.windows.hide
                  : copy.windows.show}
            </button>
            <button type="button" className={styles.textButton} onClick={playRound}>
              {copy.windows.replayLights}
            </button>
          </>
        )}
        {phase === "retry" && (
          <button ref={actionRef} type="button" className={styles.primaryButton} onClick={playRound}>
            {copy.windows.replay} <span aria-hidden="true">↻</span>
          </button>
        )}
        {phase === "round-cleared" && (
          <button ref={actionRef} type="button" className={styles.primaryButton} onClick={startNextRound}>
            {copy.windows.continue} <span aria-hidden="true">→</span>
          </button>
        )}
        {(phase === "won" || phase === "claimed") && (
          <button
            ref={actionRef}
            type="button"
            className={styles.primaryButton}
            onClick={claimReward}
            disabled={phase === "claimed"}
          >
            {copy.windows.collect} <span aria-hidden="true">▣</span>
          </button>
        )}
      </div>
    </article>
  );
}
