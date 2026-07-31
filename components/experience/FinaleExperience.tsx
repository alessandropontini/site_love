'use client';

import { useEffect, useRef, useState } from "react";

import { PaperStage, PaperSymbol } from "@/components/experience/art/PaperArt";
import { experienceChapters } from "@/lib/experienceConfig";

import styles from "./ExperienceShell.module.css";

export function FinaleExperience({
  onBack,
  onReplay
}: {
  onBack: () => void;
  onReplay: () => void;
}) {
  const [letterOpen, setLetterOpen] = useState(false);
  const [confirmReplay, setConfirmReplay] = useState(false);
  const letterTitleRef = useRef<HTMLHeadingElement>(null);
  const replayTriggerRef = useRef<HTMLButtonElement>(null);

  const cancelReplay = () => {
    setConfirmReplay(false);
    window.requestAnimationFrame(() => replayTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!letterOpen) return;
    window.requestAnimationFrame(() => letterTitleRef.current?.focus());
  }, [letterOpen]);

  return (
    <section className={styles.finaleScreen} aria-labelledby="finale-title">
      <button type="button" className={styles.backButton} onClick={onBack}>
        <span aria-hidden="true">←</span>
        Mappa
      </button>

      {!letterOpen ? (
        <div className={styles.finaleAssembly}>
          <div className={styles.finalSky} aria-hidden="true">
            <PaperStage variant="finale" tone="night" />
          </div>
          <span className={styles.kicker}>I quattro ricordi sono qui</span>
          <h1 id="finale-title">L&apos;ultima pagina non era una fine</h1>
          <p>
            Ogni oggetto ha portato una parola. Adesso possono finalmente stare
            nella stessa lettera.
          </p>
          <div className={styles.assemblyObjects} role="list" aria-label="Ricordi raccolti">
            {experienceChapters.map((chapter) => (
              <span
                key={chapter.id}
                role="listitem"
              >
                <PaperSymbol chapterId={chapter.id} />
                <span className={styles.srOnly}>{chapter.reward.title}</span>
              </span>
            ))}
          </div>
          <button
            type="button"
            className={`${styles.envelopeButton} ${styles.primaryButton}`}
            onClick={() => setLetterOpen(true)}
          >
            <span aria-hidden="true">✉</span>
            Apri la lettera
          </button>
        </div>
      ) : (
        <div className={styles.openLetter}>
          <div className={styles.letterCouple} aria-hidden="true">
            <PaperStage variant="finale" tone="night" />
          </div>
          <span className={styles.kicker}>Alessandro &amp; Bridget</span>
          <h1 id="finale-title" ref={letterTitleRef} tabIndex={-1}>
            La prossima fermata è nostra
          </h1>
          <div className={styles.letterBody}>
            <p>Ci sono storie che cercano un finale perfetto.</p>
            <p>
              Questa preferisce continuare: nelle strade ancora da attraversare,
              nelle cose piccole da ricordare e in tutte le volte in cui sceglieremo
              di tornare dalla stessa parte.
            </p>
            <strong>Continuiamo?</strong>
          </div>
          <div className={styles.finaleActions}>
            <button type="button" className={styles.secondaryButton} onClick={onBack}>
              Rivedi la mappa
            </button>
            {!confirmReplay ? (
              <button
                type="button"
                className={styles.textButton}
                ref={replayTriggerRef}
                onClick={() => setConfirmReplay(true)}
              >
                Ricomincia la storia
              </button>
            ) : (
              <div className={styles.replayConfirm} role="group" aria-label="Conferma nuovo inizio">
                <span>Il progresso verrà cancellato.</span>
                <button type="button" className={styles.textButton} onClick={cancelReplay} autoFocus>
                  Annulla
                </button>
                <button type="button" className={styles.primaryButton} onClick={onReplay}>
                  Sì, ricomincia
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
