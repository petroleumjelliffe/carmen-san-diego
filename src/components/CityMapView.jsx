import { useState, useEffect } from 'react';
import { MapMarker } from './MapMarker';

/**
 * Abstract city map for investigation screen
 * Shows investigation spots on a simplified grid layout
 */
export function CityMapView({
  currentCity,
  spots,
  investigatedSpots = [],
  onSpotClick,
  hoveredSpotId,
  onSpotHover,
  investigatingSpotIndex = null,
  isAnimating = false,
}) {
  const width = 800;
  const height = 500;

  // Animation progress state (0 to 1)
  const [animationProgress, setAnimationProgress] = useState(0);

  // Position investigation spots at different locations on the grid
  // These are abstract positions - not actual geographic coordinates
  const spotPositions = [
    { x: width * 0.25, y: height * 0.35 },  // Upper left area
    { x: width * 0.5, y: height * 0.5 },    // Center
    { x: width * 0.75, y: height * 0.65 },  // Lower right area
  ];

  // Center position (starting point for animation)
  const centerPos = { x: width / 2, y: height / 2 };

  // Animate progress when investigating
  useEffect(() => {
    if (isAnimating && investigatingSpotIndex !== null) {
      setAnimationProgress(0);
      const startTime = Date.now();
      const duration = 1500; // 1.5 second animation

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimationProgress(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setAnimationProgress(0);
    }
  }, [isAnimating, investigatingSpotIndex]);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{ maxHeight: '600px' }}
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id="cityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="1" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
          </linearGradient>

          {/* Grid pattern */}
          <pattern
            id="cityGrid"
            x="0"
            y="0"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(100, 116, 139, 0.1)"
              strokeWidth="1"
            />
          </pattern>

          {/* Pulsing glow for available spots */}
          <filter id="spotGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={width} height={height} fill="url(#cityGradient)" />

        {/* Grid overlay */}
        <rect x="0" y="0" width={width} height={height} fill="url(#cityGrid)" />

        {/* City silhouette shapes (abstract geometric buildings) */}
        <g opacity="0.08" fill="#cbd5e1">
          {/* Background buildings */}
          <rect x={width * 0.15} y={height * 0.6} width="60" height="150" />
          <rect x={width * 0.25} y={height * 0.5} width="40" height="200" />
          <rect x={width * 0.35} y={height * 0.55} width="70" height="180" />
          <rect x={width * 0.55} y={height * 0.52} width="50" height="190" />
          <rect x={width * 0.65} y={height * 0.58} width="65" height="170" />
          <rect x={width * 0.78} y={height * 0.62} width="45" height="150" />
        </g>

        {/* City name label */}
        <text
          x={width / 2}
          y="30"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="24"
          fontWeight="bold"
          fontFamily="monospace"
          opacity="0.3"
        >
          {currentCity?.name?.toUpperCase()}
        </text>

        {/* Investigation spot markers */}
        {spots?.map((spotData, index) => {
          const spot = spotData.spot;
          const position = spotPositions[index] || spotPositions[0];
          const isInvestigated = investigatedSpots.includes(spot.id);
          const isHovered = hoveredSpotId === spot.id;

          return (
            <g key={spot.id}>
              {/* Connection lines to center (subtle) */}
              <line
                x1={position.x}
                y1={position.y}
                x2={width / 2}
                y2={height / 2}
                stroke="rgba(100, 116, 139, 0.1)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Marker */}
              <MapMarker
                x={position.x}
                y={position.y}
                label={spot.name}
                icon={spot.icon}
                variant={isInvestigated ? 'disabled' : 'destination'}
                pulsing={!isInvestigated}
                isHovered={isHovered}
                disabled={isInvestigated}
                onClick={() => !isInvestigated && onSpotClick?.(index)}
                onHover={(hovered) => onSpotHover?.(hovered ? spot.id : null)}
              />

              {/* Checkmark for investigated spots */}
              {isInvestigated && (
                <text
                  x={position.x}
                  y={position.y + 5}
                  textAnchor="middle"
                  fill="#22c55e"
                  fontSize="20"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  ✓
                </text>
              )}
            </g>
          );
        })}

        {/* Investigation Animation - Moving icon along line */}
        {isAnimating && investigatingSpotIndex !== null && spots[investigatingSpotIndex] && (
          <g className="investigation-animation">
            {(() => {
              const targetPos = spotPositions[investigatingSpotIndex] || spotPositions[0];
              const spot = spots[investigatingSpotIndex].spot;

              // Calculate current position along the path
              const currentX = centerPos.x + (targetPos.x - centerPos.x) * animationProgress;
              const currentY = centerPos.y + (targetPos.y - centerPos.y) * animationProgress;

              return (
                <>
                  {/* Animated line from center to current position */}
                  <line
                    x1={centerPos.x}
                    y1={centerPos.y}
                    x2={currentX}
                    y2={currentY}
                    stroke="#fbbf24"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.8"
                  />

                  {/* Moving icon */}
                  <g transform={`translate(${currentX}, ${currentY})`}>
                    {/* Glow effect */}
                    <circle
                      r="20"
                      fill="#fbbf24"
                      opacity="0.2"
                      className="animate-pulse"
                    />

                    {/* Icon background */}
                    <circle
                      r="15"
                      fill="#1f2937"
                      stroke="#fbbf24"
                      strokeWidth="2"
                    />

                    {/* Icon emoji */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="16"
                      className="pointer-events-none"
                    >
                      {spot.icon || '🔍'}
                    </text>
                  </g>
                </>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}

export default CityMapView;
