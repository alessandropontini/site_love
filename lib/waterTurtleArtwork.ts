/** Shared vector artwork. Individual likeness awaits the couple's source photos. */
export const turtlePalette = {
  ink: "#303629", shell: "#616047", skin: "#58664a", gold: "#c3ad65", seam: "#aaa071"
};
export const turtleShapes = [
  // Compact webbed feet and a narrow tail, instead of sea-turtle flippers.
  { d: "M45 43Q31 35 26 44L24 54 31 52 28 58 37 54 44 58ZM95 43Q109 35 114 44L116 54 109 52 112 58 103 54 96 58ZM44 79Q30 80 28 94L34 93 32 100 39 96 45 98 49 88ZM96 79Q110 80 112 94L106 93 108 100 101 96 95 98 91 88ZM66 99L70 113 74 99", fill: "skin", stroke: "ink", width: 1.6 },
  { d: "M60 32L60 24Q55 15 61 8Q70 1 79 8Q85 15 80 24L80 32Z", fill: "skin", stroke: "ink", width: 1.8 },
  { d: "M61 16L62 25M79 16L78 25", stroke: "gold", width: 4 },
  { d: "M67 8L67 24M73 8L73 24M31 44L39 49M109 44L101 49M34 86L43 89M106 86L97 89", stroke: "gold", width: 1.3 },
  { d: "M61 12L63 12M77 12L79 12", stroke: "ink", width: 2.6 },
  // Low oval carapace, a fine marginal rim and five central scutes.
  { d: "M70 25C91 25 105 42 104 65C103 88 89 104 70 104C51 104 37 88 36 65C35 42 49 25 70 25Z", fill: "shell", stroke: "ink", width: 2 },
  { d: "M70 30C89 30 100 45 99 65C98 85 86 99 70 99C54 99 42 85 41 65C40 45 51 30 70 30ZM70 32L60 40 59 52 70 59 81 52 80 40ZM70 59L58 66 60 80 70 85 80 80 82 66ZM70 85L61 92 65 98M70 85L79 92 75 98M60 40L48 39M80 40L92 39M59 52L42 55M81 52L98 55M58 66L42 72M82 66L98 72M60 80L50 90M80 80L90 90", stroke: "seam", width: 1.2 },
  { d: "M49 46L53 50M91 46L87 50M46 62L52 63M94 62L88 63M49 78L54 75M91 78L86 75M65 43L69 39M65 68L69 64M67 91L70 88", stroke: "gold", width: 1.8 }
] as const;
export const turtlePlacements = [
  { x: 2, y: 29, angle: -12, scale: 0.69 },
  { x: 90, y: 1, angle: 12, scale: 0.82 }
];
export const turtleViewBox = "0 0 210 140";
