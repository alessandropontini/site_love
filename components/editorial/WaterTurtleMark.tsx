type WaterTurtleMarkProps = {
  className?: string;
};

export function WaterTurtleMark({ className }: WaterTurtleMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 116"
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
        <path
          d="M29 110c13-4 26-4 39 0 14 4 29 4 44 0"
          strokeOpacity="0.5"
        />
      </g>
    </svg>
  );
}
