'use client';

import { useMemo, useState } from "react";

import { puzzleTiles } from "@/lib/storyConfig";

import styles from "./GameCard.module.css";

type PuzzleGameProps = {
  completed: boolean;
  onComplete: () => void;
};

function shuffledTiles() {
  return [...puzzleTiles].sort((a, b) => b.order - a.order);
}

export function PuzzleGame({ completed, onComplete }: PuzzleGameProps) {
  const initialTiles = useMemo(shuffledTiles, []);
  const [tiles, setTiles] = useState(initialTiles);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("Tocca due tessere per scambiarle e rimettere in ordine la storia.");

  const isSolved = tiles.every((tile, index) => tile.order === index + 1);

  const chooseTile = (id: string) => {
    if (completed) return;

    if (!selectedId) {
      setSelectedId(id);
      return;
    }

    if (selectedId === id) {
      setSelectedId(null);
      return;
    }

    setTiles((current) => {
      const firstIndex = current.findIndex((tile) => tile.id === selectedId);
      const secondIndex = current.findIndex((tile) => tile.id === id);
      const next = [...current];
      [next[firstIndex], next[secondIndex]] = [next[secondIndex], next[firstIndex]];
      const solved = next.every((tile, index) => tile.order === index + 1);
      setMessage(solved ? "La storia è ricomposta." : "Bene. Continua a dare forma alla sequenza.");
      if (solved) {
        window.setTimeout(onComplete, 250);
      }
      return next;
    });
    setSelectedId(null);
  };

  return (
    <article className={`${styles.gameCard} ${completed ? styles.success : ""}`}>
      <header>
        <h3>Sequenza della storia</h3>
        <p>Rimetti i cinque momenti nell&apos;ordine giusto.</p>
      </header>
      <div className={styles.puzzleGrid} role="list" aria-label="Puzzle sequence">
        {tiles.map((tile, index) => (
          <button
            key={tile.id}
            type="button"
            className={styles.tile}
            data-active={selectedId === tile.id}
            disabled={completed}
            onClick={() => chooseTile(tile.id)}
            aria-label={`Posizione ${index + 1}: ${tile.label}`}
          >
            {tile.label}
          </button>
        ))}
      </div>
      <p className={styles.status} aria-live="polite">
        {completed || isSolved ? "Completato. La storia ora è al posto giusto." : message}
      </p>
    </article>
  );
}
