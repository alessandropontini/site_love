'use client';

import { useEffect, useRef, useState } from "react";

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

const windows = [
  { id: "lamp", label: "Lampada", position: "in alto a sinistra" },
  { id: "plant", label: "Pianta", position: "in alto a destra" },
  { id: "curtain", label: "Tende", position: "in basso a sinistra" },
  { id: "balcony", label: "Balcone", position: "in basso a destra" }
] as const;

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
  const [status, setStatus] = useState("Round 1 di 3. Avvia la prima sequenza.");
  const windowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const actionRef = useRef<HTMLButtonElement>(null);
  const playbackSessionRef = useRef(0);
  const claimedRef = useRef(false);
  const currentRound = rounds[roundIndex];
  const showGuide = guideVisible || !motionEnabled;

  useEffect(() => {
    if (phase !== "showing") return;

    const session = ++playbackSessionRef.current;
    setCueIndex(-1);

    if (!motionEnabled) {
      setGuideVisible(true);
      setStatus(
        `Movimento ridotto: la sequenza di ${currentRound.length} finestre resta visibile.`
      );
      setPhase("input");
      return;
    }

    setStatus("Osserva la sequenza. Le finestre saranno disponibili tra poco.");
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
        setStatus(
          `Ora ripeti ${currentRound.length} finestre nello stesso ordine. Se ti serve, usa la guida testuale.`
        );
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
      setStatus("Ordine diverso. Nessuna penalità: rivedi la sequenza e riprova.");
      setPhase("retry");
      return;
    }

    const nextInputIndex = inputIndex + 1;
    setInputIndex(nextInputIndex);

    if (nextInputIndex < currentRound.length) {
      setStatus(
        `Corretto. ${nextInputIndex} ${nextInputIndex === 1 ? "finestra inserita" : "finestre inserite"} su ${currentRound.length}.`
      );
      return;
    }

    if (roundIndex === rounds.length - 1) {
      setStatus("Tutte le finestre sono accese. La luce di casa è pronta.");
      setPhase("won");
      return;
    }

    setStatus(`Round ${roundIndex + 1} completato.`);
    setPhase("round-cleared");
  };

  const startNextRound = () => {
    const nextRound = roundIndex + 1;
    setRoundIndex(nextRound);
    setInputIndex(0);
    setStatus(`Round ${nextRound + 1} di 3. Osserva la nuova sequenza.`);
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
          <h2 id="windows-title">Le finestre accese</h2>
          <p>Osserva il ritmo della città e restituiscile la stessa luce.</p>
        </div>
      </div>

      <ol className={styles.roundProgress} aria-label="Avanzamento della prova">
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
                Round {index + 1}: {state === "completed" ? "completato" : state === "current" ? "corrente" : "da completare"}
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
          aria-label="Quattro finestre di Milano"
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
                aria-label={`${item.label}, ${item.position}${lit ? ", illuminata" : ""}`}
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
          <strong>Sequenza del round {roundIndex + 1}</strong>
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
            Accendi la prima sequenza <span aria-hidden="true">→</span>
          </button>
        )}
        {phase === "showing" && <span>Guarda le luci del palco…</span>}
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
                ? "Sequenza sempre visibile"
                : showGuide
                  ? "Nascondi la sequenza"
                  : "Mostra la sequenza"}
            </button>
            <button type="button" className={styles.textButton} onClick={playRound}>
              Rivedi le luci
            </button>
          </>
        )}
        {phase === "retry" && (
          <button ref={actionRef} type="button" className={styles.primaryButton} onClick={playRound}>
            Rivedi la sequenza <span aria-hidden="true">↻</span>
          </button>
        )}
        {phase === "round-cleared" && (
          <button ref={actionRef} type="button" className={styles.primaryButton} onClick={startNextRound}>
            Accendi il round successivo <span aria-hidden="true">→</span>
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
            Raccogli la luce <span aria-hidden="true">▣</span>
          </button>
        )}
      </div>
    </article>
  );
}
