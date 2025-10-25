'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

type Position = { x: number; y: number };

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
  onComplete
}: {
  rewardHearts: number;
  onComplete: (hearts: number) => void;
}) {
  const [player, setPlayer] = useState<Position>(PLAYER_START);
  const [ghost, setGhost] = useState<Position>(GHOST_START);
  const [hearts, setHearts] = useState<Set<string>>(new Set(GRID.hearts));
  const [status, setStatus] = useState<string>("Collect every heart and dodge the doubts.");
  const [shake, setShake] = useState<boolean>(false);

  const remaining = hearts.size;
  const cleared = remaining === 0;

  useEffect(() => {
    if (!cleared) return;
    const timer = setTimeout(() => onComplete(rewardHearts), 600);
    return () => clearTimeout(timer);
  }, [cleared, onComplete, rewardHearts]);

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
      const directions: Position[] = [
        { x: hero.x < currentGhost.x ? -1 : 1, y: 0 },
        { x: 0, y: hero.y < currentGhost.y ? -1 : 1 },
        { x: hero.x > currentGhost.x ? 1 : -1, y: 0 },
        { x: 0, y: hero.y > currentGhost.y ? 1 : -1 }
      ];

      for (const direction of directions) {
        const next = tryMove(currentGhost, direction);
        if (next.x !== currentGhost.x || next.y !== currentGhost.y) {
          return next;
        }
      }

      return currentGhost;
    },
    [tryMove]
  );

  useEffect(() => {
    if (cleared) return;

    const handleKey = (event: KeyboardEvent) => {
      const directions: Record<string, Position> = {
        ArrowUp: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        d: { x: 1, y: 0 }
      };

      const direction = directions[event.key];
      if (!direction) return;

      event.preventDefault();

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
          setStatus(updated.size ? "Keep going—more hearts await!" : "You did it! Every heart is yours.");
          return updated;
        });

        setGhost((prevGhost) => {
          const movedGhost = moveGhost(prevGhost, next);
          if (movedGhost.x === next.x && movedGhost.y === next.y) {
            setShake(true);
            setTimeout(() => setShake(false), 400);
            setStatus("Doubts caught us—resetting positions!");
            setTimeout(() => {
              setPlayer(PLAYER_START);
              setGhost(GHOST_START);
              setStatus("Back in the maze. Stay nimble!");
            }, 200);
            return GHOST_START;
          }
          return movedGhost;
        });

        return next;
      });
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cleared, moveGhost, tryMove]);

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
          <li>Use arrows / WASD to move.</li>
          <li>Every turn the neon doubt slides closer.</li>
          <li>Collect all hearts to escape the maze.</li>
        </ul>
      </div>
    </div>
  );
}

export default PacMazeQuest;
