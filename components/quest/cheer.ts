import type { PixelCharacterVariant } from "@/components/pixel/PixelCharacter";

type CheerCharacterId = PixelCharacterVariant;

type CheerState = {
  container: HTMLElement | null;
};

const state: CheerState = {
  container: null
};

function resolveName(id: CheerCharacterId): string {
  return id === "alessandro" ? "Alessandro" : "Bridget";
}

export function initCheer(container: HTMLElement, characterId: CheerCharacterId): void {
  if (state.container && state.container !== container) {
    state.container.removeAttribute("data-cheer-active");
    state.container.removeAttribute("data-cheer-character");
  }

  state.container = container;
  container.setAttribute("data-cheer-ready", "true");
  setCharacter(characterId);
}

export function startCheer(): void {
  if (!state.container) return;
  state.container.setAttribute("data-cheer-active", "true");
}

export function stopCheer(): void {
  if (!state.container) return;
  state.container.setAttribute("data-cheer-active", "false");
  if (typeof document !== "undefined" && !document.body.contains(state.container)) {
    state.container.removeAttribute("data-cheer-character");
    state.container = null;
  }
}

export function setCharacter(characterId: CheerCharacterId): void {
  if (!state.container) return;
  state.container.setAttribute("data-cheer-character", characterId);

  const line = state.container.querySelector<HTMLElement>("[data-cheer-line]");
  if (line) {
    line.textContent = `${resolveName(characterId)} says: Vai amore!`;
  }
}
