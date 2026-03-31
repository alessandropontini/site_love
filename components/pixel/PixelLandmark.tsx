'use client';

import type { CSSProperties } from "react";

type PixelKey = "." | "o" | "s" | "d" | "g" | "w" | "r" | "y" | "l" | "b" | "k";

type PixelSprite = {
  width: number;
  height: number;
  palette: Record<Exclude<PixelKey, ".">, string>;
  rows: string[];
};

export type PixelLandmarkVariant =
  | "duomo"
  | "galleria"
  | "castello"
  | "bosco"
  | "sansiro"
  | "tram";

function centerRows(width: number, rows: string[]) {
  return rows.map((row) => {
    if (row.length >= width) return row;
    const total = width - row.length;
    const left = Math.floor(total / 2);
    const right = total - left;
    return `${".".repeat(left)}${row}${".".repeat(right)}`;
  });
}

function defineSprite(name: PixelLandmarkVariant, sprite: PixelSprite): PixelSprite {
  if (process.env.NODE_ENV !== "production") {
    if (sprite.rows.length !== sprite.height) {
      throw new Error(
        `PixelLandmark ${name} expected ${sprite.height} rows but received ${sprite.rows.length}`
      );
    }

    sprite.rows.forEach((row, index) => {
      if (row.length !== sprite.width) {
        throw new Error(
          `PixelLandmark ${name} row ${index + 1} expected width ${sprite.width} but received ${row.length}`
        );
      }
    });
  }

  return sprite;
}

const SPRITES: Record<PixelLandmarkVariant, PixelSprite> = {
  duomo: defineSprite("duomo", {
    width: 48,
    height: 28,
    palette: {
      o: "#5e7f94",
      s: "#f1f5f7",
      d: "#c9d6de",
      g: "#f0c85f",
      w: "#8fa7b7",
      r: "#d1ab6d",
      y: "#f6dc7d",
      l: "#6ea860",
      b: "#a8d9ef",
      k: "#4f6874"
    },
    rows: centerRows(48, [
      "....................g...................",
      "...................ogo..................",
      "..............o.o.o.oso.o.o.o...........",
      "............o.o.o.o.sss.o.o.o.o.........",
      "...........oossoossoosssoossoossoo......",
      ".........oosssosssosssssosssossssoo.....",
      "........oossssssssssssssssssssssssoo....",
      ".......oosssosssosssosssosssossssssoo...",
      "......oosssosssssosssssssssosssssssssoo.",
      ".....oosssssssssssssssssssssssssssssssoo",
      "....oossssssssssssswwwwsssssssssssssssso",
      "...oosssosssosssswwwkkwwwssssosssossssso",
      "...osssosssosssswkkwwwwkkwssssosssosssso",
      "..oosssssssssssswkwwkkkkwwksssssssssssso",
      "..osssosssosssswkwwkkkkwwkssssosssosssso",
      "..osssosssosssswkkwwwwwwkkwsssosssosssso",
      "..ossssssssssssswwwwwwwwwwssssssssssssso",
      "..ossssoossssooossskkkkssssooossssoossso",
      "..ossssoossssoossskkkkssssoossssoossssso",
      "..osssssssssssssssskkkksssssssssssssssso",
      "..osssosssosssossswkkwsssosssosssossssso",
      "..osssosssosssossswkkwsssosssosssossssso",
      "..osssssssssssssssssssssssssssssssssssso",
      "..ossssoossssoossssssssssoossssoosssssso",
      "..ossssooskksoossssokkksssooskksoossssso",
      "..ossssssssssssssssskkkkssssssssssssssso",
      "..oooooooooooooooooooooooooooooooooooooo",
      "........................................"
    ])
  }),
  galleria: defineSprite("galleria", {
    width: 24,
    height: 14,
    palette: {
      o: "#59744d",
      s: "#fbf5d9",
      d: "#e7d48f",
      g: "#f2c960",
      w: "#9ec8dc",
      r: "#c99d63",
      y: "#f6dc7d",
      l: "#6ea860",
      b: "#a8d9ef",
      k: "#45636f"
    },
    rows: [
      "..........oo............",
      ".......ooossoo..........",
      "......ossswwssso........",
      ".....ossswwwwssso.......",
      "....oossswwwwsssoo......",
      "...oossswwwwwwssssoo....",
      "..oossssswwwwwwsssssoo..",
      "..osssssssssssssssssso..",
      "..ossssooooosooossssso..",
      "..osssso....o....osssso.",
      "..osssso....o....osssso.",
      "..osssso....o....osssso.",
      "..osssssssssssssssssso..",
      "..oooooooooooooooooooo.."
    ]
  }),
  castello: defineSprite("castello", {
    width: 24,
    height: 16,
    palette: {
      o: "#50673f",
      s: "#dec79b",
      d: "#cda971",
      g: "#f0c85f",
      w: "#7ea4b8",
      r: "#b97858",
      y: "#f6dc7d",
      l: "#6ea860",
      b: "#a8d9ef",
      k: "#7b4f3d"
    },
    rows: [
      ".ooosso........oossoo...",
      ".ooosso...oo...oossoo...",
      ".ooosso..osso..oossoo...",
      ".ooossoossssssoossoo....",
      ".osssssssosssossssssso..",
      ".ossssoossssssoossssso..",
      ".ossssoossssssoossssso..",
      ".ossssssssssssssssssso..",
      ".ossssooskkksoossssso...",
      ".ossssooskwksoossssso...",
      ".ossssooskwksoossssso...",
      ".ossssooskkksoossssso...",
      ".ossssssssssssssssssso..",
      ".ossssoossssssoossssso..",
      ".ossssssssssssssssssso..",
      ".ooooooooooooooooooooo.."
    ]
  }),
  bosco: defineSprite("bosco", {
    width: 20,
    height: 18,
    palette: {
      o: "#58734c",
      s: "#dde8ef",
      d: "#c4d4df",
      g: "#f0c85f",
      w: "#9dc6d8",
      r: "#c99d63",
      y: "#f6dc7d",
      l: "#74b162",
      b: "#a8d9ef",
      k: "#45636f"
    },
    rows: [
      "...oolll....llloo...",
      "..oolllll..llllloo..",
      "..ollllll..llllllo..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..ossssso..ossssso..",
      "..oooooooooooooooo..",
      "...................."
    ]
  }),
  sansiro: defineSprite("sansiro", {
    width: 22,
    height: 12,
    palette: {
      o: "#5c7f86",
      s: "#dbe8ee",
      d: "#b6cfd8",
      g: "#f0c85f",
      w: "#9dc6d8",
      r: "#c99d63",
      y: "#f6dc7d",
      l: "#6ea860",
      b: "#a8d9ef",
      k: "#45636f"
    },
    rows: [
      "....oooooooooooo......",
      "...oossssssssssoo.....",
      "..oosssodddddddsssoo..",
      ".oosssodddddddddsssoo.",
      ".osssodddddddddddsssso",
      ".osssodddddddddddsssso",
      ".osssodddddddddddsssso",
      ".oosssodddddddddsssoo.",
      "..oossssssssssssssoo..",
      "...oooooooooooooooo...",
      "......................",
      "......................"
    ]
  }),
  tram: defineSprite("tram", {
    width: 19,
    height: 10,
    palette: {
      o: "#5b7c4d",
      s: "#fff7d9",
      d: "#dfc15a",
      g: "#f0c85f",
      w: "#a3d1e6",
      r: "#c99d63",
      y: "#f6dc67",
      l: "#6ea860",
      b: "#a8d9ef",
      k: "#324f28"
    },
    rows: [
      "...oooooooooooo....",
      "..ooyyyyyyyyyyoo...",
      ".ooyywwwwwwwwyyoo..",
      ".oyyywwwwwwwwyyyo..",
      ".oyyyyyyyyyyyyyyo..",
      ".oyyyyyyyyyyyyyyo..",
      "..oookk....kkooo...",
      "...ok......ko......",
      "...................",
      "..................."
    ]
  })
};

export function PixelLandmark({
  variant,
  size,
  className
}: {
  variant: PixelLandmarkVariant;
  size: number;
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
      className={["pixel-landmark", className].filter(Boolean).join(" ")}
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

export default PixelLandmark;
