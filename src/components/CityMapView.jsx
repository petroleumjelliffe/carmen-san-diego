import { useState, useEffect } from 'react';
import { MapMarker } from './MapMarker';
import { getFlightArcControlPoint } from '../utils/geoUtils';

/**
 * Realistic city map for investigation screen
 * Shows investigation spots on actual city map background
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

  // Convert lat/lon to SVG coordinates using city center as reference
  const latLonToCitySVG = (lat, lon) => {
    if (!currentCity || !currentCity.lat || !currentCity.lon) {
      return { x: width / 2, y: height / 2 };
    }

    // Simple mercator-like projection centered on the city
    // Scale factor to zoom in on the city (smaller = more zoomed in)
    const scale = 15000; // Adjust to fit landmarks within view

    const centerLat = currentCity.lat;
    const centerLon = currentCity.lon;

    // Calculate offset from city center
    const dx = (lon - centerLon) * scale * Math.cos(centerLat * Math.PI / 180);
    const dy = (centerLat - lat) * scale; // Inverted Y axis

    // Center in SVG viewport
    return {
      x: width / 2 + dx,
      y: height / 2 + dy,
    };
  };

  // Position investigation spots based on their lat/lon
  const spotPositions = spots.map(spotData => {
    if (spotData.spot.lat && spotData.spot.lon) {
      return latLonToCitySVG(spotData.spot.lat, spotData.spot.lon);
    }
    // Fallback to default positions if no coordinates
    const index = spots.indexOf(spotData);
    const fallbackPositions = [
      { x: width * 0.25, y: height * 0.35 },
      { x: width * 0.5, y: height * 0.5 },
      { x: width * 0.75, y: height * 0.65 },
    ];
    return fallbackPositions[index] || { x: width / 2, y: height / 2 };
  });

  // Player position (bottom center)
  const playerPos = { x: width / 2, y: height * 0.85 };

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

  // Get city map background image
  const mapImage = currentCity?.map_image;

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Background map image */}
      {mapImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)), url('${mapImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full relative z-10"
        style={{ maxHeight: '600px' }}
      >
        <defs>
          {/* Pulsing glow for available spots */}
          <filter id="spotGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Investigation spot markers */}
        {spots?.map((spotData, index) => {
          const spot = spotData.spot;
          const position = spotPositions[index] || { x: width / 2, y: height / 2 };
          const isInvestigated = investigatedSpots.includes(spot.id);
          const isHovered = hoveredSpotId === spot.id;

          return (
            <g key={spot.id}>
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

        {/* Player marker (always at bottom center) */}
        <MapMarker
          x={playerPos.x}
          y={playerPos.y}
          label="YOU"
          icon="🔍"
          variant="current"
          disabled={true}
        />

        {/* Investigation Animation - Arc from player to destination */}
        {isAnimating && investigatingSpotIndex !== null && spots[investigatingSpotIndex] && (
          <g className="investigation-animation">
            {(() => {
              const targetPos = spotPositions[investigatingSpotIndex] || { x: width / 2, y: height / 2 };
              const spot = spots[investigatingSpotIndex].spot;

              // Calculate arc control point (similar to flight path)
              const controlPoint = getFlightArcControlPoint(playerPos, targetPos);

              // Bezier curve function for position along the path
              const getPointOnCurve = (t) => {
                // Quadratic Bezier curve formula
                const x = Math.pow(1 - t, 2) * playerPos.x +
                         2 * (1 - t) * t * controlPoint.x +
                         Math.pow(t, 2) * targetPos.x;
                const y = Math.pow(1 - t, 2) * playerPos.y +
                         2 * (1 - t) * t * controlPoint.y +
                         Math.pow(t, 2) * targetPos.y;
                return { x, y };
              };

              const currentPos = getPointOnCurve(animationProgress);
              const pathD = `M ${playerPos.x} ${playerPos.y} Q ${controlPoint.x} ${controlPoint.y} ${targetPos.x} ${targetPos.y}`;

              return (
                <>
                  {/* Full path (faded) */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.4)"
                    strokeWidth="4"
                    strokeDasharray="8 8"
                  />

                  {/* Animated line glow */}
                  <path
                    d={`M ${playerPos.x} ${playerPos.y} Q ${controlPoint.x} ${controlPoint.y} ${currentPos.x} ${currentPos.y}`}
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.5)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    filter="blur(4px)"
                  />

                  {/* Animated line from player to current position */}
                  <path
                    d={`M ${playerPos.x} ${playerPos.y} Q ${controlPoint.x} ${controlPoint.y} ${currentPos.x} ${currentPos.y}`}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity="1"
                  />

                  {/* Moving icon */}
                  <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
                    {/* Glow effect */}
                    <circle
                      r="30"
                      fill="#fbbf24"
                      opacity="0.3"
                      className="animate-pulse"
                    />

                    {/* Icon background */}
                    <circle
                      r="22"
                      fill="#1f2937"
                      stroke="#fbbf24"
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
