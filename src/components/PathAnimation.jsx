import {
  getOrthogonalPathD,
  getCurrentOrthogonalPathD,
  getPointOnOrthogonalPath,
} from '../utils/pathUtils';

/**
 * Reusable path animation component for travel visualizations
 * Supports both orthogonal (street-like) and arc (flight) path types
 */
export function PathAnimation({
  startPos,
  endPos,
  progress,
  pathType = 'orthogonal',
  icon = '🚗',
  color = '#fbbf24',
  glowColor = 'rgba(251, 191, 36, 0.5)',
  dashColor = 'rgba(251, 191, 36, 0.4)',
  size = 22,
}) {
  if (!startPos || !endPos) return null;

  // Calculate current position based on path type
  const currentPos = pathType === 'orthogonal'
    ? getPointOnOrthogonalPath(startPos, endPos, progress)
    : startPos; // Arc support can be added later if needed

  // Generate path strings based on path type
  const fullPathD = pathType === 'orthogonal'
    ? getOrthogonalPathD(startPos, endPos)
    : `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`;

  const currentPathD = pathType === 'orthogonal'
    ? getCurrentOrthogonalPathD(startPos, endPos, progress)
    : `M ${startPos.x} ${startPos.y} L ${currentPos.x} ${currentPos.y}`;

  return (
    <g className="path-animation">
      {/* Full path (dashed preview) */}
      <path
        d={fullPathD}
        fill="none"
        stroke={dashColor}
        strokeWidth="4"
        strokeDasharray="8 8"
      />

      {/* Animated line glow */}
      <path
        d={currentPathD}
        fill="none"
        stroke={glowColor}
        strokeWidth="12"
        strokeLinecap="round"
        filter="blur(4px)"
      />

      {/* Animated line from start to current position */}
      <path
        d={currentPathD}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="1"
      />

      {/* Moving icon */}
      <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
        {/* Glow effect */}
        <circle
          r="30"
          fill={color}
          opacity="0.3"
          className="animate-pulse"
        />

        {/* Icon background */}
        <circle
          r={size}
          fill="#1f2937"
          stroke={color}
          strokeWidth="3"
        />

        {/* Icon emoji */}
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="28"
          className="pointer-events-none"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
        >
          {icon}
        </text>
      </g>
    </g>
  );
}

export default PathAnimation;
