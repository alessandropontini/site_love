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

type StackItemStyle = CSSProperties & {
  "--stack-x": string;
  "--stack-y": string;
  "--stack-rotation": string;
  "--stack-mid-x": string;
  "--stack-mid-y": string;
  "--stack-mid-rotation": string;
  "--stack-pile-rotation": string;
  "--stack-drift-x": string;
  "--stack-drift-y": string;
  "--stack-drift-rotation": string;
  "--stack-drift-duration": string;
  "--stack-drift-delay": string;
};

function getStackItemStyle(index: number, total: number): StackItemStyle {
  const angle = -90 + (360 / total) * index;
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * 40;
  const y = Math.sin(radians) * 35;
  const wobble = index % 2 === 0 ? -3 : 3;
  const rotation = angle + 90 + wobble;
  const curveDirection = index % 2 === 0 ? -1 : 1;
  const midX = x * 0.72 + Math.cos(radians + Math.PI / 2) * 4.5 * curveDirection;
  const midY = y * 0.72 + Math.sin(radians + Math.PI / 2) * 3.5 * curveDirection;
  const driftX = [-4, 3, 5, -3, 4, -5, 2, -3][index % 8];
  const driftY = [3, -4, 2, 4, -3, 2, -4, 3][index % 8];
  const driftRotation = index % 2 === 0 ? -0.8 : 0.8;

  return {
    "--stack-x": `${x.toFixed(2)}%`,
    "--stack-y": `${y.toFixed(2)}%`,
    "--stack-rotation": `${rotation.toFixed(1)}deg`,
    "--stack-mid-x": `${midX.toFixed(2)}%`,
    "--stack-mid-y": `${midY.toFixed(2)}%`,
    "--stack-mid-rotation": `${(rotation * 0.72).toFixed(1)}deg`,
    "--stack-pile-rotation": `${(-17.5 + index * 5).toFixed(1)}deg`,
    "--stack-drift-x": `${driftX}px`,
    "--stack-drift-y": `${driftY}px`,
    "--stack-drift-rotation": `${driftRotation}deg`,
    "--stack-drift-duration": `${7.2 + (index % 3) * 0.9}s`,
    "--stack-drift-delay": `${index * -0.73}s`
  };
}

function GalleryStackItem({
  item,
  index,
  total,
  isActive,
  onSelect
}: {
  item: GalleryItem;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const currentNumber = String(index + 1).padStart(2, "0");

  return (
    <div
      className={styles.galleryStackItem}
      data-active={isActive}
      data-aspect={item.aspect}
      data-tone={item.tone}
      role="listitem"
      aria-posinset={index + 1}
      aria-setsize={total}
      style={getStackItemStyle(index, total)}
    >
      <div className={styles.galleryStackDrift}>
        <button
          type="button"
          className={styles.galleryStackButton}
          onClick={onSelect}
          aria-label={`${currentNumber}. ${item.caption}`}
          aria-pressed={isActive}
        >
          <span className={styles.galleryStackMedia}>
            {item.src ? (
              <Image
                src={item.src}
                alt={item.alt ?? ""}
                fill
                loading="lazy"
                sizes="(max-width: 560px) 88vw, (max-width: 1023px) 64vw, 54vw"
                style={item.position ? { objectPosition: item.position } : undefined}
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
    </div>
  );
}

export function PhotoGallery({ content }: { content: EditorialContent }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ id: number; x: number } | null>(null);
  const suppressClick = useRef(false);
  const total = content.gallery.items.length;
  const activeItem = activeIndex === null ? null : content.gallery.items[activeIndex];

  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canAnimate = typeof Element.prototype.animate === "function";

    if (reducedMotion || !canAnimate || !("IntersectionObserver" in window)) {
      stack.dataset.motion = "complete";
      return;
    }

    stack.dataset.motion = "waiting";
    let disposed = false;
    let hasPlayed = false;
    let runningAnimations: Animation[] = [];

    const playEntrance = () => {
      if (disposed || hasPlayed) return;
      hasPlayed = true;
      stack.dataset.motion = "animating";

      const compact = window.matchMedia("(max-width: 700px)").matches;
      const duration = compact ? 1420 : 1680;
      const stagger = compact ? 70 : 92;
      const items = Array.from(
        stack.querySelectorAll<HTMLElement>(`.${styles.galleryStackItem}`)
      );
      const center = stack.querySelector<HTMLElement>(`.${styles.galleryStackCenter}`);

      runningAnimations = items.map((item, index) =>
        item.animate(
          [
            {
              offset: 0,
              top: "calc(100% + 18vh)",
              left: "50%",
              opacity: 0,
              filter: compact ? "blur(0px)" : "blur(8px)",
              transform:
                "translate(-50%, -50%) rotate(var(--stack-pile-rotation)) rotateX(-135deg) scale(1.85)",
              easing: "cubic-bezier(0.45, 0, 0.55, 1)"
            },
            {
              offset: 0.24,
              top: "58%",
              left: "50%",
              opacity: 0.92,
              filter: "blur(0px)",
              transform:
                "translate(-50%, -50%) rotate(var(--stack-pile-rotation)) rotateX(-18deg) scale(0.82)",
              easing: "cubic-bezier(0.22, 1, 0.36, 1)"
            },
            {
              offset: 0.43,
              top: "50%",
              left: "50%",
              opacity: 1,
              filter: "blur(0px)",
              transform: "translate(-50%, -50%) rotate(0deg) rotateX(0deg) scale(0.92)",
              easing: "cubic-bezier(0.65, 0, 0.35, 1)"
            },
            {
              offset: 0.76,
              top: "calc(50% + var(--stack-mid-y))",
              left: "calc(50% + var(--stack-mid-x))",
              opacity: 1,
              filter: "blur(0px)",
              transform:
                "translate(-50%, -50%) rotate(var(--stack-mid-rotation)) scale(1.045)",
              easing: "cubic-bezier(0.16, 1, 0.3, 1)"
            },
            {
              offset: 1,
              top: "calc(50% + var(--stack-y))",
              left: "calc(50% + var(--stack-x))",
              opacity: 1,
              filter: "none",
              transform: "translate(-50%, -50%) rotate(var(--stack-rotation)) scale(1)"
            }
          ],
          {
            duration,
            delay: index * stagger,
            fill: "both"
          }
        )
      );

      if (center) {
        runningAnimations.push(
          center.animate(
            [
              {
                opacity: 0,
                filter: compact ? "blur(0px)" : "blur(28px)",
                transform: "translate(-50%, -50%) scale(0.84)"
              },
              {
                opacity: 1,
                filter: "blur(0px)",
                transform: "translate(-50%, -50%) scale(1)"
              }
            ],
            {
              duration: compact ? 760 : 940,
              delay: compact ? 700 : 900,
              fill: "both",
              easing: "cubic-bezier(0.16, 1, 0.3, 1)"
            }
          )
        );
      }

      Promise.allSettled(runningAnimations.map((animation) => animation.finished)).then(() => {
        if (disposed) return;
        stack.dataset.motion = "complete";
        runningAnimations.forEach((animation) => animation.cancel());
        runningAnimations = [];
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        playEntrance();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.16 }
    );

    observer.observe(stack);

    return () => {
      disposed = true;
      observer.disconnect();
      runningAnimations.forEach((animation) => animation.cancel());
    };
  }, [total]);

  const showRelative = useCallback(
    (direction: -1 | 1) => {
      setActiveIndex((current) => {
        if (current === null) return direction === 1 ? 0 : total - 1;
        return (current + direction + total) % total;
      });
    },
    [total]
  );

  const selectItem = (index: number) => {
    if (suppressClick.current) return;
    setActiveIndex((current) => (current === index ? null : index));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    pointerStart.current = { id: event.pointerId, x: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || start.id !== event.pointerId || activeIndex === null) return;

    const delta = event.clientX - start.x;
    if (Math.abs(delta) < 42) return;

    suppressClick.current = true;
    showRelative(delta > 0 ? -1 : 1);
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showRelative(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showRelative(1);
    } else if (event.key === "Escape" && activeIndex !== null) {
      event.preventDefault();
      setActiveIndex(null);
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
        ref={stackRef}
        className={styles.galleryStack}
        data-motion="static"
        data-open={activeIndex !== null}
        role="group"
        aria-label={content.gallery.browseHint}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className={styles.galleryStackCenter}
          aria-hidden={activeIndex !== null}
        >
          <span>A &amp; B</span>
          <strong>{content.gallery.title}</strong>
          <small>{content.gallery.browseHint}</small>
        </div>

        <div className={styles.galleryStackList} role="list">
          {content.gallery.items.map((item, index) => (
            <GalleryStackItem
              item={item}
              index={index}
              total={total}
              isActive={activeIndex === index}
              onSelect={() => selectItem(index)}
              key={item.id}
            />
          ))}
        </div>
      </div>

      <div className={styles.galleryStackControls}>
        <button
          type="button"
          onClick={() => showRelative(-1)}
          aria-label={content.gallery.previousLabel}
        >
          <span aria-hidden="true">←</span>
          <span>{content.gallery.previousLabel}</span>
        </button>

        <div className={styles.galleryStackStatus} aria-live="polite">
          {activeItem && activeIndex !== null ? (
            <>
              <span>
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(total).padStart(2, "0")}
              </span>
              <strong>{activeItem.caption}</strong>
              <button type="button" onClick={() => setActiveIndex(null)}>
                {content.gallery.closeLabel}
              </button>
            </>
          ) : (
            <span>{content.gallery.browseHint}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => showRelative(1)}
          aria-label={content.gallery.nextLabel}
        >
          <span>{content.gallery.nextLabel}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
