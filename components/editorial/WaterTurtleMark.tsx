type WaterTurtleMarkProps = {
  className?: string;
};

function TurtleGlyph({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <path
        d="M70 24c21 0 34 17 34 38 0 24-15 40-34 40S36 86 36 62c0-21 13-38 34-38Z"
        fill="currentColor"
        fillOpacity="0.055"
      />
      <path
        d="M61 26c0-10 4-17 9-17s9 7 9 17"
        fill="currentColor"
        fillOpacity="0.04"
      />
      <path
        d="M39 43C29 34 18 35 11 44c11 1 15 10 22 17 1-8 3-14 6-18ZM101 43c10-9 21-8 28 1-11 1-15 10-22 17-1-8-3-14-6-18ZM38 78c-12 1-18 8-20 18 9-2 17 1 25 7 0-9-2-17-5-25ZM102 78c12 1 18 8 20 18-9-2-17 1-25 7 0-9 2-17 5-25Z"
        fill="currentColor"
        fillOpacity="0.04"
      />
      <path d="M65 100l5 10 5-10" />
      <path d="M70 31c-9 8-14 19-14 31s5 24 14 32M70 31c9 8 14 19 14 31s-5 24-14 32M44 53c16 7 36 7 52 0M44 72c16-7 36-7 52 0" />
      <path d="M64 16c4 2 8 2 12 0M63 20c5 2 9 2 14 0" strokeWidth="1.5" />
    </g>
  );
}

export function WaterTurtleMark({ className }: WaterTurtleMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 176 116"
      fill="none"
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      <g
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <TurtleGlyph transform="translate(-2 27) rotate(-8 70 58) scale(.68)" />
        <TurtleGlyph transform="translate(79 3) rotate(7 70 58) scale(.7)" />
        <path
          d="M24 108c18-4 36-4 54 0 19 4 38 4 57 0 8-2 16-2 24 0"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  );
}
