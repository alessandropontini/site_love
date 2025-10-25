'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PixelCharacter,
  type PixelCharacterVariant
} from "@/components/pixel/PixelCharacter";

const COLUMNS = 6;
const ROWS = 14;
const DROP_INTERVAL = 420;
const FAST_DROP_INTERVAL = 90;
const POINT_TARGET = 50;

type Point = { x: number; y: number };

type Tetromino = {
  key: string;
  rotations: Point[][];
};

type Piece = {
  shapeIndex: number;
  rotation: number;
  position: Point;
};

type GameState = {
  board: number[][];
  active: Piece;
  nextShape: number;
  points: number;
  lines: number;
  message: string;
  completed: boolean;
};

const TETROMINOES: Tetromino[] = [
  {
    key: "i",
    rotations: [
      [
        { x: -2, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ],
      [
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 }
      ]
    ]
  },
  {
    key: "o",
    rotations: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ]
    ]
  },
  {
    key: "t",
    rotations: [
      [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 }
      ],
      [
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 0 }
      ],
      [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: -1 }
      ],
      [
        { x: -1, y: 0 },
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1 }
      ]
    ]
  },
  {
    key: "l",
    rotations: [
      [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 }
      ],
      [
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: -1 }
      ],
      [
        { x: -1, y: -1 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ],
      [
        { x: -1, y: 1 },
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1 }
      ]
    ]
  },
  {
    key: "j",
    rotations: [
      [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 1 }
      ],
      [
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ],
      [
        { x: 1, y: -1 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 }
      ],
      [
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 0, y: 1 }
      ]
    ]
  },
  {
    key: "s",
    rotations: [
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 1 }
      ],
      [
        { x: 0, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 }
      ]
    ]
  },
  {
    key: "z",
    rotations: [
      [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ],
      [
        { x: 1, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 }
      ]
    ]
  }
];

const PIECE_CLASSES = TETROMINOES.map((shape) => `piece-${shape.key}`);

function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
}

function randomShapeIndex(): number {
  return Math.floor(Math.random() * TETROMINOES.length);
}

function spawnPiece(shapeIndex: number): Piece {
  return {
    shapeIndex,
    rotation: 0,
    position: { x: Math.floor(COLUMNS / 2) - 1, y: -1 }
  };
}

function getBlocks(piece: Piece, rotationOverride?: number, positionOverride?: Point): Point[] {
  const shape = TETROMINOES[piece.shapeIndex];
  const rotation = shape.rotations[rotationOverride ?? piece.rotation];
  const position = positionOverride ?? piece.position;
  return rotation.map((block) => ({
    x: block.x + position.x,
    y: block.y + position.y
  }));
}

function isValidPosition(board: number[][], piece: Piece): boolean {
  return getBlocks(piece).every((block) => {
    if (block.x < 0 || block.x >= COLUMNS) return false;
    if (block.y >= ROWS) return false;
    if (block.y < 0) return true;
    return board[block.y][block.x] === 0;
  });
}

function mergePiece(board: number[][], piece: Piece): number[][] {
  const clone = board.map((row) => [...row]);
  getBlocks(piece).forEach((block) => {
    if (block.y >= 0 && block.y < ROWS && block.x >= 0 && block.x < COLUMNS) {
      clone[block.y][block.x] = piece.shapeIndex + 1;
    }
  });
  return clone;
}

function clearLines(board: number[][]): { board: number[][]; cleared: number } {
  const remaining: number[][] = [];
  let cleared = 0;
  for (let row = 0; row < ROWS; row += 1) {
    if (board[row].every((cell) => cell !== 0)) {
      cleared += 1;
    } else {
      remaining.push(board[row]);
    }
  }
  const newRows = Array.from({ length: cleared }, () => Array(COLUMNS).fill(0));
  return { board: [...newRows, ...remaining], cleared };
}

type Props = {
  rewardHearts: number;
  onComplete: (hearts: number) => void;
  playerCharacter: PixelCharacterVariant;
  partnerCharacter: PixelCharacterVariant;
};

export function TetrisQuest({
  rewardHearts,
  onComplete,
  playerCharacter,
  partnerCharacter: _partnerCharacter
}: Props) {
  const playerName = playerCharacter === "alessandro" ? "Alessandro" : "Bridget";
  const [game, setGame] = useState<GameState>(() => ({
    board: createBoard(),
    active: spawnPiece(randomShapeIndex()),
    nextShape: randomShapeIndex(),
    points: 0,
    lines: 0,
    message: "Stack the pieces like classic Tetris. Reach 50 hearts to unlock the memory.",
    completed: false
  }));
  const [isFastDrop, setIsFastDrop] = useState(false);

  const applyLock = useCallback(
    (state: GameState, lockedBoard: number[][]): GameState => {
      const { nextShape, points, lines } = state;
      const { board: clearedBoard, cleared } = clearLines(lockedBoard);
      const earned = 1 + cleared * 4;
      const updatedPoints = points + earned;
      const finished = updatedPoints >= POINT_TARGET;

      const spawned = spawnPiece(nextShape);
      if (!isValidPosition(clearedBoard, spawned)) {
        return {
          board: createBoard(),
          active: spawnPiece(randomShapeIndex()),
          nextShape: randomShapeIndex(),
          points: 0,
          lines: 0,
          message: "We stacked too high! Resetting tower.",
          completed: false
        };
      }

      const upcoming = randomShapeIndex();

      return {
        board: clearedBoard,
        active: spawned,
        nextShape: upcoming,
        points: Math.min(updatedPoints, POINT_TARGET),
        lines: lines + cleared,
        message: finished
          ? "Fifty hearts stacked! The memory lights up."
          : cleared
          ? `Line clear! +${earned} hearts locked.`
          : "Heart locked in—keep stacking!",
        completed: finished
      };
    },
    []
  );

  const step = useCallback(() => {
    setGame((current) => {
      if (current.completed) return current;
      const moved: Piece = {
        ...current.active,
        position: { x: current.active.position.x, y: current.active.position.y + 1 }
      };
      if (isValidPosition(current.board, moved)) {
        return { ...current, active: moved };
      }
      const lockedBoard = mergePiece(current.board, current.active);
      return applyLock(current, lockedBoard);
    });
  }, [applyLock]);

  const moveHorizontal = useCallback((direction: number) => {
    setGame((current) => {
      if (current.completed) return current;
      const moved: Piece = {
        ...current.active,
        position: {
          x: current.active.position.x + direction,
          y: current.active.position.y
        }
      };
      if (!isValidPosition(current.board, moved)) {
        return current;
      }
      return { ...current, active: moved };
    });
  }, []);

  const rotatePiece = useCallback((direction: number) => {
    setGame((current) => {
      if (current.completed) return current;
      const shape = TETROMINOES[current.active.shapeIndex];
      const rotations = shape.rotations.length;
      const nextRotation = (current.active.rotation + direction + rotations) % rotations;
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        const candidate: Piece = {
          ...current.active,
          rotation: nextRotation,
          position: { x: current.active.position.x + kick, y: current.active.position.y }
        };
        if (isValidPosition(current.board, candidate)) {
          return { ...current, active: candidate };
        }
      }
      return current;
    });
  }, []);

  const hardDrop = useCallback(() => {
    setGame((current) => {
      if (current.completed) return current;
      let falling: Piece = current.active;
      while (
        isValidPosition(current.board, {
          ...falling,
          position: { x: falling.position.x, y: falling.position.y + 1 }
        })
      ) {
        falling = {
          ...falling,
          position: { x: falling.position.x, y: falling.position.y + 1 }
        };
      }

      const lockedBoard = mergePiece(current.board, falling);
      return applyLock({ ...current, active: falling }, lockedBoard);
    });
  }, [applyLock]);

  useEffect(() => {
    if (game.completed) return undefined;
    const interval = setInterval(step, isFastDrop ? FAST_DROP_INTERVAL : DROP_INTERVAL);
    return () => clearInterval(interval);
  }, [isFastDrop, step, game.completed]);

  useEffect(() => {
    if (!game.completed) return undefined;
    const timer = setTimeout(() => onComplete(rewardHearts), 600);
    return () => clearTimeout(timer);
  }, [game.completed, onComplete, rewardHearts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
        case "a":
          event.preventDefault();
          moveHorizontal(-1);
          break;
        case "ArrowRight":
        case "d":
          event.preventDefault();
          moveHorizontal(1);
          break;
        case "ArrowUp":
        case "w":
          event.preventDefault();
          rotatePiece(1);
          break;
        case " ":
        case "Spacebar":
          event.preventDefault();
          hardDrop();
          break;
        case "ArrowDown":
        case "s":
          event.preventDefault();
          setIsFastDrop(true);
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "s") {
        setIsFastDrop(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [hardDrop, moveHorizontal, rotatePiece]);

  const activeBlocks = useMemo(() => getBlocks(game.active), [game.active]);

  const activeBlockSet = useMemo(() => {
    const map = new Map<string, boolean>();
    activeBlocks.forEach((block) => {
      if (block.y >= 0) {
        map.set(`${block.x}-${block.y}`, true);
      }
    });
    return map;
  }, [activeBlocks]);

  const nextPreviewBlocks = useMemo(() => {
    const previewPiece: Piece = {
      shapeIndex: game.nextShape,
      rotation: 0,
      position: { x: 1, y: 1 }
    };
    return getBlocks(previewPiece);
  }, [game.nextShape]);

  return (
    <div className="tetris-quest">
      <div className="tetris-grid">
        {game.board.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="tetris-row">
            {row.map((cell, columnIndex) => {
              const key = `${columnIndex}-${rowIndex}`;
              const isActive = activeBlockSet.has(key);
              const filledShapeIndex = isActive
                ? game.active.shapeIndex
                : cell > 0
                  ? cell - 1
                  : null;
              const classes = ["tetris-cell"];
              if (filledShapeIndex !== null) {
                classes.push(PIECE_CLASSES[filledShapeIndex]);
              }
              if (isActive) {
                classes.push("active");
              } else if (cell > 0) {
                classes.push("locked");
              }
              return <div key={key} className={classes.join(" ")} />;
            })}
          </div>
        ))}
      </div>
      <div className="tetris-panel">
        <div className="tetris-player-card">
          <PixelCharacter variant={playerCharacter} size={70} className="tetris-player-sprite" />
          <span>{playerName} stacking memories</span>
        </div>
        <h3>Hearts locked: {game.points}/{POINT_TARGET}</h3>
        <p>{game.message}</p>
        <div className="tetris-next">
          <span>Next piece</span>
          <div className="tetris-preview">
            {Array.from({ length: 4 }).map((_, previewRow) => (
              <div key={`preview-row-${previewRow}`} className="tetris-preview-row">
                {Array.from({ length: 4 }).map((__, previewColumn) => {
                  const filled = nextPreviewBlocks.some(
                    (block) => block.x === previewColumn && block.y === previewRow
                  );
                  const classes = ["tetris-preview-cell"];
                  if (filled) {
                    classes.push(PIECE_CLASSES[game.nextShape]);
                  }
                  return <div key={`preview-${previewColumn}-${previewRow}`} className={classes.join(" ")} />;
                })}
              </div>
            ))}
          </div>
        </div>
        <ul>
          <li>← → : move</li>
          <li>↑ / W : rotate</li>
          <li>↓ : soft drop</li>
          <li>Space: hard drop</li>
        </ul>
      </div>
    </div>
  );
}

export default TetrisQuest;
