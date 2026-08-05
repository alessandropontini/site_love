import styles from "@/components/story/StoryShell.module.css";

type FinalRevealProps = {
  unlocked: boolean;
  onReset: () => void;
};

export function FinalReveal({ unlocked, onReset }: FinalRevealProps) {
  return (
    <div className={styles.finalReveal} data-unlocked={unlocked}>
      <span className={styles.eyebrow}>{unlocked ? "Sbloccato" : "Bloccato"}</span>
      <h3>{unlocked ? "La prossima avventura è nostra" : "Il finale è ancora chiuso"}</h3>
      <p>
        {unlocked
          ? "Ogni indizio e ogni scelta portano qui: questa storia continua perché, un passo alla volta, continuate a scegliervi."
          : "Completa i quattro mini-game per aprire il finale."}
      </p>
      {unlocked && (
        <div className={styles.promiseBox}>
          <strong>Alessandro & Bridget</strong>
          <span>Continuare?</span>
          <button type="button" onClick={onReset} aria-label="Rigioca tutta la storia">
            Rigioca la storia
          </button>
        </div>
      )}
    </div>
  );
}
