'use client';

import { useCallback, useEffect, useRef, useState } from "react";

import type { PixelCharacterVariant } from "@/components/pixel/PixelCharacter";

const WIDTH = 360;
const HEIGHT = 220;
const GRAVITY = 980;
const LIFT = -320;
const PIPE_GAP = 95;
const PIPE_INTERVAL = 1800;
const HORIZONTAL_SPEED = 120;
const REQUIRED_PIPES = 5;

type BirdState = {
  y: number;
  velocity: number;
};

type Pipe = {
  id: number;
  x: number;
  gapCenter: number;
  scored: boolean;
};

let PIPE_ID = 0;

function createPipe(offset: number): Pipe {
  const minCenter = 60;
  const maxCenter = HEIGHT - 60;
  const gapCenter = Math.random() * (maxCenter - minCenter) + minCenter;
  PIPE_ID += 1;
  return {
    id: PIPE_ID,
    x: WIDTH + offset,
    gapCenter,
    scored: false
  };
}

export function FlappyLettersQuest({
  rewardHearts,
  onComplete,
  playerCharacter: _playerCharacter
}: {
  rewardHearts: number;
  onComplete: (hearts: number) => void;
  playerCharacter: PixelCharacterVariant;
}) {
  const [bird, setBird] = useState<BirdState>({ y: HEIGHT / 2, velocity: 0 });
  const [pipes, setPipes] = useState<Pipe[]>([createPipe(0), createPipe(180), createPipe(360)]);
  const [running, setRunning] = useState<boolean>(false);
  const [cleared, setCleared] = useState<number>(0);
  const [message, setMessage] = useState<string>("Press space or tap to keep the letter aloft.");

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const runningRef = useRef<boolean>(running);
  const pipesRef = useRef<Pipe[]>([]);
  const clearedRef = useRef<number>(0);

  runningRef.current = running;
  pipesRef.current = pipes;
  clearedRef.current = cleared;

  const resetGame = useCallback(() => {
    setBird({ y: HEIGHT / 2, velocity: 0 });
    const initialPipes = [createPipe(0), createPipe(180), createPipe(360)];
    setPipes(initialPipes);
    pipesRef.current = initialPipes;
    setCleared(0);
    clearedRef.current = 0;
    setRunning(false);
    setMessage("Press space or tap to keep the letter aloft.");
  }, []);

  const flap = useCallback(() => {
    setBird((prev) => ({
      y: prev.y,
      velocity: LIFT
    }));
    setRunning(true);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === " " || event.key === "ArrowUp" || event.key === "w") {
        event.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [flap]);

  useEffect(() => {
    if (!runningRef.current) {
      lastTimeRef.current = undefined;
    }

    const loop = (timestamp: number) => {
      if (!runningRef.current) {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      const lastTime = lastTimeRef.current ?? timestamp;
      const delta = (timestamp - lastTime) / 1000;
      lastTimeRef.current = timestamp;

      setBird((prev) => {
        const velocity = prev.velocity + GRAVITY * delta;
        const y = Math.max(0, Math.min(HEIGHT, prev.y + velocity * delta));
        return { y, velocity };
      });

      setPipes((prev) => {
        let nextPipes = prev
          .map((pipe) => ({
            ...pipe,
            x: pipe.x - HORIZONTAL_SPEED * delta
          }))
          .filter((pipe) => pipe.x > -60);

        while (nextPipes.length < 3) {
          const lastPipe = nextPipes[nextPipes.length - 1];
          const nextOffset = lastPipe ? lastPipe.x + 180 : 300;
          nextPipes = [...nextPipes, createPipe(nextOffset)];
        }

        pipesRef.current = nextPipes;
        return nextPipes;
      });

      setBird((prev) => {
        const headX = WIDTH / 4;
        const birdTop = prev.y - 12;
        const birdBottom = prev.y + 12;

        const hitPipe = pipesRef.current.some((pipe) => {
          const withinX = headX + 12 > pipe.x && headX - 12 < pipe.x + 40;
          const gapTop = pipe.gapCenter - PIPE_GAP / 2;
          const gapBottom = pipe.gapCenter + PIPE_GAP / 2;
          const outsideGap = birdTop < gapTop || birdBottom > gapBottom;
          return withinX && outsideGap;
        });

        if (hitPipe || birdTop <= 0 || birdBottom >= HEIGHT) {
          setMessage("Wind caught us! Tap to try again.");
          setRunning(false);
          setTimeout(resetGame, 700);
          return { y: HEIGHT / 2, velocity: 0 };
        }

        pipesRef.current = pipesRef.current.map((pipe) => {
          if (!pipe.scored && pipe.x + 30 < headX) {
            pipe.scored = true;
            setCleared((count) => count + 1);
            clearedRef.current += 1;
            setMessage("Great! Keep weaving through the skyline.");
          }
          return pipe;
        });

        if (clearedRef.current >= REQUIRED_PIPES) {
          setMessage("Letters delivered! Skyline applauds.");
          setRunning(false);
          setTimeout(() => onComplete(rewardHearts), 650);
        }

        return prev;
      });

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [onComplete, resetGame, rewardHearts]);

  return (
    <div
      className="flappy-quest"
      role="button"
      tabIndex={0}
      onMouseDown={flap}
      onTouchStart={(event) => {
        event.preventDefault();
        flap();
      }}
    >
      <div
        className="flappy-stage"
        style={{ width: WIDTH, height: HEIGHT }}
      >
        <div
          className="flappy-bird"
          style={{ transform: `translate(${WIDTH / 4}px, ${bird.y}px)` }}
        />
        {pipes.map((pipe) => (
          <div key={pipe.id} className="flappy-pipe" style={{ transform: `translateX(${pipe.x}px)` }}>
            <span
              className="pipe-top"
              style={{ height: Math.max(pipe.gapCenter - PIPE_GAP / 2, 20) }}
            />
            <span
              className="pipe-bottom"
              style={{ height: Math.max(HEIGHT - (pipe.gapCenter + PIPE_GAP / 2), 20) }}
            />
          </div>
        ))}
      </div>
      <div className="flappy-panel">
        <h3>{cleared}/{REQUIRED_PIPES} skylines cleared</h3>
        <p>{message}</p>
        <ul>
          <li>Tap / Space / ↑ to flap.</li>
          <li>Weave through {REQUIRED_PIPES} gaps to finish the delivery.</li>
          <li>Stay steady—gusts get trickier the further we go.</li>
        </ul>
      </div>
    </div>
  );
}

export default FlappyLettersQuest;
