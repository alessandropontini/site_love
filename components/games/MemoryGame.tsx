'use client';

import { useMemo, useState } from "react";

import { memoryCards } from "@/lib/storyConfig";

import styles from "./GameCard.module.css";

type MemoryGameProps = {
  completed: boolean;
  onComplete: () => void;
};

function makeDeck() {
  return [...memoryCards].sort((a, b) => a.label.localeCompare(b.label));
}

export function MemoryGame({ completed, onComplete }: MemoryGameProps) {
  const deck = useMemo(makeDeck, []);
  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [message, setMessage] = useState("Pair each fragment with its matching memory.");

  const chooseCard = (id: string) => {
    if (completed || matched.includes(id) || selected.includes(id)) return;

    const nextSelected = [...selected, id];
    setSelected(nextSelected);

    if (nextSelected.length < 2) return;

    const [firstId, secondId] = nextSelected;
    const first = deck.find((card) => card.id === firstId);
    const second = deck.find((card) => card.id === secondId);
    const isPair = first?.pair === second?.label && second?.pair === first?.label;

    if (isPair) {
      const nextMatched = [...matched, firstId, secondId];
      setMatched(nextMatched);
      setSelected([]);
      setMessage("Matched. The archive is getting clearer.");
      if (nextMatched.length === deck.length) {
        setMessage("Every memory is paired. The route continues.");
        onComplete();
      }
      return;
    }

    setMessage("Those two do not belong together yet.");
    window.setTimeout(() => setSelected([]), 650);
  };

  return (
    <article className={`${styles.gameCard} ${completed ? styles.success : ""}`}>
      <header>
        <h3>Memory pairs</h3>
        <p>Match the places and feelings that belong together.</p>
      </header>
      <div className={styles.memoryGrid} role="list" aria-label="Memory cards">
        {deck.map((card) => {
          const active = selected.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              className={styles.memoryCard}
              data-active={active}
              disabled={completed || matched.includes(card.id)}
              onClick={() => chooseCard(card.id)}
            >
              {active ? card.label : "Memory"}
            </button>
          );
        })}
      </div>
      <p className={styles.status} aria-live="polite">
        {completed ? "Complete. Every pair is saved." : message}
      </p>
    </article>
  );
}
