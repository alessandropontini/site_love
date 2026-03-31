'use client';

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  PixelCharacter,
  type PixelCharacterVariant
} from "@/components/pixel/PixelCharacter";
import { PixelLandmark } from "@/components/pixel/PixelLandmark";
import { QuestEventPanel } from "@/components/quest/QuestEventPanel";
import { QuestMap } from "@/components/quest/QuestMap";
import {
  QuestLeaderboard,
  type QuestLeaderboardEntry
} from "@/components/quest/QuestLeaderboard";
import { QuestSummary } from "@/components/quest/QuestSummary";
import {
  EventKey,
  QUEST_EVENTS,
  type QuestProgressSnapshot
} from "@/components/quest/questSchema";

type ScreenState = "intro" | "map" | "game" | "ending";

const CHARACTER_OPTIONS: Array<{
  key: PixelCharacterVariant;
  label: string;
  note: string;
}> = [
  {
    key: "alessandro",
    label: "Alessandro",
    note: "Blue suit, glasses, mustache"
  },
  {
    key: "bridget",
    label: "Bridget",
    note: "Sage dress, updo, warm smile"
  }
];

export function QuestGame() {
  const [screen, setScreen] = useState<ScreenState>("intro");
  const [activeEvent, setActiveEvent] = useState<EventKey | null>(null);
  const [progress, setProgress] = useState<Record<EventKey, boolean>>({
    tetris: false,
    pacmaze: false,
    flappy: false,
    platformer: false
  });
  const [heartsCollected, setHeartsCollected] = useState<number>(0);
  const [playerCharacter, setPlayerCharacter] =
    useState<PixelCharacterVariant>("alessandro");
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [leaderboardEntries, setLeaderboardEntries] = useState<QuestLeaderboardEntry[]>(
    []
  );

  const completedCount = useMemo(
    () => Object.values(progress).filter(Boolean).length,
    [progress]
  );

  const progressSnapshot: QuestProgressSnapshot = useMemo(
    () => ({
      completedCount,
      total: QUEST_EVENTS.length,
      heartsCollected
    }),
    [completedCount, heartsCollected]
  );

  const partnerCharacter: PixelCharacterVariant =
    playerCharacter === "alessandro" ? "bridget" : "alessandro";

  useEffect(() => {
    const root = typeof document !== "undefined" ? document.documentElement : null;
    if (!root) return;
    root.setAttribute("data-player", playerCharacter);
    root.setAttribute("data-partner", partnerCharacter);
    return () => {
      root.removeAttribute("data-player");
      root.removeAttribute("data-partner");
    };
  }, [playerCharacter, partnerCharacter]);

  const handleStart = () => {
    setScreen("map");
  };

  useEffect(() => {
    const root = typeof document !== "undefined" ? document.documentElement : null;
    if (!root) return;
    if (screen === "game") {
      root.classList.add("game--lock-scroll");
    } else {
      root.classList.remove("game--lock-scroll");
    }
    return () => {
      root.classList.remove("game--lock-scroll");
    };
  }, [screen]);

  useEffect(() => {
    if (screen === "game") {
      const panel = document.getElementById("quest-event-panel");
      if (panel) {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (screen === "map" || screen === "ending") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [screen, activeEvent]);

  const handleSelectEvent = (eventKey: EventKey) => {
    setActiveEvent(eventKey);
    setScreen("game");
    setAttemptCount((prev) => prev + 1);
  };

  const handleCompleteEvent = (eventKey: EventKey, heartsEarned: number) => {
    const eventMeta = QUEST_EVENTS.find((event) => event.key === eventKey);
    setProgress((prev) => {
      const snapshot = { ...prev, [eventKey]: true };
      const finished = QUEST_EVENTS.every((event) => snapshot[event.key]);
      setScreen(finished ? "ending" : "map");
      return snapshot;
    });
    setHeartsCollected((prev) => prev + heartsEarned);
    if (eventMeta) {
      setLeaderboardEntries((previous) => {
        const nextEntry: QuestLeaderboardEntry = {
          id: Date.now(),
          eventKey,
          eventTitle: eventMeta.title,
          hearts: heartsEarned,
          character: playerCharacter,
          completedAt: Date.now()
        };
        return [...previous, nextEntry]
          .sort((a, b) => {
            if (b.hearts !== a.hearts) return b.hearts - a.hearts;
            return b.completedAt - a.completedAt;
          })
          .slice(0, 8);
      });
    }
    setActiveEvent(null);
  };

  const handleReturnToMap = () => {
    setActiveEvent(null);
    setScreen("map");
  };

  return (
    <section className="quest-shell" data-screen={screen} data-player={playerCharacter}>
      {screen === "intro" && (
        <>
          <header className="quest-start-screen quest-start-screen--desktop">
            <div className="quest-start-stage" aria-hidden="true">
              <div className="quest-start-sky" />
              <div className="quest-start-cloud quest-start-cloud--left" />
              <div className="quest-start-cloud quest-start-cloud--right" />
              <div className="quest-start-sun" />
              <div className="quest-start-milano-sign" aria-hidden="true">
                <span>MILANO</span>
              </div>
              <div className="quest-start-landmarks" aria-hidden="true">
                <div className="quest-start-duomo-asset">
                  <Image
                    src="/scene/duomo-milano-bitzee-warm-v2.png"
                    alt=""
                    width={141}
                    height={124}
                    className="quest-start-duomo-image"
                    unoptimized
                  />
                </div>
              </div>
              <div className="quest-start-trees">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="quest-start-route">
                <div className="quest-start-navigli" />
                <div className="quest-start-grass quest-start-grass--left" />
                <div className="quest-start-grass quest-start-grass--right" />
                <div className="quest-start-path" />
              </div>
            </div>

            <div className="quest-start-panel">
              <p className="quest-start-edition">LeafGreen-inspired love story</p>
              <div className="quest-start-logo">
                <span className="quest-start-logo-top">Ale & Bridget</span>
                <strong className="quest-start-logo-bottom">Version</strong>
              </div>

              <div className="quest-start-menu" role="navigation" aria-label="Start menu">
                <button type="button" className="quest-start-menu-item" onClick={handleStart}>
                  Start
                </button>
                <button type="button" className="quest-start-menu-item" onClick={handleStart}>
                  Our Journey
                </button>
                <button type="button" className="quest-start-menu-item" disabled>
                  Photo Dex
                </button>
              </div>

              <div className="quest-start-dialog">
                <p>
                  This story begins with two hearts meeting in the tall grass. Choose
                  your avatar and press start.
                </p>
              </div>

              <div className="quest-character-selector quest-character-selector--intro">
                <span>Choose your avatar</span>
                <div className="quest-character-options">
                  {CHARACTER_OPTIONS.map(({ key, label, note }) => {
                    const isActive = playerCharacter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        className="quest-character-option"
                        data-active={isActive}
                        aria-pressed={isActive}
                        onClick={() => setPlayerCharacter(key)}
                      >
                        <PixelCharacter
                          variant={key}
                          size={82}
                          className="quest-character-sprite"
                        />
                        <span className="quest-character-label">{label}</span>
                        <span className="quest-character-note">{note}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </header>

          <header className="quest-start-screen-mobile">
            <div className="quest-start-mobile-shell">
              <p className="quest-start-edition">LeafGreen-inspired love story</p>
              <div className="quest-start-logo quest-start-logo--mobile">
                <span className="quest-start-logo-top">Ale & Bridget</span>
                <strong className="quest-start-logo-bottom">Version</strong>
              </div>

              <div className="quest-start-mobile-banner" aria-hidden="true">
                <div className="quest-start-mobile-sign">
                  <span>MILANO</span>
                </div>
                <div className="quest-start-mobile-skyline">
                  <PixelLandmark
                    variant="duomo"
                    size={118}
                    className="quest-start-mobile-landmark quest-start-mobile-landmark--duomo"
                  />
                  <PixelLandmark
                    variant="castello"
                    size={102}
                    className="quest-start-mobile-landmark quest-start-mobile-landmark--castello"
                  />
                  <PixelLandmark
                    variant="tram"
                    size={88}
                    className="quest-start-mobile-landmark quest-start-mobile-landmark--tram"
                  />
                </div>
                <div className="quest-start-mobile-ground" />
                <div className="quest-start-mobile-path" />
              </div>

              <div className="quest-start-mobile-dialog">
                <p>Choose your avatar and start the journey.</p>
              </div>

              <div className="quest-start-mobile-avatars">
                {CHARACTER_OPTIONS.map(({ key, label, note }) => {
                  const isActive = playerCharacter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className="quest-start-mobile-avatar"
                      data-active={isActive}
                      aria-pressed={isActive}
                      onClick={() => setPlayerCharacter(key)}
                    >
                      <PixelCharacter
                        variant={key}
                        size={88}
                        className="quest-character-sprite"
                      />
                      <span className="quest-character-label">{label}</span>
                      <span className="quest-character-note">{note}</span>
                    </button>
                  );
                })}
              </div>

              <button type="button" className="quest-primary quest-primary--mobile" onClick={handleStart}>
                Start Journey
              </button>

              <div className="quest-start-mobile-links">
                <button type="button" className="quest-start-mobile-link" onClick={handleStart}>
                  Our Journey
                </button>
                <button type="button" className="quest-start-mobile-link" disabled>
                  Photo Dex
                </button>
              </div>
            </div>
          </header>
        </>
      )}

      {screen !== "game" && screen !== "intro" && (
        <header className="quest-hero">
          <PixelCharacter variant={playerCharacter} size={148} />
          <div className="quest-hero-copy">
            <p className="quest-prelude">A pixel tale</p>
            <h1>
              The Story of <span>Alessandro</span> & <span>Bridget</span>
            </h1>
            <p>
              Press start to hop onto the nostalgia trail. Each retro mini-game
              unlocks a slice of our story—from rooftop starts to forever vows.
            </p>
            <div className="quest-character-selector">
              <span>Choose your avatar</span>
              <div className="quest-character-options">
                {CHARACTER_OPTIONS.map(({ key, label, note }) => {
                  const isActive = playerCharacter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className="quest-character-option"
                      data-active={isActive}
                      aria-pressed={isActive}
                      onClick={() => setPlayerCharacter(key)}
                    >
                      <PixelCharacter
                        variant={key}
                        size={82}
                        className="quest-character-sprite"
                      />
                      <span className="quest-character-label">{label}</span>
                      <span className="quest-character-note">{note}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="quest-hero-stats">
              <PixelCharacter
                variant={partnerCharacter}
                size={72}
                className="quest-hero-companion"
              />
              <QuestSummary snapshot={progressSnapshot} />
            </div>
            <QuestLeaderboard
              attempts={attemptCount}
              totalHearts={heartsCollected}
              entries={leaderboardEntries}
            />
          </div>
        </header>
      )}

      {screen === "map" && (
        <QuestMap
          progress={progress}
          onSelect={handleSelectEvent}
        />
      )}

      {screen === "game" && activeEvent && (
        <QuestEventPanel
          event={QUEST_EVENTS.find((event) => event.key === activeEvent)!}
          onComplete={handleCompleteEvent}
          onExit={handleReturnToMap}
          playerCharacter={playerCharacter}
          partnerCharacter={partnerCharacter}
        />
      )}

      {screen === "ending" && (
        <div className="quest-ending">
          <h2>Quest Complete!</h2>
          <p>
            All four arcade memories are glowing. Keep replaying, unlock new dialogue,
            and let the credit roll become vows in real life.
          </p>
          <button
            type="button"
            className="quest-secondary"
            onClick={() => {
              setScreen("map");
            }}
          >
            Replay map
          </button>
        </div>
      )}
    </section>
  );
}

export default QuestGame;
