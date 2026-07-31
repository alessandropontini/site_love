'use client';

import { useEffect, useMemo, useRef, useState } from "react";

import { ChapterExperience } from "@/components/experience/ChapterExperience";
import { FinaleExperience } from "@/components/experience/FinaleExperience";
import { InventoryPanel } from "@/components/experience/InventoryPanel";
import { JourneyMap } from "@/components/experience/JourneyMap";
import { RewardScene } from "@/components/experience/RewardScene";
import { PaperStage } from "@/components/experience/art/PaperArt";
import {
  experienceChapters,
  getExperienceChapter
} from "@/lib/experienceConfig";
import { useExperienceProgress } from "@/lib/useExperienceProgress";

import styles from "./ExperienceShell.module.css";

export function ExperienceShell() {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const inventoryTriggerRef = useRef<HTMLButtonElement>(null);
  const {
    activeChapter,
    completedCount,
    enterJourney,
    experience,
    finaleUnlocked,
    finishChapter,
    hydrated,
    isChapterComplete,
    isChapterUnlocked,
    motionLockedBySystem,
    openChapter,
    openFinale,
    resetExperience,
    returnToMap,
    showInvitation,
    toggleMotion
  } = useExperienceProgress();

  const activeChapterConfig = useMemo(
    () => (activeChapter ? getExperienceChapter(activeChapter) : undefined),
    [activeChapter]
  );
  const screenTitleId = {
    invitation: "invitation-title",
    map: "map-title",
    chapter: "chapter-title",
    reward: "reward-title",
    finale: "finale-title"
  }[experience.view];
  const motionControlLabel = motionLockedBySystem
    ? "Movimento ridotto attivo nelle impostazioni del dispositivo"
    : "Movimento ridotto";

  useEffect(() => {
    setInventoryOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      screenRef.current?.focus({ preventScroll: true });
    });
  }, [experience.view, activeChapter]);

  useEffect(() => {
    if (!inventoryOpen) return;

    const backgroundElement = backgroundRef.current;
    const previousOverflow = document.body.style.overflow;
    if (backgroundElement) backgroundElement.inert = true;
    document.body.style.overflow = "hidden";

    return () => {
      if (backgroundElement) backgroundElement.inert = false;
      document.body.style.overflow = previousOverflow;
    };
  }, [inventoryOpen]);

  const closeInventory = () => {
    setInventoryOpen(false);
    window.requestAnimationFrame(() => inventoryTriggerRef.current?.focus());
  };

  return (
    <div
      className={styles.experience}
      data-motion={experience.motionEnabled ? "on" : "off"}
      data-view={experience.view}
      data-hydrated={hydrated}
      aria-busy={!hydrated}
    >
      <div ref={backgroundRef}>
        <a className={styles.skipLink} href="#experience-screen">
          Vai all&apos;esperienza
        </a>

        {experience.view !== "invitation" && (
          <header className={styles.toolbar}>
            <button
              type="button"
              className={styles.brandButton}
              onClick={showInvitation}
              aria-label="Torna all'invito iniziale"
            >
              <span>A</span>
              <span aria-hidden="true">♥</span>
              <span>B</span>
            </button>
            <div
              className={styles.toolbarStatus}
              aria-label="Progresso del viaggio"
            >
              <span>
                {completedCount}/{experienceChapters.length} ricordi
              </span>
              <span className={styles.toolbarTrack} aria-hidden="true">
                <span
                  style={{
                    width: `${(completedCount / experienceChapters.length) * 100}%`
                  }}
                />
              </span>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              onClick={toggleMotion}
              aria-pressed={!experience.motionEnabled}
              aria-label={motionControlLabel}
              title={motionControlLabel}
              disabled={motionLockedBySystem}
            >
              {experience.motionEnabled ? "≈" : "—"}
            </button>
          </header>
        )}

        <main
          className={styles.screen}
          id="experience-screen"
          key={`${experience.view}-${activeChapter ?? "home"}`}
          ref={screenRef}
          tabIndex={-1}
          aria-labelledby={screenTitleId}
        >
          {experience.view === "invitation" && (
            <section
              className={styles.invitation}
              aria-labelledby="invitation-title"
            >
              <div className={styles.invitationCopy}>
                <div className={styles.invitationTopline}>
                  <span className={styles.kicker}>Una storia da attraversare</span>
                  <button
                    type="button"
                    className={styles.motionButton}
                    onClick={toggleMotion}
                    aria-label={motionControlLabel}
                    aria-pressed={!experience.motionEnabled}
                    title={motionControlLabel}
                    disabled={motionLockedBySystem}
                  >
                    Movimento ridotto
                  </button>
                </div>
                <p className={styles.chapterMarker}>
                  Milano · Quattro fermate
                </p>
                <h1 id="invitation-title">Alessandro &amp; Bridget</h1>
                <p className={styles.lede}>
                  Non è una pagina da leggere. È una città da accendere, un
                  ricordo alla volta.
                </p>
                <div className={styles.invitationActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={enterJourney}
                    disabled={!hydrated}
                  >
                    {!hydrated
                      ? "Caricamento del viaggio…"
                      : experience.started
                        ? "Continua il viaggio"
                        : "Entra nella storia"}
                    <span aria-hidden="true">→</span>
                  </button>
                  <span className={styles.duration}>
                    {experienceChapters.length} tappe · circa 6 minuti
                  </span>
                </div>
              </div>

              <div className={styles.invitationWorld} aria-hidden="true">
                <PaperStage variant="invitation" priority />
              </div>
            </section>
          )}

          {experience.view === "map" && (
            <JourneyMap
              completedCount={completedCount}
              finaleUnlocked={finaleUnlocked}
              isChapterComplete={isChapterComplete}
              isChapterUnlocked={isChapterUnlocked}
              onOpenChapter={openChapter}
              onOpenFinale={openFinale}
              onOpenInventory={() => setInventoryOpen(true)}
              inventoryTriggerRef={inventoryTriggerRef}
            />
          )}

          {experience.view === "chapter" && activeChapterConfig && (
            <ChapterExperience
              key={activeChapterConfig.id}
              chapter={activeChapterConfig}
              completed={isChapterComplete(activeChapterConfig.id)}
              motionEnabled={experience.motionEnabled}
              onBack={returnToMap}
              onComplete={() => finishChapter(activeChapterConfig.id)}
            />
          )}

          {experience.view === "reward" && activeChapterConfig && (
            <RewardScene
              chapter={activeChapterConfig}
              onContinue={returnToMap}
            />
          )}

          {experience.view === "finale" && (
            <FinaleExperience
              onBack={returnToMap}
              onReplay={resetExperience}
            />
          )}
        </main>

        <p className={styles.srOnly} aria-live="polite">
          {experience.view === "map" &&
            `Mappa aperta. ${completedCount} ${completedCount === 1 ? "ricordo raccolto" : "ricordi raccolti"} su ${experienceChapters.length}.`}
          {experience.view === "reward" && "Nuovo ricordo raccolto."}
          {experience.view === "finale" && "Finale sbloccato."}
        </p>
      </div>

      {inventoryOpen && (
        <InventoryPanel
          inventory={experience.completedChapters}
          onClose={closeInventory}
          onReset={resetExperience}
        />
      )}
    </div>
  );
}
