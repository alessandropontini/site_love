'use client';

import { useState } from "react";

import { quizQuestions } from "@/lib/storyConfig";

import styles from "./GameCard.module.css";

type QuizGameProps = {
  completed: boolean;
  onComplete: () => void;
};

export function QuizGame({ completed, onComplete }: QuizGameProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("Scegli le risposte che indicano la strada.");

  const allAnswered = quizQuestions.every((_, index) => answers[index]);
  const allCorrect = quizQuestions.every(
    (question, index) => answers[index] === question.answer
  );

  const submit = () => {
    if (!allAnswered) {
      setMessage("Rispondi a tutte le domande prima di controllare il segnale.");
      return;
    }
    if (!allCorrect) {
      setMessage("Quasi. Rileggi gli indizi e prova a sintonizzarti di nuovo.");
      return;
    }
    setMessage("Segnale trovato. Il prossimo capitolo è aperto.");
    onComplete();
  };

  return (
    <article className={`${styles.gameCard} ${completed ? styles.success : ""}`}>
      <header>
        <h3>Quiz delle affinità</h3>
        <p>Tre piccole scelte per trovare la frequenza del viaggio.</p>
      </header>
      {quizQuestions.map((question, questionIndex) => (
        <fieldset key={question.prompt} className={styles.actions}>
          <legend>{question.prompt}</legend>
          <div className={styles.optionGrid}>
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.option}
                data-selected={answers[questionIndex] === option}
                onClick={() =>
                  setAnswers((current) => ({
                    ...current,
                    [questionIndex]: option
                  }))
                }
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <p className={styles.status} aria-live="polite">
        {completed ? "Completato. Questo capitolo resta aperto." : message}
      </p>
      <button type="button" className={styles.button} onClick={submit} disabled={completed}>
        Controlla le risposte
      </button>
    </article>
  );
}
