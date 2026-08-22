type WaterTurtleMarkProps = {
  className?: string;
};

export function WaterTurtleMark({ className }: WaterTurtleMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 82"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M22 43C28 18 72 13 91 39c-7 18-23 26-42 23-13-2-22-8-27-19Z"
          fill="currentColor"
          fillOpacity="0.08"
        />
        <path d="M90 40c6-8 15-10 22-5 5 4 4 12-2 15-6 3-13 1-19-3M22 42l-11 5 12 5M39 58c0 7-4 11-9 12M76 57c2 7 7 10 12 10" />
        <path d="M34 40c14 8 30 8 47-1M49 22c2 12 1 25-4 38M69 23c-3 12-2 24 4 34" />
        <path d="M17 72c18-4 32-4 48 0 14 4 25 4 38 0M31 79c12-2 24-2 36 1 9 2 17 2 24 0" />
      </g>
    </svg>
  );
}
