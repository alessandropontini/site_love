'use client';

import * as THREE from "three";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent
} from "react";

import type { EditorialContent } from "@/lib/editorialConfig";

import styles from "./EditorialHome.module.css";

export type HeroInvitation3DProps = {
  flipped: boolean;
  front: EditorialContent["hero"]["front"];
  back: EditorialContent["hero"]["back"];
  label: string;
  keyboardHint: string;
  onFlippedChange: (flipped: boolean) => void;
  onReady: (control: HTMLButtonElement) => void;
  onUnavailable: (control: HTMLButtonElement) => void;
};

type DragState = {
  active: boolean;
  startX: number;
  baseRotation: number;
  moved: boolean;
};

function drawCenteredLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  startY: number,
  lineHeight: number
) {
  lines.forEach((line, index) => {
    context.fillText(line, x, startY + index * lineHeight);
  });
}

function wrapText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number
) {
  const words = value.split(" ");
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      return;
    }
    line = candidate;
  });
  if (line) lines.push(line);
  return lines;
}

function drawWaterTurtleMark(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = "#7b653f";
  context.fillStyle = "rgba(36, 43, 22, 0.07)";
  context.lineWidth = Math.max(2, size * 0.035);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(-size * 0.42, size * 0.05);
  context.bezierCurveTo(
    -size * 0.34,
    -size * 0.3,
    size * 0.22,
    -size * 0.38,
    size * 0.38,
    -size * 0.02
  );
  context.bezierCurveTo(
    size * 0.28,
    size * 0.23,
    -size * 0.25,
    size * 0.34,
    -size * 0.42,
    size * 0.05
  );
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(size * 0.36, -size * 0.02);
  context.bezierCurveTo(
    size * 0.47,
    -size * 0.16,
    size * 0.65,
    -size * 0.17,
    size * 0.71,
    -size * 0.06
  );
  context.bezierCurveTo(
    size * 0.75,
    size * 0.06,
    size * 0.6,
    size * 0.13,
    size * 0.39,
    size * 0.05
  );
  context.stroke();

  context.beginPath();
  context.moveTo(-size * 0.42, size * 0.03);
  context.lineTo(-size * 0.58, size * 0.1);
  context.lineTo(-size * 0.4, size * 0.16);
  context.moveTo(-size * 0.2, size * 0.24);
  context.quadraticCurveTo(-size * 0.23, size * 0.4, -size * 0.34, size * 0.43);
  context.moveTo(size * 0.21, size * 0.22);
  context.quadraticCurveTo(size * 0.26, size * 0.39, size * 0.39, size * 0.39);
  context.stroke();

  context.beginPath();
  context.moveTo(-size * 0.31, -size * 0.03);
  context.quadraticCurveTo(-size * 0.02, size * 0.12, size * 0.29, -size * 0.04);
  context.moveTo(-size * 0.16, -size * 0.27);
  context.quadraticCurveTo(-size * 0.14, -size * 0.04, -size * 0.22, size * 0.24);
  context.moveTo(size * 0.13, -size * 0.28);
  context.quadraticCurveTo(size * 0.06, -size * 0.04, size * 0.19, size * 0.2);
  context.stroke();

  context.globalAlpha = 0.78;
  [0.58, 0.4].forEach((radius, index) => {
    context.beginPath();
    context.ellipse(
      0,
      size * (0.58 + index * 0.12),
      size * radius,
      size * 0.06,
      0,
      0,
      Math.PI
    );
    context.stroke();
  });
  context.restore();
}

function createInvitationTexture(
  width: number,
  height: number,
  content: HeroInvitation3DProps["front"] | HeroInvitation3DProps["back"],
  back = false
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D unavailable");

  const paper = context.createLinearGradient(0, 0, width, height);
  paper.addColorStop(0, "#fff9f3");
  paper.addColorStop(0.5, back ? "#ead1c9" : "#f5e7df");
  paper.addColorStop(1, "#e3c2b8");
  context.fillStyle = paper;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.12;
  context.fillStyle = "#261b20";
  for (let y = 0; y < height; y += 8) {
    context.fillRect(0, y, width, 1);
  }
  context.globalAlpha = 1;

  const inset = Math.round(width * 0.07);
  context.strokeStyle = "#9b7948";
  context.lineWidth = Math.max(2, Math.round(width * 0.003));
  context.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  context.globalAlpha = 0.45;
  context.strokeRect(
    inset + Math.round(width * 0.025),
    inset + Math.round(width * 0.025),
    width - (inset + Math.round(width * 0.025)) * 2,
    height - (inset + Math.round(width * 0.025)) * 2
  );
  context.globalAlpha = 1;

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#261b20";
  context.font = `700 ${Math.round(width * 0.033)}px Arial, sans-serif`;
  context.letterSpacing = `${Math.round(width * 0.006)}px`;
  context.fillText(content.eyebrow.toUpperCase(), width / 2, height * 0.16);

  if (back && "body" in content) {
    context.font = `italic 400 ${Math.round(width * 0.077)}px Georgia, serif`;
    const titleLines = wrapText(context, content.title, width * 0.66);
    drawCenteredLines(
      context,
      titleLines,
      width / 2,
      height * 0.38,
      height * 0.075
    );
    context.font = `400 ${Math.round(width * 0.038)}px Georgia, serif`;
    const bodyLines = wrapText(context, content.body, width * 0.62);
    drawCenteredLines(
      context,
      bodyLines,
      width / 2,
      height * 0.67,
      height * 0.04
    );
  } else {
    context.font = `italic 400 ${Math.round(width * 0.19)}px Georgia, serif`;
    context.fillText(content.title, width / 2, height * 0.52);
    drawWaterTurtleMark(context, width / 2, height * 0.33, width * 0.18);
  }

  context.font = `700 ${Math.round(width * 0.029)}px Arial, sans-serif`;
  context.letterSpacing = `${Math.round(width * 0.004)}px`;
  context.fillText(content.footnote.toUpperCase(), width / 2, height * 0.87);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createPaperBumpTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D unavailable");
  const image = context.createImageData(canvas.width, canvas.height);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = 116 + Math.floor(Math.random() * 24);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 5);
  return texture;
}

export function HeroInvitation3D({
  flipped,
  front,
  back,
  label,
  keyboardHint,
  onFlippedChange,
  onReady,
  onUnavailable
}: HeroInvitation3DProps) {
  const hostRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestFlippedRef = useRef(flipped);
  const rotationTargetRef = useRef(flipped ? Math.PI : 0);
  const startAnimationRef = useRef<() => void>(() => undefined);
  const reducedMotionRef = useRef(false);
  const tiltXRef = useRef(0);
  const tiltYRef = useRef(0);
  const ignoreClickRef = useRef(false);
  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    baseRotation: 0,
    moved: false
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    if (
      process.env.NODE_ENV !== "production" &&
      new URLSearchParams(window.location.search).has("no-webgl")
    ) {
      onUnavailable(host);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    let frame: number | null = null;
    let isIntersecting = true;
    let pageVisible = !document.hidden;
    let disposed = false;

    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    reducedMotionRef.current = reducedMotion.matches;
    const targetAtMount = latestFlippedRef.current ? Math.PI : 0;
    rotationTargetRef.current = targetAtMount;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 7.25);

    const group = new THREE.Group();
    scene.add(group);

    const textureWidth = mobile ? 512 : 768;
    const textureHeight = Math.round(textureWidth * 1.35);
    let frontTexture: THREE.CanvasTexture;
    let backTexture: THREE.CanvasTexture;
    let bumpTexture: THREE.CanvasTexture;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !mobile,
        powerPreference: "high-performance"
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75)
      );

      frontTexture = createInvitationTexture(
        textureWidth,
        textureHeight,
        front
      );
      backTexture = createInvitationTexture(
        textureWidth,
        textureHeight,
        back,
        true
      );
      bumpTexture = createPaperBumpTexture();

      const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
      frontTexture.anisotropy = anisotropy;
      backTexture.anisotropy = anisotropy;
    } catch {
      renderer?.dispose();
      setReady(false);
      onUnavailable(host);
      return;
    }

    const bodyGeometry = new THREE.BoxGeometry(3.25, 4.38, 0.075);
    const faceGeometry = new THREE.PlaneGeometry(3.23, 4.36);
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9b8ad,
      roughness: 1,
      metalness: 0
    });
    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.018,
      roughness: 0.94,
      metalness: 0
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.018,
      roughness: 0.94,
      metalness: 0
    });
    const body = new THREE.Mesh(bodyGeometry, edgeMaterial);
    const frontPlane = new THREE.Mesh(faceGeometry, frontMaterial);
    frontPlane.position.z = 0.039;
    const backPlane = new THREE.Mesh(faceGeometry, backMaterial);
    backPlane.position.z = -0.039;
    backPlane.rotation.y = Math.PI;
    group.add(body, frontPlane, backPlane);

    scene.add(new THREE.AmbientLight(0xfff5ec, 1.55));
    const keyLight = new THREE.DirectionalLight(0xffe8d5, 2.4);
    keyLight.position.set(-3.5, 4.8, 5.5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xc8d9b7, 1.5);
    rimLight.position.set(4, -2, -4);
    scene.add(rimLight);

    let currentRotation = reducedMotion.matches
      ? targetAtMount
      : targetAtMount - 0.26;
    let currentTiltX = reducedMotion.matches ? 0 : -0.04;
    let currentTiltY = 0;

    const resize = () => {
      if (!renderer || disposed) return;
      const rectangle = host.getBoundingClientRect();
      const width = Math.max(1, Math.round(rectangle.width));
      const height = Math.max(1, Math.round(rectangle.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const render = () => {
      if (!renderer || disposed || !isIntersecting || !pageVisible) return;
      group.rotation.set(currentTiltX, currentRotation + currentTiltY, -0.025);
      renderer.render(scene, camera);
    };

    const animate = () => {
      frame = null;
      if (disposed || !isIntersecting || !pageVisible) return;
      if (reducedMotionRef.current) {
        currentRotation = rotationTargetRef.current;
        currentTiltX = 0;
        currentTiltY = 0;
        render();
        return;
      }

      currentRotation += (rotationTargetRef.current - currentRotation) * 0.14;
      currentTiltX += (tiltXRef.current - currentTiltX) * 0.16;
      currentTiltY += (tiltYRef.current - currentTiltY) * 0.16;
      render();

      const unsettled =
        Math.abs(rotationTargetRef.current - currentRotation) > 0.001 ||
        Math.abs(tiltXRef.current - currentTiltX) > 0.001 ||
        Math.abs(tiltYRef.current - currentTiltY) > 0.001;
      if (unsettled) frame = window.requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (disposed || frame !== null || !isIntersecting || !pageVisible) return;
      frame = window.requestAnimationFrame(animate);
    };
    startAnimationRef.current = startAnimation;

    const resizeObserver = new ResizeObserver(() => {
      resize();
      startAnimation();
    });
    resizeObserver.observe(host);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? false;
        if (isIntersecting) startAnimation();
        if (!isIntersecting && frame !== null) {
          window.cancelAnimationFrame(frame);
          frame = null;
        }
      },
      { rootMargin: "80px" }
    );
    intersectionObserver.observe(host);

    const handleVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) startAnimation();
      if (!pageVisible && frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    };
    const handleMotionPreference = () => {
      reducedMotionRef.current = reducedMotion.matches;
      if (reducedMotion.matches) {
        tiltXRef.current = 0;
        tiltYRef.current = 0;
      }
      startAnimation();
    };
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setReady(false);
      onUnavailable(host);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    reducedMotion.addEventListener("change", handleMotionPreference);
    canvas.addEventListener("webglcontextlost", handleContextLost);

    resize();
    render();
    setReady(true);
    onReady(host);
    startAnimation();

    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", handleVisibility);
      reducedMotion.removeEventListener("change", handleMotionPreference);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      bodyGeometry.dispose();
      faceGeometry.dispose();
      edgeMaterial.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      frontTexture.dispose();
      backTexture.dispose();
      bumpTexture.dispose();
      renderer?.dispose();
      startAnimationRef.current = () => undefined;
    };
  }, [back, front, onReady, onUnavailable]);

  useEffect(() => {
    latestFlippedRef.current = flipped;
    rotationTargetRef.current = flipped ? Math.PI : 0;
    startAnimationRef.current();
  }, [flipped]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      startX: event.clientX,
      baseRotation: rotationTargetRef.current,
      moved: false
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.active) {
      const delta = event.clientX - drag.startX;
      if (Math.abs(delta) > 6) drag.moved = true;
      rotationTargetRef.current = drag.baseRotation + delta * 0.012;
      startAnimationRef.current();
      return;
    }

    if (event.pointerType !== "mouse" || reducedMotionRef.current) return;
    const rectangle = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - rectangle.left) / rectangle.width - 0.5;
    const vertical = (event.clientY - rectangle.top) / rectangle.height - 0.5;
    tiltXRef.current = vertical * -0.12;
    tiltYRef.current = horizontal * 0.13;
    startAnimationRef.current();
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    drag.active = false;
    const delta = event.clientX - drag.startX;
    if (drag.moved && Math.abs(delta) > 24) {
      ignoreClickRef.current = true;
      onFlippedChange(!flipped);
      rotationTargetRef.current = !flipped ? Math.PI : 0;
    } else {
      rotationTargetRef.current = flipped ? Math.PI : 0;
    }
    startAnimationRef.current();
  };

  const handlePointerLeave = () => {
    if (!dragRef.current.active) {
      tiltXRef.current = 0;
      tiltYRef.current = 0;
      startAnimationRef.current();
    }
  };

  const handleClick = () => {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    onFlippedChange(!flipped);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    onFlippedChange(event.key === "ArrowRight");
  };

  return (
    <button
      type="button"
      className={styles.threeInvitation}
      data-ready={ready}
      aria-label={`${label}. ${keyboardHint}`}
      aria-pressed={flipped}
      aria-hidden={!ready}
      tabIndex={ready ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      ref={hostRef}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
    </button>
  );
}
