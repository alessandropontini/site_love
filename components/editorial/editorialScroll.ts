import type { MouseEvent } from "react";

export function scrollToEditorialSection(
  event: MouseEvent<HTMLAnchorElement>,
  sectionId: string
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const target = document.getElementById(sectionId);
  if (!target) return false;

  event.preventDefault();
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start"
  });

  const nextHash = `#${sectionId}`;
  if (window.location.hash !== nextHash) {
    window.history.pushState(null, "", nextHash);
  }
  return true;
}
