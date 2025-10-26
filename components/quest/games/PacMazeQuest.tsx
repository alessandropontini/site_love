'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  PixelCharacter,
  type PixelCharacterVariant
} from "@/components/pixel/PixelCharacter";

type Position = { x: number; y: number };

const MOVE_INTERVAL = 260;
const GHOST_STEP_FREQUENCY = 3;

const GRID_TEMPLATE = [
  "#########",
  "#..*...*#",
  "#.###.#.#",
  "#.#...#.#",
  "#...#...#",
  "#.#.###.#",
  "#*...*..#",
  "#########"
];

const PLAYER_START: Position = { x: 1, y: 1 };
const GHOST_START: Position = { x: 7, y: 6 };

type GridState = ReturnType<typeof parseGrid>;

const DIR_UP: Position = { x: 0, y: -1 };
const DIR_DOWN: Position = { x: 0, y: 1 };
const DIR_LEFT: Position = { x: -1, y: 0 };
const DIR_RIGHT: Position = { x: 1, y: 0 };

const KEY_TO_DIRECTION: Record<string, Position> = {
  ArrowUp: DIR_UP,
  w: DIR_UP,
  ArrowDown: DIR_DOWN,
  s: DIR_DOWN,
  ArrowLeft: DIR_LEFT,
  a: DIR_LEFT,
  ArrowRight: DIR_RIGHT,
  d: DIR_RIGHT
};

function parseGrid() {
  const walls = new Set<string>();
  const hearts = new Set<string>();

  GRID_TEMPLATE.forEach((row, y) => {
    row.split("").forEach((cell, x) => {
      if (cell === "#") {
        walls.add(`${x}-${y}`);
      }
      if (cell === "*") {
        hearts.add(`${x}-${y}`);
      }
    });
  });

  return { width: GRID_TEMPLATE[0].length, height: GRID_TEMPLATE.length, walls, hearts };
}

export function PacMazeQuest({
  rewardHearts,
  onComplete,
  playerCharacter,
  partnerCharacter: _partnerCharacter
}: {
  rewardHearts: number;
  onComplete: (hearts: number) => void;
  playerCharacter: PixelCharacterVariant;
  partnerCharacter: PixelCharacterVariant;
}) {
  const heroLabel = playerCharacter === "alessandro" ? "Alessandro" : "Bridget";
  const gridRef = useRef<GridState>(parseGrid());
  const initialHeartsRef = useRef<number>(gridRef.current.hearts.size);
  const [player, setPlayer] = useState<Position>(PLAYER_START);
  const [ghost, setGhost] = useState<Position>(GHOST_START);
  const [hearts, setHearts] = useState<Set<string>>(() => new Set(gridRef.current.hearts));
  const [status, setStatus] = useState<string>(
    () => `Collect every heart and dodge the doubts, ${heroLabel}.`
  );
  const [shake, setShake] = useState<boolean>(false);
  const [activeDirection, setActiveDirection] = useState<Position | null>(null);

  const ghostLagRef = useRef<number>(0);
  const resetTimeoutRef = useRef<number>();
  const frameRef = useRef<number>();
  const lastTimestampRef = useRef<number>();
  const stepAccumulatorRef = useRef<number>(0);

  const remaining = hearts.size;
  const cleared = remaining === 0;

  useEffect(() => {
    if (!cleared) return;
    const timer = setTimeout(() => onComplete(rewardHearts), 600);
    return () => clearTimeout(timer);
  }, [cleared, onComplete, rewardHearts]);

  useEffect(() => {
    if (hearts.size === initialHeartsRef.current && !cleared) {
      setStatus(`Collect every heart and dodge the doubts, ${heroLabel}.`);
    }
  }, [heroLabel, hearts.size, cleared]);

  const resetGame = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = undefined;
    }
    const freshGrid = parseGrid();
    gridRef.current = freshGrid;
    initialHeartsRef.current = freshGrid.hearts.size;
    ghostLagRef.current = 0;
    setPlayer(PLAYER_START);
    setGhost(GHOST_START);
    setHearts(new Set(freshGrid.hearts));
    setStatus(`Maze reset—walls and hearts refreshed, ${heroLabel}.`);
    setShake(false);
    setActiveDirection(null);
  }, [heroLabel]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const tryMove = useCallback(
    (from: Position, direction: Position) => {
      const next: Position = {
        x: from.x + direction.x,
        y: from.y + direction.y
      };
      if (gridRef.current.walls.has(`${next.x}-${next.y}`)) {
        return from;
      }
      return next;
    },
    []
  );

  const moveGhost = useCallback(
    (currentGhost: Position, hero: Position) => {
      const candidates = [DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT]
        .map((direction) => {
          const next = tryMove(currentGhost, direction);
          if (next.x === currentGhost.x && next.y === currentGhost.y) {
            return null;
          }
          const distance = Math.abs(hero.x - next.x) + Math.abs(hero.y - next.y);
          const jitter = Math.random() * 2.2;
          return { next, score: distance - jitter };
        })
        .filter((value): value is { next: Position; score: number } => value !== null)
        .sort((a, b) => a.score - b.score);

      if (!candidates.length) {
        return currentGhost;
      }

      return candidates[0].next;
    },
    [tryMove]
  );

  const attemptMove = useCallback(
    (direction: Position) => {
      if (cleared) return;
      setPlayer((current) => {
        const next = tryMove(current, direction);
        if (next.x === current.x && next.y === current.y) {
          return current;
        }

        const key = `${next.x}-${next.y}`;
        setHearts((prev) => {
          if (!prev.has(key)) return prev;
          const updated = new Set(prev);
          updated.delete(key);
          setStatus(
            updated.size
              ? `Keep going, ${heroLabel}!`
              : `You did it, ${heroLabel}! Every heart is yours.`
          );
          return updated;
        });

        ghostLagRef.current += 1;

        setGhost((prevGhost) => {
          const shouldMoveGhost = ghostLagRef.current % GHOST_STEP_FREQUENCY === 0;
          const candidate = shouldMoveGhost ? moveGhost(prevGhost, next) : prevGhost;

          if (candidate.x === next.x && candidate.y === next.y) {
            setShake(true);
            setTimeout(() => setShake(false), 360);
            setStatus(`Doubts caught us—resetting, ${heroLabel}.`);
            ghostLagRef.current = 0;
            setActiveDirection(null);
            if (resetTimeoutRef.current) {
              clearTimeout(resetTimeoutRef.current);
            }
            resetTimeoutRef.current = window.setTimeout(() => {
              resetGame();
              setStatus(`Back in the maze. Every wall is back up—keep cruising, ${heroLabel}.`);
            }, 220);
            return GHOST_START;
          }

          return candidate;
        });

        return next;
      });
    },
    [cleared, heroLabel, moveGhost, resetGame, tryMove]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction || cleared) return;
      event.preventDefault();
      setActiveDirection(direction);
      attemptMove(direction);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction) return;
      event.preventDefault();
      setActiveDirection((current) => {
        if (!current) return current;
        return current.x === direction.x && current.y === direction.y ? null : current;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [attemptMove, cleared]);

  useEffect(() => {
    const stepMs = MOVE_INTERVAL;

    const loop = (timestamp: number) => {
      if (cleared) {
        stepAccumulatorRef.current = 0;
        lastTimestampRef.current = timestamp;
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastTimestampRef.current === undefined) {
        lastTimestampRef.current = timestamp;
      }

      const delta = Math.min(180, timestamp - (lastTimestampRef.current ?? timestamp));
      lastTimestampRef.current = timestamp;

      if (activeDirection) {
        stepAccumulatorRef.current += delta;
        while (stepAccumulatorRef.current >= stepMs) {
          attemptMove(activeDirection);
          stepAccumulatorRef.current -= stepMs;
        }
      } else {
        stepAccumulatorRef.current = 0;
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
      lastTimestampRef.current = undefined;
      stepAccumulatorRef.current = 0;
    };
  }, [activeDirection, attemptMove, cleared]);

  useEffect(() => {
    if (cleared) {
      setActiveDirection(null);
    }
  }, [cleared]);

  const renderCell = useCallback(
    (x: number, y: number) => {
      const isBorder = GRID_TEMPLATE[y][x] === "#";
      const key = `${x}-${y}`;
      const containsHeart = hearts.has(key);
      const containsPlayer = player.x === x && player.y === y;
      const containsGhost = ghost.x === x && ghost.y === y;
      const playerVariantClass =
        containsPlayer && playerCharacter === "alessandro" ? "player-alessandro" : containsPlayer ? "player-bridget" : "";

      const className = [
        "pac-cell",
        isBorder ? "wall" : "",
        containsHeart ? "heart" : "",
        containsPlayer ? "player" : "",
        playerVariantClass,
        containsGhost ? "ghost" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return <div key={key} className={className} />;
    },
    [ghost, hearts, player, playerCharacter]
  );

  const gridRows = useMemo(
    () =>
      GRID_TEMPLATE.map((row, y) => (
        <div key={`row-${y}`} className="pac-row">
          {row.split("").map((_, x) => renderCell(x, y))}
        </div>
      )),
    [renderCell]
  );

  return (
    <div className={["pac-quest", shake ? "shake" : ""].join(" ").trim()}>
      <div className="pac-grid">{gridRows}</div>
      <div className="pac-panel">
        <div className="pac-player-card">
          <PixelCharacter variant={playerCharacter} size={64} className="pac-player-sprite" />
          <span>{heroLabel} is on maze duty</span>
        </div>
        <h3>Hearts left: {remaining}</h3>
        <p>{status}</p>
        <ul>
          <li>Hold arrows / WASD to glide through the maze.</li>
          <li>The neon doubt only moves every third beat.</li>
          <li>If it tags you, the maze redraws—dash again from the start.</li>
        </ul>
      </div>
    </div>
  );
}

export default PacMazeQuest;
