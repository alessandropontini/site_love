'use client';

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent
} from "react";

import type { EditorialContent, GalleryItem } from "@/lib/editorialConfig";
import { editorialSectionIds } from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";

type GalleryItemStyle = CSSProperties & {
  "--gallery-stack-y": string;
  "--gallery-stack-y-compact": string;
  "--gallery-open-y": string;
  "--gallery-open-y-compact": string;
  "--gallery-stack-position": string;
  "--gallery-open-position": string;
};

function getGalleryItemStyle(
  item: GalleryItem,
  index: number,
  total: number,
  activeIndex: number | null
): GalleryItemStyle {
  const stackOffset = index - (total - 1) / 2;
  const openOffset = activeIndex === null ? 0 : index - activeIndex;
  const stackPosition = item.stackPosition ?? item.position ?? "50% 50%";

  return {
    "--gallery-stack-y": `${(stackOffset * 11).toFixed(2)}%`,
    "--gallery-stack-y-compact": `${(stackOffset * 8.5).toFixed(2)}%`,
    "--gallery-open-y": `${openOffset * 58}%`,
    "--gallery-open-y-compact": `${openOffset * 48}%`,
    "--gallery-stack-position": stackPosition,
    "--gallery-open-position": item.position ?? item.stackPosition ?? "50% 50%",
    zIndex: total - Math.abs(index - (activeIndex ?? index))
  };
}

function GalleryStackItem({
  item,
  index,
  total,
  activeIndex,
  buttonRef,
  onSelect
}: {
  item: GalleryItem;
  index: number;
  total: number;
  activeIndex: number | null;
  buttonRef: (element: HTMLButtonElement | null) => void;
  onSelect: () => void;
}) {
  const isOpen = activeIndex !== null;
  const isActive = activeIndex === index;
  const currentNumber = String(index + 1).padStart(2, "0");

  return (
    <div
      className={styles.galleryTransitionItem}
      data-active={isActive}
      data-tone={item.tone}
      role="listitem"
      aria-posinset={index + 1}
      aria-setsize={total}
      style={getGalleryItemStyle(item, index, total, activeIndex)}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.galleryTransitionButton}
        onClick={onSelect}
        aria-label={`${currentNumber}. ${item.caption}`}
        aria-pressed={isActive}
        tabIndex={isOpen && !isActive ? -1 : 0}
      >
        <span className={styles.galleryTransitionMedia}>
          {item.src ? (
            <Image
              src={item.src}
              alt={item.alt ?? ""}
              fill
              loading="lazy"
              sizes="(max-width: 560px) 100vw, (max-width: 900px) 88vw, 46vw"
            />
          ) : (
            <span
              className={styles.photoPlaceholder}
              role="img"
              aria-label={item.placeholder}
            >
              <span aria-hidden="true">{currentNumber}</span>
              <strong>{item.placeholder}</strong>
              <i aria-hidden="true" />
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

export function PhotoGallery({ content }: { content: EditorialContent }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const total = content.gallery.items.length;
  const isOpen = activeIndex !== null;
  const activeItem = activeIndex === null ? null : content.gallery.items[activeIndex];

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      setIsReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setIsReady(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const openGallery = useCallback((index: number) => {
    if (suppressClick.current) return;
    setActiveIndex(index);
  }, []);

  const closeGallery = useCallback(() => {
    if (activeIndex === null) return;
    const returnIndex = activeIndex;
    setActiveIndex(null);
    window.setTimeout(() => itemRefs.current[returnIndex]?.focus(), 0);
  }, [activeIndex]);

  const showRelative = useCallback(
    (direction: -1 | 1) => {
      setActiveIndex((current) => {
        if (current === null) return current;
        return Math.min(total - 1, Math.max(0, current + direction));
      });
    },
    [total]
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || activeIndex === null) return;
    pointerStart.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== event.pointerId || activeIndex === null) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 46 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    suppressClick.current = true;
    showRelative(deltaX > 0 ? -1 : 1);
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      showRelative(-1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      showRelative(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(total - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeGallery();
    }
  };

  return (
    <section
      className={styles.gallerySection}
      id={editorialSectionIds.photos}
      data-nav-section={editorialSectionIds.photos}
      aria-labelledby="gallery-title"
    >
      <header className={styles.sectionHeaderWide} data-reveal>
        <div>
          <p className={styles.sectionKicker}>{content.gallery.kicker}</p>
          <h2 id="gallery-title">{content.gallery.title}</h2>
        </div>
        <div>
          <p>{content.gallery.intro}</p>
          <small>{content.gallery.note}</small>
        </div>
      </header>

      <div
        ref={stageRef}
        className={styles.galleryStage}
        data-open={isOpen}
        data-ready={isReady}
        role="group"
        aria-label={content.gallery.browseHint}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className={styles.galleryStageIntro} aria-hidden="true">
          <span>A &amp; B</span>
          <strong>{content.gallery.kicker}</strong>
          <small>{content.gallery.browseHint}</small>
        </div>

        <div className={styles.galleryTransitionList} role="list">
          {content.gallery.items.map((item, index) => (
            <GalleryStackItem
              item={item}
              index={index}
              total={total}
              activeIndex={activeIndex}
              buttonRef={(element) => {
                itemRefs.current[index] = element;
              }}
              onSelect={() => openGallery(index)}
              key={item.id}
            />
          ))}
        </div>

        <div className={styles.galleryContent} aria-hidden={!isOpen}>
          <button
            type="button"
            className={styles.galleryClose}
            onClick={closeGallery}
            tabIndex={isOpen ? 0 : -1}
          >
            <span aria-hidden="true">←</span>
            <span>{content.gallery.closeLabel}</span>
          </button>

          <div className={styles.galleryContentCopy} aria-live="polite">
            {activeItem && activeIndex !== null ? (
              <>
                <span>
                  {String(activeIndex + 1).padStart(2, "0")} /{" "}
                  {String(total).padStart(2, "0")}
                </span>
                <h3>{activeItem.caption}</h3>
                <p>{content.gallery.intro}</p>
              </>
            ) : null}
          </div>

          <nav
            className={styles.galleryTransitionControls}
            aria-label={content.gallery.browseHint}
          >
            <button
              type="button"
              onClick={() => showRelative(-1)}
              aria-label={content.gallery.previousLabel}
              disabled={activeIndex === null || activeIndex === 0}
              tabIndex={isOpen ? 0 : -1}
            >
              <span aria-hidden="true">←</span>
              <span>{content.gallery.previousLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => showRelative(1)}
              aria-label={content.gallery.nextLabel}
              disabled={activeIndex === null || activeIndex === total - 1}
              tabIndex={isOpen ? 0 : -1}
            >
              <span>{content.gallery.nextLabel}</span>
              <span aria-hidden="true">→</span>
            </button>
          </nav>
        </div>
      </div>
    </section>
  );
}
