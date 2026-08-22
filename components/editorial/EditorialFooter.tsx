'use client';

import { useRef } from "react";

import { EditorialLanguageSelector } from "@/components/editorial/EditorialLocaleProvider";
import { scrollToEditorialSection } from "@/components/editorial/editorialScroll";
import type { EditorialContent } from "@/lib/editorialConfig";
import { editorialSectionIds } from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";

export function EditorialFooter({ content }: { content: EditorialContent }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeColophon = () => dialogRef.current?.close();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <p>{content.footer.names}</p>
          <div>
            <span>{content.footer.place}</span>
            <span>{content.footer.date}</span>
          </div>
        </div>
        <nav aria-label={content.accessibility.footerNavigation}>
          <a
            href={`#${editorialSectionIds.rsvp}`}
            onClick={(event) =>
              scrollToEditorialSection(event, editorialSectionIds.rsvp)
            }
          >
            {content.footer.rsvpLabel}
          </a>
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            ref={triggerRef}
          >
            {content.footer.colophonLabel}
          </button>
          <EditorialLanguageSelector
            className={styles.footerLanguageSelector}
            labels={content.language}
          />
        </nav>
        <p className={styles.footerNote}>{content.footer.note}</p>
        <p className={styles.footerDecorative} aria-hidden="true">
          {content.footer.decorative}
        </p>
      </div>

      <dialog
        className={styles.colophonDialog}
        ref={dialogRef}
        aria-labelledby="colophon-title"
        onClose={() => triggerRef.current?.focus()}
        onCancel={(event) => {
          event.preventDefault();
          closeColophon();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeColophon();
          }
        }}
      >
        <button
          type="button"
          className={styles.dialogClose}
          onClick={closeColophon}
          aria-label={content.footer.close}
        >
          <span aria-hidden="true">×</span>
        </button>
        <p className={styles.sectionKicker}>{content.footer.names}</p>
        <h2 id="colophon-title">{content.footer.colophonTitle}</h2>
        <p>{content.footer.colophonBody}</p>
        <p>{content.footer.colophonDetail}</p>
        <button type="button" onClick={closeColophon}>
          {content.footer.close}
        </button>
      </dialog>
    </footer>
  );
}
