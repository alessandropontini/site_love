'use client';

import type { CSSProperties } from "react";

type PixelKey = "." | "n" | "s" | "g" | "m" | "j" | "h" | "t" | "d" | "l" | "c";

type PixelSprite = {
  width: number;
  height: number;
  palette: Record<Exclude<PixelKey, ".">, string>;
  rows: string[];
};

export type PixelCharacterVariant = "alessandro" | "bridget";

const SPRITES: Record<PixelCharacterVariant, PixelSprite> = {
  alessandro: {
    width: 18,
    height: 22,
    palette: {
      n: "#2b221f",
      s: "#d5b29d",
      g: "#223647",
      m: "#6c4331",
      j: "#20345a",
      h: "#8abbe6",
      t: "#4e6ea0",
      d: "#9dad98",
      l: "#cad4c3",
      c: "#6d4a43"
    },
    rows: [
      "..................",
      "......nnnnnn......",
      ".....nssssssn.....",
      "....nssssssssn....",
      "....nsggggggsn....",
      "....nssssssssn....",
      "...nnssmmmmssnn...",
      "...nssssssssssn...",
      "...nssssssssssn...",
      "...nnssnnnnssnn...",
      "....njjhhhhjjn....",
      "....njjthhtjjn....",
      "...nnjjjttjjjnn...",
      "...n.jjjttjjj.n...",
      "...n.jjjjjjjj.n...",
      "..nn.jjjjjjjj.nn..",
      "..n..jjj..jjj..n..",
      "..n..jjj..jjj..n..",
      ".....jjj..jjj.....",
      ".....jjj..jjj.....",
      "....nnn....nnn....",
      "....nn......nn...."
    ]
  },
  bridget: {
    width: 18,
    height: 22,
    palette: {
      n: "#3a2f2d",
      s: "#efd3c6",
      g: "#cda95e",
      m: "#ad6e79",
      j: "#687366",
      h: "#bcc9b3",
      t: "#87937f",
      d: "#a8b59f",
      l: "#d5ddd1",
      c: "#6f4b43"
    },
    rows: [
      ".......cccc.......",
      "......ccnncc......",
      ".....cnnssnnc.....",
      "....cnnssssnnc....",
      "....cnssssssnc....",
      "....cnssssssnc....",
      "...ccnssmmssncc...",
      "...cnssssssssnc...",
      "...cnnssssssnnc...",
      "....cnddddddnc....",
      "....nddddddddn....",
      "...nndddggddnn....",
      "...nnddlllldnn....",
      "...nndddllddnn....",
      "..nnndddllddnnn...",
      "..n..ddd..ddd..n..",
      "..n..ddd..ddd..n..",
      ".....ddd..ddd.....",
      ".....ddd..ddd.....",
      "....nnn....nnn....",
      "....nn......nn....",
      ".................."
    ]
  }
};

export function PixelCharacter({
  variant,
  size = 92,
  className
}: {
  variant: PixelCharacterVariant;
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
