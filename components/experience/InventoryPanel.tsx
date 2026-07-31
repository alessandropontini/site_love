'use client';

import { useEffect, useRef, useState } from "react";

import {
  experienceChapters,
  type ChapterId
} from "@/lib/experienceConfig";
import { PaperSymbol } from "@/components/experience/art/PaperArt";

import styles from "./ExperienceShell.module.css";

const focusableSelector = [
  'button:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  '[href]:not([tabindex="-1"]):not([aria-hidden="true"])',
  'input:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
].join(", ");

export function InventoryPanel({
  inventory,
  onClose,
  onReset
}: {
  inventory: ChapterId[];
  onClose: () => void;
  onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resetTriggerRef = useRef<HTMLButtonElement>(null);

  const cancelReset = () => {
    setConfirmReset(false);
    window.requestAnimationFrame(() => resetTriggerRef.current?.focus());
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable =
        panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className={styles.inventoryBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inventory-title"
    >
      <button
        type="button"
        className={styles.inventoryDismiss}
        onClick={onClose}
        aria-hidden="true"
        tabIndex={-1}
      />
      <aside className={styles.inventoryPanel}>
        <div className={styles.inventoryHeader}>
          <div>
            <span className={styles.kicker}>Oggetti del viaggio</span>
            <h2 id="inventory-title">Lo zaino dei ricordi</h2>
          </div>
          <button type="button" onClick={onClose} autoFocus aria-label="Chiudi lo zaino">
            ×
          </button>
        </div>
        <ul className={styles.inventoryGrid}>
          {experienceChapters.map((chapter) => {
            const collected = inventory.includes(chapter.id);
            return (
              <li key={chapter.id} data-collected={collected}>
                <span className={styles.inventorySymbol} aria-hidden="true">
                  {collected ? <PaperSymbol chapterId={chapter.id} /> : "?"}
                </span>
                <div>
                  <strong>{collected ? chapter.reward.title : "Ricordo nascosto"}</strong>
                  <p>
                    {collected
                      ? chapter.reward.description
                      : `Completa la fermata ${chapter.number} per scoprirlo.`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className={styles.inventoryFooter}>
          <p>I progressi restano salvati su questo dispositivo.</p>
          {confirmReset ? (
            <div className={styles.resetConfirm} role="group" aria-label="Conferma reset">
              <span>Vuoi cancellare tutti i ricordi raccolti?</span>
              <button type="button" className={styles.textButton} onClick={cancelReset} autoFocus>
                Annulla
              </button>
              <button type="button" className={styles.dangerButton} onClick={onReset}>
                Sì, ricomincia
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.textButton}
              ref={resetTriggerRef}
              onClick={() => setConfirmReset(true)}
            >
              Ricomincia dall&apos;inizio
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
