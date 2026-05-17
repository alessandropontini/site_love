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
  const [message, setMessage] = useState("Choose the answers that fit the route.");

  const allAnswered = quizQuestions.every((_, index) => answers[index]);
  const allCorrect = quizQuestions.every(
    (question, index) => answers[index] === question.answer
  );

  const submit = () => {
    if (!allAnswered) {
      setMessage("Answer every question before checking the signal.");
      return;
    }
    if (!allCorrect) {
      setMessage("Almost. Revisit the details and tune the signal again.");
      return;
    }
    setMessage("Signal locked. The next chapter is open.");
    onComplete();
  };

  return (
    <article className={`${styles.gameCard} ${completed ? styles.success : ""}`}>
      <header>
        <h3>Signal quiz</h3>
        <p>Three small choices set the tone for the journey.</p>
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
        {completed ? "Complete. This chapter stays unlocked." : message}
      </p>
      <button type="button" className={styles.button} onClick={submit} disabled={completed}>
        Check answers
      </button>
    </article>
  );
}
