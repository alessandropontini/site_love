'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { PixelCharacterVariant } from "@/components/pixel/PixelCharacter";

type Position = { x: number; y: number };

const MOVE_INTERVAL = 210;

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

const GRID = parseGrid();

function isWall(position: Position) {
  return GRID.walls.has(`${position.x}-${position.y}`);
}

export function PacMazeQuest({
  rewardHearts,
  onComplete,
  playerCharacter
}: {
  rewardHearts: number;
  onComplete: (hearts: number) => void;
  playerCharacter: PixelCharacterVariant;
}) {
  const heroLabel = playerCharacter === "alessandro" ? "Alessandro" : "Bridget";
  const [player, setPlayer] = useState<Position>(PLAYER_START);
  const [ghost, setGhost] = useState<Position>(GHOST_START);
  const [hearts, setHearts] = useState<Set<string>>(new Set(GRID.hearts));
  const [status, setStatus] = useState<string>(
    () => `Collect every heart and dodge the doubts, ${heroLabel}.`
  );
  const [shake, setShake] = useState<boolean>(false);
  const [activeDirection, setActiveDirection] = useState<Position | null>(null);

  const ghostLagRef = useRef<number>(0);

  const remaining = hearts.size;
  const cleared = remaining === 0;

  useEffect(() => {
    if (!cleared) return;
    const timer = setTimeout(() => onComplete(rewardHearts), 600);
    return () => clearTimeout(timer);
  }, [cleared, onComplete, rewardHearts]);

  useEffect(() => {
    if (hearts.size === GRID.hearts.size && !cleared) {
      setStatus(`Collect every heart and dodge the doubts, ${heroLabel}.`);
    }
  }, [heroLabel, hearts.size, cleared]);

  const tryMove = useCallback(
    (from: Position, direction: Position) => {
      const next: Position = {
        x: from.x + direction.x,
        y: from.y + direction.y
      };
      if (isWall(next)) {
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
          const jitter = Math.random() * 1.25;
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
          const shouldMoveGhost = ghostLagRef.current % 2 === 0;
          const candidate = shouldMoveGhost ? moveGhost(prevGhost, next) : prevGhost;

          if (candidate.x === next.x && candidate.y === next.y) {
            setShake(true);
            setTimeout(() => setShake(false), 360);
            setStatus(`Doubts caught us—resetting, ${heroLabel}.`);
            ghostLagRef.current = 0;
            setActiveDirection(null);
            setTimeout(() => {
              setPlayer(PLAYER_START);
              setGhost(GHOST_START);
              setHearts(new Set(GRID.hearts));
              setStatus(`Back in the maze. Stay nimble, ${heroLabel}.`);
            }, 220);
            return GHOST_START;
          }

          return candidate;
        });

        return next;
      });
    },
    [cleared, heroLabel, moveGhost, tryMove]
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
    if (!activeDirection || cleared) return;
    const interval = setInterval(() => {
      attemptMove(activeDirection);
    }, MOVE_INTERVAL);
    return () => clearInterval(interval);
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

      const className = [
        "pac-cell",
        isBorder ? "wall" : "",
        containsHeart ? "heart" : "",
        containsPlayer ? "player" : "",
        containsGhost ? "ghost" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return <div key={key} className={className} />;
    },
    [ghost, hearts, player]
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
        <h3>Hearts left: {remaining}</h3>
        <p>{status}</p>
        <ul>
          <li>Hold arrows / WASD to glide through the maze.</li>
          <li>The neon doubt now moves every other beat.</li>
          <li>Snag every heart to unlock the next memory.</li>
        </ul>
      </div>
    </div>
  );
}

export default PacMazeQuest;
