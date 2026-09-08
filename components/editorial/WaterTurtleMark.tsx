import { turtlePalette, turtlePlacements, turtleShapes, turtleViewBox } from "@/lib/waterTurtleArtwork";

export function WaterTurtleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={turtleViewBox} fill="none" aria-hidden="true" focusable="false">
      {turtlePlacements.map(({ x, y, angle, scale }, index) => (
        <g key={index} transform={`translate(${x} ${y}) scale(${scale}) rotate(${angle} 70 65)`} strokeLinecap="round" strokeLinejoin="round">
          {turtleShapes.map((shape, i) => (
            <path key={i} d={shape.d} fill={"fill" in shape ? turtlePalette[shape.fill] : "none"} stroke={turtlePalette[shape.stroke]} strokeWidth={shape.width} />
          ))}
        </g>
      ))}
    </svg>
  );
}
