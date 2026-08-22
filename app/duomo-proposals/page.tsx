import Image from "next/image";
import Link from "next/link";

import styles from "./duomo-proposals.module.css";

const proposals = [
  ["01", "Pop-up book", "Pieghe, linguette e struttura da libro aperto.", "01-pop-up-book.png"],
  ["02", "Cromolitografia", "Quinte stampate dal gusto teatrale italiano.", "02-cromolitografia.png"],
  ["03", "Shadowbox", "Strati laser-cut bianchi con ombre profonde.", "03-shadowbox.png"],
  ["04", "Maquette", "Cartone ondulato e costruzione architettonica.", "04-maquette.png"],
  ["05", "Marionette", "Grandi quinte sospese da teatro di figura.", "05-marionette.png"],
  ["06", "Origami", "Pieghe nette e guglie geometriche.", "06-origami.png"],
  ["07", "Wedding botanico", "Carta cotone, salvia e fiori molto discreti.", "07-wedding-botanico.png"],
  ["08", "Art Déco milanese", "Geometrie, petrolio e ottone anni Trenta.", "08-art-deco.png"],
  ["09", "Bianco goffrato", "Invito matrimoniale minimale e lussuoso.", "09-bianco-goffrato.png"],
  ["10", "Collage editoriale", "Carta strappata, colore e registri sfalsati.", "10-collage-editoriale.png"]
] as const;

export default function DuomoProposalsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Site Love · Direzione artistica</p>
        <h1>Dieci Duomo di carta</h1>
        <span>Tutte le proposte hanno la stessa funzione: fondale iniziale, più basso e con cielo libero per le animazioni.</span>
      </header>
      <section className={styles.grid} aria-label="Dieci proposte per il Duomo">
        {proposals.map(([number, title, description, filename]) => (
          <article className={styles.card} key={number}>
            <a href={`/duomo-proposals/${filename}`} target="_blank" rel="noreferrer">
              <div className={styles.image}>
                <Image src={`/duomo-proposals/${filename}`} alt={`Proposta ${number}: ${title}`} fill sizes="(max-width: 800px) 100vw, 50vw" />
              </div>
            </a>
            <div className={styles.copy}>
              <small>{number}</small>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </article>
        ))}
      </section>
      <Link className={styles.back} href="/">← Torna al sito</Link>
    </main>
  );
}
