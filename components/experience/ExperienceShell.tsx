'use client';

import { useEffect, useMemo, useRef, useState } from "react";

import { ChapterExperience } from "@/components/experience/ChapterExperience";
import { FinaleExperience } from "@/components/experience/FinaleExperience";
import { InventoryPanel } from "@/components/experience/InventoryPanel";
import { JourneyMap } from "@/components/experience/JourneyMap";
import {
  LanguageSelector,
  LocaleProvider,
  useLocale
} from "@/components/experience/LocaleProvider";
import { RewardScene } from "@/components/experience/RewardScene";
import { PaperStage } from "@/components/experience/art/PaperArt";
import {
  getExperienceChapters,
  getExperienceChapter
} from "@/lib/experienceConfig";
import { useExperienceProgress } from "@/lib/useExperienceProgress";

import styles from "./ExperienceShell.module.css";

export function ExperienceShell() {
  return (
    <LocaleProvider>
      <ExperienceShellContent />
    </LocaleProvider>
  );
}

function ExperienceShellContent() {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const previousScreenKeyRef = useRef<string | null>(null);
  const inventoryTriggerRef = useRef<HTMLButtonElement>(null);
  const { locale, messages: copy } = useLocale();
  const experienceChapters = useMemo(
    () => getExperienceChapters(locale),
    [locale]
  );
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
    () =>
      activeChapter
        ? getExperienceChapter(activeChapter, locale)
        : undefined,
    [activeChapter, locale]
  );
  const screenTitleId = {
    invitation: "invitation-title",
    map: "map-title",
    chapter: "chapter-title",
    reward: "reward-title",
    finale: "finale-title"
  }[experience.view];
  const motionControlLabel = motionLockedBySystem
    ? copy.shell.reducedMotionSystem
    : experience.motionEnabled
      ? copy.shell.disableMotion
      : copy.shell.enableMotion;
  const screenKey = `${experience.view}-${activeChapter ?? "home"}`;

  useEffect(() => {
    setInventoryOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (previousScreenKeyRef.current === null) {
      previousScreenKeyRef.current = screenKey;
      return;
    }
    if (previousScreenKeyRef.current === screenKey) return;
    previousScreenKeyRef.current = screenKey;

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      screenRef.current?.focus({ preventScroll: true });
    });
  }, [screenKey]);

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
      data-locale={locale}
      data-hydrated={hydrated}
      aria-busy={!hydrated}
    >
      <div ref={backgroundRef}>
        <a className={styles.skipLink} href="#experience-screen">
          {copy.shell.skip}
        </a>

        {experience.view !== "invitation" && (
          <header className={styles.toolbar}>
            <button
              type="button"
              className={styles.brandButton}
              onClick={showInvitation}
              aria-label={copy.shell.backToInvitation}
            >
              <span>A</span>
              <span aria-hidden="true">♥</span>
              <span>B</span>
            </button>
            <div
              className={styles.toolbarStatus}
              aria-label={copy.shell.journeyProgress}
            >
              <span>
                {completedCount}/{experienceChapters.length}{" "}
                {copy.shell.memories}
              </span>
              <span className={styles.toolbarTrack} aria-hidden="true">
                <span
                  style={{
                    width: `${(completedCount / experienceChapters.length) * 100}%`
                  }}
                />
              </span>
            </div>
            <LanguageSelector className={styles.languageSelector} />
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
          key={screenKey}
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
                  <span className={styles.kicker}>
                    {copy.shell.invitationKicker}
                  </span>
                  <div className={styles.invitationControls}>
                    <LanguageSelector className={styles.languageSelector} />
                    <button
                      type="button"
                      className={styles.motionButton}
                      onClick={toggleMotion}
                      aria-label={motionControlLabel}
                      aria-pressed={!experience.motionEnabled}
                      title={motionControlLabel}
                      disabled={motionLockedBySystem}
                    >
                      {experience.motionEnabled
                        ? copy.shell.motionOn
                        : copy.shell.motionOff}
                    </button>
                  </div>
                </div>
                <p className={styles.chapterMarker}>
                  {copy.shell.invitationMarker}
                </p>
                <h1 id="invitation-title">Alessandro &amp; Bridget</h1>
                <p className={styles.lede}>{copy.shell.invitationLede}</p>
                <p className={styles.weddingDate}>{copy.shell.weddingDate}</p>
                <div className={styles.invitationActions}>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={enterJourney}
                    disabled={!hydrated}
                  >
                    {!hydrated
                      ? copy.shell.loading
                      : experience.started
                        ? copy.shell.continueJourney
                        : copy.shell.enterStory}
                    <span aria-hidden="true">→</span>
                  </button>
                  <span className={styles.duration}>
                    {experienceChapters.length} {copy.shell.duration}
                  </span>
                </div>
              </div>

              <div className={styles.invitationWorld}>
                <PaperStage
                  variant="invitation"
                  priority
                  placeLabel={copy.shell.duomoPlace}
                  pigeonLabel={copy.shell.pigeonAction}
                  sunLabel={copy.shell.sunAction}
                  moonLabel={copy.shell.moonAction}
                  madonninaLabel={copy.shell.madonninaAction}
                />
              </div>
            </section>
          )}

          {experience.view === "map" && (
            <JourneyMap
              chapters={experienceChapters}
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
            copy.shell.mapAnnouncement(
              completedCount,
              experienceChapters.length
            )}
          {experience.view === "reward" && copy.shell.rewardAnnouncement}
          {experience.view === "finale" && copy.shell.finaleAnnouncement}
        </p>
      </div>

      {inventoryOpen && (
        <InventoryPanel
          chapters={experienceChapters}
          inventory={experience.completedChapters}
          onClose={closeInventory}
          onReset={resetExperience}
        />
      )}
    </div>
  );
}
