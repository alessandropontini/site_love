'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const COLUMNS = 6;
const ROWS = 14;
const TARGET_SEQUENCE = [1, 4, 2, 3];
const DROP_INTERVAL = 260;

type Props = {
  rewardHearts: number;
  onComplete: (hearts: number) => void;
};

export function TetrisQuest({ rewardHearts, onComplete }: Props) {
  const [column, setColumn] = useState<number>(Math.floor(COLUMNS / 2));
  const [row, setRow] = useState<number>(0);
  const [stage, setStage] = useState<number>(0);
  const [landed, setLanded] = useState<number[]>([]);
  const [message, setMessage] = useState<string>("Align the block with the glowing lane.");
  const [isFastDrop, setIsFastDrop] = useState<boolean>(false);

  const columnRef = useRef(column);
  const stageRef = useRef(stage);
  const fastRef = useRef(isFastDrop);

  columnRef.current = column;
  stageRef.current = stage;
  fastRef.current = isFastDrop;

  const targetColumn = stage < TARGET_SEQUENCE.length ? TARGET_SEQUENCE[stage] : null;

  useEffect(() => {
    if (stage >= TARGET_SEQUENCE.length) {
      const timer = setTimeout(() => onComplete(rewardHearts), 650);
      return () => clearTimeout(timer);
    }

    setRow(0);
    setColumn(targetColumn ?? Math.floor(COLUMNS / 2));
  }, [stage, targetColumn, onComplete, rewardHearts]);

  useEffect(() => {
    if (stage >= TARGET_SEQUENCE.length) return undefined;

    const interval = setInterval(() => {
      setRow((currentRow) => {
        if (stageRef.current >= TARGET_SEQUENCE.length) {
          return currentRow;
        }

        const maxRow = ROWS - 1;
        if (currentRow >= maxRow) {
          const target = TARGET_SEQUENCE[stageRef.current];
          const atTarget = columnRef.current === target;
          if (atTarget) {
            setLanded((prev) => [...prev, target]);
            setStage((prev) => prev + 1);
            setMessage("Perfect drop! Another memory clicks into place.");
          } else {
            setMessage("Missed the beat—slide into the glowing lane.");
          }
          return 0;
        }
        return currentRow + (fastRef.current ? 2 : 1);
      });
    }, fastRef.current ? DROP_INTERVAL / 2 : DROP_INTERVAL);

    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (stageRef.current >= TARGET_SEQUENCE.length) return;

      if (event.key === "ArrowLeft" || event.key === "a") {
        setColumn((prev) => Math.max(0, prev - 1));
      }
      if (event.key === "ArrowRight" || event.key === "d") {
        setColumn((prev) => Math.min(COLUMNS - 1, prev + 1));
      }
      if (event.key === "ArrowDown" || event.key === "s") {
        setIsFastDrop(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "s") {
        setIsFastDrop(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const landedPositions = useMemo(
    () =>
      landed.map((landedColumn, index) => ({
        column: landedColumn,
        row: ROWS - 1 - index * 2
      })),
    [landed]
  );

  const renderCell = useCallback(
    (cellRow: number, cellColumn: number) => {
      const isLanded = landedPositions.some(
        (piece) => piece.row === cellRow && piece.column === cellColumn
      );

      const isFalling = row === cellRow && column === cellColumn && stage < TARGET_SEQUENCE.length;
      const isTarget = targetColumn !== null && cellColumn === targetColumn && cellRow === ROWS - 1;
      const isGuideLane = targetColumn !== null && cellColumn === targetColumn && cellRow > ROWS - 6;

      const classes = [
        "tetris-cell",
        isGuideLane ? "lane" : "",
        isTarget ? "target" : "",
        isFalling ? "falling" : "",
        isLanded ? "landed" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return <div key={`${cellRow}-${cellColumn}`} className={classes} />;
    },
    [column, landedPositions, row, stage, targetColumn]
  );

  return (
    <div className="tetris-quest">
      <div className="tetris-grid">
        {Array.from({ length: ROWS }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="tetris-row">
            {Array.from({ length: COLUMNS }).map((_, columnIndex) =>
              renderCell(rowIndex, columnIndex)
            )}
          </div>
        ))}
      </div>
      <div className="tetris-panel">
        <h3>Stage {Math.min(stage + 1, TARGET_SEQUENCE.length)}/
        {TARGET_SEQUENCE.length}</h3>
        <p>{message}</p>
        <ul>
          <li>← → : slide block</li>
          <li>↓ : fast drop</li>
          <li>Stack {TARGET_SEQUENCE.length} hearts to advance.</li>
        </ul>
      </div>
    </div>
  );
}

export default TetrisQuest;
