import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PathAnimation } from './PathAnimation';

/**
 * SVG overlay for landmark labels
 */
function LandmarkLabels({ spots, hotel, rogueLocation, investigatedSpots }) {
  const map = useMap();
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const updatePositions = () => {
      const landmarkPositions = [];

      // Add hotel
      if (hotel?.lat && hotel?.lon) {
        const point = map.latLngToContainerPoint([hotel.lat, hotel.lon]);
        landmarkPositions.push({
          id: 'hotel',
          name: hotel.name,
          x: point.x,
          y: point.y,
          color: '#22c55e'
        });
      }

      // Add investigation spots
      spots.forEach(spotData => {
        const spot = spotData.spot;
        if (spot.lat && spot.lon) {
          const isInvestigated = investigatedSpots.includes(spot.id);
          const point = map.latLngToContainerPoint([spot.lat, spot.lon]);
          landmarkPositions.push({
            id: spot.id,
            name: spot.name,
            x: point.x,
            y: point.y,
            color: isInvestigated ? '#9ca3af' : '#3b82f6'
          });
        }
      });

      // Add rogue location
      if (rogueLocation?.lat && rogueLocation?.lon) {
        const point = map.latLngToContainerPoint([rogueLocation.lat, rogueLocation.lon]);
        landmarkPositions.push({
          id: 'rogue',
          name: rogueLocation.name,
          x: point.x,
          y: point.y,
          color: '#f97316'
        });
      }

      setPositions(landmarkPositions);
    };

    updatePositions();
    map.on('move', updatePositions);
    map.on('zoom', updatePositions);

    return () => {
      map.off('move', updatePositions);
      map.off('zoom', updatePositions);
    };
  }, [spots, hotel, rogueLocation, investigatedSpots, map]);

  const mapSize = map.getSize();

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
      viewBox={`0 0 ${mapSize.x} ${mapSize.y}`}
    >
      {positions.map((landmark) => (
        <text
          key={landmark.id}
          x={landmark.x}
          y={landmark.y - 12}
          textAnchor="middle"
          fill={landmark.color}
          fontSize="20"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {landmark.name.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

/**
 * Component to handle auto-fitting map bounds when selecting destinations
 */
function FitBoundsOnSelect({ playerPos, destination }) {
  const map = useMap();

  useEffect(() => {
    if (destination && playerPos) {
      const bounds = L.latLngBounds([
        [playerPos.lat, playerPos.lon],
        [destination.lat, destination.lon]
      ]);

      map.fitBounds(bounds, {
        padding: [80, 80, 220, 80], // top, right, bottom (tray height + margin), left
        maxZoom: 16,
        animate: true,
        duration: 0.5
      });
    }
  }, [destination, playerPos, map]);

  return null;
}

/**
 * Component to render SVG overlay for PathAnimation on Leaflet map
 */
function PathAnimationOverlay({ startPos, endPos, progress, pathType, icon, color, glowColor, dashColor, size }) {
  const map = useMap();
  const [positions, setPositions] = useState({ start: null, end: null });

  useEffect(() => {
    if (startPos && endPos) {
      // Convert lat/lon to pixel coordinates
      const startPoint = map.latLngToContainerPoint([startPos.lat, startPos.lon]);
      const endPoint = map.latLngToContainerPoint([endPos.lat, endPos.lon]);
      setPositions({ start: startPoint, end: endPoint });
    }
  }, [startPos, endPos, map]);

  if (!positions.start || !positions.end) return null;

  const mapSize = map.getSize();

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000
      }}
      viewBox={`0 0 ${mapSize.x} ${mapSize.y}`}
    >
      <PathAnimation
        startPos={positions.start}
        endPos={positions.end}
        progress={progress}
        pathType={pathType}
        icon={icon}
        color={color}
        glowColor={glowColor}
        dashColor={dashColor}
        size={size}
      />
    </svg>
  );
}

/**
 * Interactive city map for investigation screen using Leaflet
 * Shows investigation spots on actual city street map
 */
export function CityMapView({
  currentCity,
  spots,
  investigatedSpots = [],
  onSpotClick,
  hoveredSpotId,
  onSpotHover,
  investigatingSpotIndex = null,
  hotel = null,
  rogueLocation = null,
  lastInvestigatedSpotId = null,
  onRogueClick = null,
  rogueUsed = false,
  isInvestigatingRogue = false,
  isAnimating = false,
}) {
  // DEBUG: Log what CityMapView receives
  console.log('[DEBUG] CityMapView received:', {
    investigatedSpots,
    investigatedSpotsTypes: investigatedSpots?.map(x => typeof x),
    spotIds: spots?.map(s => s?.spot?.id),
    lastInvestigatedSpotId,
    lastInvestigatedSpotIdType: typeof lastInvestigatedSpotId,
  });

  // DEBUG: Validate investigatedSpots format
  investigatedSpots?.forEach((item, i) => {
    if (typeof item !== 'string') {
      console.error(`[BUG] CityMapView.investigatedSpots[${i}] is ${typeof item} (${item}), expected string`);
    }
  });

  const mapRef = useRef(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [lastAnimationEnd, setLastAnimationEnd] = useState(null);

  // Calculate center and bounds for initial map view
  const getInitialBounds = () => {
    const landmarkCoords = [];

    // Add all spots
    spots.forEach(s => {
      if (s.spot.lat && s.spot.lon) {
        landmarkCoords.push([s.spot.lat, s.spot.lon]);
      }
    });

    // Add hotel
    if (hotel?.lat && hotel?.lon) {
      landmarkCoords.push([hotel.lat, hotel.lon]);
    }

    // Add rogue location
    if (rogueLocation?.lat && rogueLocation?.lon) {
      landmarkCoords.push([rogueLocation.lat, rogueLocation.lon]);
    }

    if (landmarkCoords.length === 0) {
      return [[currentCity.lat, currentCity.lon]];
    }

    return landmarkCoords;
  };

  // Animate progress when investigating
  useEffect(() => {
    if (investigatingSpotIndex !== null || isInvestigatingRogue) {
      setAnimationProgress(0);

      // Store the destination for this animation
      if (isInvestigatingRogue && rogueLocation?.lat && rogueLocation?.lon) {
        setLastAnimationEnd({ lat: rogueLocation.lat, lon: rogueLocation.lon });
      } else if (investigatingSpotIndex !== null) {
        const spot = spots[investigatingSpotIndex]?.spot;
        if (spot?.lat && spot?.lon) {
          setLastAnimationEnd({ lat: spot.lat, lon: spot.lon });
        }
      }

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
  }, [investigatingSpotIndex, isInvestigatingRogue, spots, rogueLocation]);

  // Get selected destination for fit bounds (when clicking a spot)
  const selectedSpot = investigatingSpotIndex !== null
    ? spots[investigatingSpotIndex]?.spot
    : (isInvestigatingRogue ? rogueLocation : null);

  // Get animation positions
  const getAnimationStartPos = () => {
    if (lastInvestigatedSpotId) {
      const lastSpot = spots.find(s => s.spot.id === lastInvestigatedSpotId)?.spot;
      if (lastSpot?.lat && lastSpot?.lon) {
        return { lat: lastSpot.lat, lon: lastSpot.lon };
      }
    }
    return hotel ? { lat: hotel.lat, lon: hotel.lon } : null;
  };

  const getAnimationEndPos = () => {
    if (isInvestigatingRogue && rogueLocation?.lat && rogueLocation?.lon) {
      return { lat: rogueLocation.lat, lon: rogueLocation.lon };
    }
    if (investigatingSpotIndex !== null) {
      const spot = spots[investigatingSpotIndex]?.spot;
      if (spot?.lat && spot?.lon) {
        return { lat: spot.lat, lon: spot.lon };
      }
    }
    // Use last animation end position when showing completed animation during ticking
    return lastAnimationEnd;
  };

  const animationStartPos = getAnimationStartPos();
  const animationEndPos = getAnimationEndPos();

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer
        ref={mapRef}
        bounds={getInitialBounds()}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
        minZoom={12}
        maxZoom={18}
        boundsOptions={{ padding: [80, 80, 220, 80] }} // Account for bottom tray
      >
        {/* CartoDB Dark Matter tiles for better label readability */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Hotel marker (player's current position) - green circle */}
        {hotel?.lat && hotel?.lon && (
          <CircleMarker
            center={[hotel.lat, hotel.lon]}
            radius={6}
            pathOptions={{
              fillColor: '#22c55e',
              fillOpacity: 0.9,
              color: 'white',
              weight: 2,
            }}
          />
        )}

        {/* Investigation spot markers - blue circles */}
        {spots?.map((spotData, index) => {
          const spot = spotData.spot;
          const isInvestigated = investigatedSpots.includes(spot.id);

          // DEBUG: Log comparison for first render
          if (index === 0 && investigatedSpots.length > 0) {
            console.log('[DEBUG] CityMapView marker comparison:', {
              spotId: spot.id,
              spotIdType: typeof spot.id,
              investigatedSpots,
              investigatedSpotsTypes: investigatedSpots.map(x => typeof x),
              includes: investigatedSpots.includes(spot.id),
              manualCheck: investigatedSpots.some(x => x === spot.id),
            });
          }

          if (!spot.lat || !spot.lon) return null;

          return (
            <CircleMarker
              key={spot.id}
              center={[spot.lat, spot.lon]}
              radius={6}
              pathOptions={{
                fillColor: isInvestigated ? '#9ca3af' : '#3b82f6',
                fillOpacity: 0.9,
                color: 'white',
                weight: 2,
              }}
              eventHandlers={{
                click: () => !isInvestigated && onSpotClick?.(index),
                mouseover: () => onSpotHover?.(spot.id),
                mouseout: () => onSpotHover?.(null),
              }}
            />
          );
        })}

        {/* Rogue location marker - orange circle */}
        {rogueLocation?.lat && rogueLocation?.lon && (
          <CircleMarker
            center={[rogueLocation.lat, rogueLocation.lon]}
            radius={6}
            pathOptions={{
              fillColor: rogueUsed ? '#9ca3af' : '#f97316',
              fillOpacity: 0.9,
              color: 'white',
              weight: 2,
            }}
            eventHandlers={{
              click: onRogueClick && !rogueUsed ? onRogueClick : undefined,
            }}
          />
        )}

        {/* Auto-fit bounds when clicking on spots */}
        {hotel && selectedSpot && selectedSpot.lat && selectedSpot.lon && (
          <FitBoundsOnSelect
            playerPos={{ lat: hotel.lat, lon: hotel.lon }}
            destination={{ lat: selectedSpot.lat, lon: selectedSpot.lon }}
          />
        )}

        {/* Landmark labels overlay */}
        <LandmarkLabels
          spots={spots}
          hotel={hotel}
          rogueLocation={rogueLocation}
          investigatedSpots={investigatedSpots}
        />

        {/* PathAnimation overlay for investigation animation */}
        {(investigatingSpotIndex !== null || isInvestigatingRogue || isAnimating) &&
          animationStartPos &&
          animationEndPos && (
            <PathAnimationOverlay
              startPos={animationStartPos}
              endPos={animationEndPos}
              progress={investigatingSpotIndex !== null || isInvestigatingRogue ? animationProgress : 1.0}
              pathType="orthogonal"
              icon="🚗"
              color={isInvestigatingRogue ? '#f97316' : '#fbbf24'}
              glowColor={
                isInvestigatingRogue
                  ? 'rgba(249, 115, 22, 0.5)'
                  : 'rgba(251, 191, 36, 0.5)'
              }
              dashColor={
                isInvestigatingRogue
                  ? 'rgba(249, 115, 22, 0.4)'
                  : 'rgba(251, 191, 36, 0.4)'
              }
              size={22}
            />
          )}
      </MapContainer>
    </div>
  );
}

export default CityMapView;
