import { useState, useEffect, useRef } from 'react';
import { MapMarker } from './MapMarker';
import { PathAnimation } from './PathAnimation';

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
  hotel = null,
  rogueLocation = null,
  lastInvestigatedSpotId = null,
  onRogueClick = null,
  rogueUsed = false,
  isInvestigatingRogue = false,
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [dimensionsMeasured, setDimensionsMeasured] = useState(false);

  // Measure container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 500,
        });
        setDimensionsMeasured(true);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;

  // Animation progress state (0 to 1)
  const [animationProgress, setAnimationProgress] = useState(0);

  // Calculate optimal scale to fit all landmarks
  const calculateOptimalScale = () => {
    if (!currentCity || !currentCity.lat || !currentCity.lon || !spots || spots.length === 0) {
      return 0.05;
    }

    // Get all landmark coordinates (including hotel and rogue location if available)
    const landmarkCoords = spots
      .filter(s => s.spot.lat && s.spot.lon)
      .map(s => ({ lat: s.spot.lat, lon: s.spot.lon }));

    // Include hotel in bounds calculation
    if (hotel?.lat && hotel?.lon) {
      landmarkCoords.push({ lat: hotel.lat, lon: hotel.lon });
    }

    // Include rogue location in bounds calculation
    if (rogueLocation?.lat && rogueLocation?.lon) {
      landmarkCoords.push({ lat: rogueLocation.lat, lon: rogueLocation.lon });
    }

    if (landmarkCoords.length === 0) return 0.05;

    // Calculate bounds
    const lats = landmarkCoords.map(c => c.lat);
    const lons = landmarkCoords.map(c => c.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Calculate range in degrees
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;

    // Convert to meters (approximate)
    const latRangeMeters = latRange * 111000; // 1 degree lat ≈ 111km
    const lonRangeMeters = lonRange * 111000 * Math.cos(currentCity.lat * Math.PI / 180);

    // Calculate scale to fit with padding
    const padding = 80; // pixels
    const trayHeight = 192; // h-48 = 192px tray at bottom
    const availableWidth = width - 2 * padding;
    const availableHeight = height - trayHeight - 2 * padding;

    const scaleByLat = latRangeMeters > 0 ? availableHeight / latRangeMeters : 0.05;
    const scaleByLon = lonRangeMeters > 0 ? availableWidth / lonRangeMeters : 0.05;

    // Use the smaller scale to ensure everything fits, with min/max bounds
    // Min scale of 0.01 (zoomed out), max scale of 0.2 (zoomed in)
    const optimalScale = Math.max(0.01, Math.min(scaleByLat, scaleByLon, 0.2));

    return optimalScale;
  };

  const scale = calculateOptimalScale();

  // Calculate the center of the landmarks (not city center)
  const getLandmarkCenter = () => {
    const landmarkCoords = spots
      .filter(s => s.spot.lat && s.spot.lon)
      .map(s => ({ lat: s.spot.lat, lon: s.spot.lon }));

    // Include hotel in center calculation
    if (hotel?.lat && hotel?.lon) {
      landmarkCoords.push({ lat: hotel.lat, lon: hotel.lon });
    }

    // Include rogue location in center calculation
    if (rogueLocation?.lat && rogueLocation?.lon) {
      landmarkCoords.push({ lat: rogueLocation.lat, lon: rogueLocation.lon });
    }

    if (landmarkCoords.length === 0) {
      return { lat: currentCity.lat, lon: currentCity.lon };
    }

    const lats = landmarkCoords.map(c => c.lat);
    const lons = landmarkCoords.map(c => c.lon);

    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lon: (Math.min(...lons) + Math.max(...lons)) / 2,
    };
  };

  const landmarkCenter = getLandmarkCenter();

  // Convert lat/lon to SVG coordinates using landmark center as reference
  const latLonToCitySVG = (lat, lon) => {
    if (!currentCity || !currentCity.lat || !currentCity.lon) {
      return { x: width / 2, y: height / 2 };
    }

    // Calculate offset from landmark center in meters, then apply scale
    // 1 degree latitude ≈ 111km = 111000m
    const latDiffMeters = (landmarkCenter.lat - lat) * 111000;
    const lonDiffMeters = (lon - landmarkCenter.lon) * 111000 * Math.cos(currentCity.lat * Math.PI / 180);

    // Calculate the visual center accounting for the tray at bottom
    const trayHeight = 192; // h-48 = 192px
    const visualCenterX = width / 2;
    const visualCenterY = (height - trayHeight) / 2;

    // Apply scale (pixels per meter) and center in available space
    return {
      x: visualCenterX + (lonDiffMeters * scale),
      y: visualCenterY + (latDiffMeters * scale),
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

  // Rogue location position
  const roguePos = rogueLocation?.lat && rogueLocation?.lon
    ? latLonToCitySVG(rogueLocation.lat, rogueLocation.lon)
    : null;

  // Player starting position (hotel)
  const playerPos = hotel?.lat && hotel?.lon
    ? latLonToCitySVG(hotel.lat, hotel.lon)
    : (() => {
        const trayHeight = 192; // h-48 = 192px
        const availableHeight = height - trayHeight;
        return { x: width / 2, y: availableHeight * 0.85 };
      })();

  // Animation starting position (last investigated spot, or hotel if none)
  const animationStartPos = (() => {
    if (lastInvestigatedSpotId) {
      const lastSpotIndex = spots.findIndex(s => s.spot.id === lastInvestigatedSpotId);
      if (lastSpotIndex >= 0 && spotPositions[lastSpotIndex]) {
        return spotPositions[lastSpotIndex];
      }
    }
    return playerPos;
  })();

  // Animate progress when investigating
  useEffect(() => {
    if (investigatingSpotIndex !== null || isInvestigatingRogue) {
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
  }, [investigatingSpotIndex, isInvestigatingRogue]);

  // Get city map background image
  const mapImage = currentCity?.map_image;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full relative z-10"
        style={{ maxHeight: '600px' }}
      >
        <defs>
          {/* City grid pattern */}
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
              stroke="rgba(100, 116, 139, 0.15)"
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

        {/* Grid background */}
        <rect x="0" y="0" width={width} height={height} fill="url(#cityGrid)" />

        {/* Investigation spot markers */}
        {dimensionsMeasured && spots?.map((spotData, index) => {
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

        {/* Player marker (at hotel) */}
        {dimensionsMeasured && (
          <MapMarker
            x={playerPos.x}
            y={playerPos.y}
            label={hotel?.name || "YOU"}
            icon={hotel?.icon || "🔍"}
            variant="current"
            disabled={true}
          />
        )}

        {/* Rogue location marker */}
        {dimensionsMeasured && roguePos && (
          <MapMarker
            x={roguePos.x}
            y={roguePos.y}
            label={rogueLocation.name}
            icon={rogueLocation.icon}
            variant="destination"
            pulsing={!rogueUsed}
            disabled={rogueUsed}
            onClick={onRogueClick && !rogueUsed ? onRogueClick : undefined}
          />
        )}

        {/* Investigation Animation - Car traveling on orthogonal path */}
        {investigatingSpotIndex !== null && spots[investigatingSpotIndex] && (
          <PathAnimation
            startPos={animationStartPos}
            endPos={spotPositions[investigatingSpotIndex] || { x: width / 2, y: height / 2 }}
            progress={animationProgress}
            pathType="orthogonal"
            icon="🚗"
            color="#fbbf24"
            glowColor="rgba(251, 191, 36, 0.5)"
            dashColor="rgba(251, 191, 36, 0.4)"
            size={22}
          />
        )}

        {/* Rogue Action Animation - Car traveling on orthogonal path (orange) */}
        {isInvestigatingRogue && roguePos && (
          <PathAnimation
            startPos={animationStartPos}
            endPos={roguePos}
            progress={animationProgress}
            pathType="orthogonal"
            icon="🚗"
            color="#f97316"
            glowColor="rgba(249, 115, 22, 0.5)"
            dashColor="rgba(249, 115, 22, 0.4)"
            size={22}
          />
        )}
      </svg>
    </div>
  );
}

export default CityMapView;
