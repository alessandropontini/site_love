"use client";

import { useState } from "react";
import Link from "next/link";

import styles from "./sun-proposals.module.css";

const proposals = [
  {
    id: "rosette",
    number: "01",
    title: "Rosone del Duomo",
    description: "Un sole-raggiera ispirato ai rosoni gotici. Elegante e molto legato alla scena."
  },
  {
    id: "marionette",
    number: "02",
    title: "Sole marionetta",
    description: "Disco e raggi separati, appesi con due fili visibili. Più teatrale e giocoso."
  },
  {
    id: "chromolithograph",
    number: "03",
    title: "Sole cromolitografico",
    description: "Volto illustrato e stampa rétro, come una tavola teatrale dei primi del Novecento."
  },
  {
    id: "mechanical",
    number: "04",
    title: "Sole meccanico",
    description: "Cerchi di cartone concentrici e raggi dentati, quasi un piccolo automa scenico."
  }
] as const;

export default function SunProposalsPage() {
  const [night, setNight] = useState<string | null>(null);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Site Love · Direzione artistica</p>
        <h1>Quattro proposte per il sole</h1>
        <span>Tocca ogni sole: scende dietro il teatro e la sua scena diventa notte.</span>
      </header>
      <section className={styles.grid} aria-label="Proposte per il sole interattivo">
        {proposals.map((proposal) => {
          const isNight = night === proposal.id;
          return (
            <article className={styles.card} data-night={isNight ? "true" : "false"} key={proposal.id}>
              <div className={styles.stage}>
                <span className={styles.sky} />
                <button
                  type="button"
                  className={`${styles.sun} ${styles[proposal.id]}`}
                  onClick={() => setNight(isNight ? null : proposal.id)}
                  aria-pressed={isNight}
                  aria-label={`Prova ${proposal.title}`}
                >
                  <span className={styles.rays} />
                  <span className={styles.disc} />
                </button>
                <span className={styles.skyline} />
                <span className={styles.curtainTop} />
                <span className={styles.curtainLeft} />
                <span className={styles.curtainRight} />
              </div>
              <div className={styles.copy}>
                <small>{proposal.number}</small>
                <h2>{proposal.title}</h2>
                <p>{proposal.description}</p>
              </div>
            </article>
          );
        })}
      </section>
      <Link className={styles.back} href="/">← Torna al sito</Link>
    </main>
  );
}
