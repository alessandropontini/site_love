'use client';

import type { CSSProperties } from "react";

type PixelKey = "." | "h" | "s" | "o" | "a" | "b" | "c";

type PixelSprite = {
  width: number;
  height: number;
  palette: Record<Exclude<PixelKey, ".">, string>;
  rows: string[];
};

const SPRITES: Record<
  "alessandro" | "bridget",
  PixelSprite
> = {
  alessandro: {
    width: 12,
    height: 16,
    palette: {
      h: "#21162a",
      s: "#f7d6c3",
      o: "#3c5bc8",
      a: "#5f73d5",
      b: "#171d3a",
      c: "#f2ad4f"
    },
    rows: [
      "............",
      ".....hh.....",
      "....hhhh....",
      "...hhshhh...",
      "...hssshhh..",
      "..hsssssbh..",
      "..hssssssh..",
      "..hhhhhahh..",
      "..haaaaaah..",
      "..haaaaoah..",
      "..hhoooooh..",
      "..hooooooh..",
      "..hbbbbbch..",
      "..hbbbbbch..",
      "...hbbbh....",
      ".....h......"
    ]
  },
  bridget: {
    width: 12,
    height: 16,
    palette: {
      h: "#28183c",
      s: "#f8e5f6",
      o: "#ff6fb7",
      a: "#ffa5d7",
      b: "#1a1f46",
      c: "#71d5ff"
    },
    rows: [
      "............",
      "....hhhh....",
      "...hhshhh...",
      "..hhssshhh..",
      "..hsssssbhh.",
      ".hhsssssshh.",
      ".hhsssssshh.",
      ".hhhhhahhh..",
      ".haaaaaaah..",
      ".haaaaooah..",
      ".hhooaoooh..",
      ".hoooooooh..",
      ".hbbcccbhh..",
      "..hbbbbbch..",
      "...hhhhh....",
      "............"
    ]
  }
};

export function PixelCharacter({
  variant,
  size = 92,
  className
}: {
  variant: "alessandro" | "bridget";
  size?: number;
  className?: string;
}) {
  const sprite = SPRITES[variant];
  const pixels: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${sprite.width}, 1fr)`,
    width: size,
    height: (size / sprite.width) * sprite.height,
    imageRendering: "pixelated"
  };

  return (
    <div
      className={["pixel-character", className].filter(Boolean).join(" ")}
      style={pixels}
    >
      {sprite.rows.flatMap((row, rowIndex) =>
        row.split("").map((cell, columnIndex) => {
          if (cell === ".") {
            return (
              <span
                key={`${rowIndex}-${columnIndex}`}
                style={{ background: "transparent" }}
              />
            );
          }
          return (
            <span
              key={`${rowIndex}-${columnIndex}`}
              style={{ background: sprite.palette[cell as Exclude<PixelKey, ".">] }}
            />
          );
        })
      )}
    </div>
  );
}

export default PixelCharacter;
