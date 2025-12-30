import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Plane, Car } from 'lucide-react';
import L from 'leaflet';
import {
  generateFlightPath,
  quadraticBezierPoint,
  quadraticBezierTangent,
  approximateBezierLength
} from '../utils/geoUtils';

/**
 * SVG overlay for animated flight path on Leaflet map
 */
function AnimatedFlightPath({ origin, destination, progress, vehicleType }) {
  const map = useMap();
  const [positions, setPositions] = useState(null);

  const isPlane = vehicleType === 'plane';
  const VehicleIcon = isPlane ? Plane : Car;

  useEffect(() => {
    if (origin && destination) {
      // Convert lat/lon to pixel coordinates
      const fromPoint = map.latLngToContainerPoint([origin.lat, origin.lon]);
      const toPoint = map.latLngToContainerPoint([destination.lat, destination.lon]);

      // Calculate control point for curved path
      const midX = (fromPoint.x + toPoint.x) / 2;
      const midY = (fromPoint.y + toPoint.y) / 2;
      const dx = toPoint.x - fromPoint.x;
      const dy = toPoint.y - fromPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Perpendicular offset for curve
      const curveHeight = distance * 0.2;
      const perpX = -dy / distance * curveHeight;
      const perpY = dx / distance * curveHeight;

      const controlPoint = { x: midX + perpX, y: midY + perpY };

      setPositions({ fromPoint, toPoint, controlPoint });
    }
  }, [origin, destination, map]);

  if (!positions) return null;

  const { fromPoint, toPoint, controlPoint } = positions;
  const mapSize = map.getSize();

  // Calculate current plane position
  const planePos = quadraticBezierPoint(fromPoint, controlPoint, toPoint, progress);
  const planeAngle = quadraticBezierTangent(fromPoint, controlPoint, toPoint, progress);
  const pathD = generateFlightPath(fromPoint, controlPoint, toPoint);
  const pathLength = approximateBezierLength(fromPoint, controlPoint, toPoint);
  const dashOffset = pathLength * (1 - progress);

  const flightPixelDistance = Math.sqrt(
    Math.pow(toPoint.x - fromPoint.x, 2) + Math.pow(toPoint.y - fromPoint.y, 2)
  );
  const isShortFlight = flightPixelDistance < 100;

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
      <defs>
        {/* Glow filter for vehicle */}
        <filter id="travelGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Gradient for traveled path */}
        <linearGradient id="travelFlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        {/* Pulse animation for origin */}
        <radialGradient id="travelOriginPulse">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Dashed path (full route) */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(100, 180, 255, 0.3)"
        strokeWidth="2"
        strokeDasharray="8 8"
      />

      {/* Animated path (traveled portion) */}
      <path
        d={pathD}
        fill="none"
        stroke="url(#travelFlightGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={pathLength}
        strokeDashoffset={dashOffset}
      />

      {/* Origin city - pulsing ring */}
      <circle
        cx={fromPoint.x}
        cy={fromPoint.y}
        r="16"
        fill="url(#travelOriginPulse)"
        opacity={0.5}
      />
      <circle
        cx={fromPoint.x}
        cy={fromPoint.y}
        r="8"
        fill="#22c55e"
        opacity="0.9"
      />
      <circle
        cx={fromPoint.x}
        cy={fromPoint.y}
        r="3"
        fill="white"
      />

      {/* Destination city */}
      <circle
        cx={toPoint.x}
        cy={toPoint.y}
        r="10"
        fill="#f97316"
        opacity="0.3"
      />
      <circle
        cx={toPoint.x}
        cy={toPoint.y}
        r="8"
        fill="#f97316"
        opacity="0.9"
      />
      <circle
        cx={toPoint.x}
        cy={toPoint.y}
        r="3"
        fill="white"
      />

      {/* City labels */}
      <text
        x={fromPoint.x}
        y={fromPoint.y - 22}
        textAnchor="middle"
        fill="#22c55e"
        fontSize="20"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {origin.name.toUpperCase()}
      </text>
      <text
        x={toPoint.x}
        y={toPoint.y - 22}
        textAnchor="middle"
        fill="#f97316"
        fontSize="20"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {destination.name.toUpperCase()}
      </text>

      {/* Vehicle icon - hide when arrived */}
      {progress < 0.99 && (
        <g
          transform={`translate(${planePos.x}, ${planePos.y}) rotate(${planeAngle})`}
          filter="url(#travelGlow)"
        >
          {/* Outer glow */}
          <circle r={isShortFlight ? 16 : 14} fill="rgba(250, 204, 21, 0.2)" />
          {/* Inner glow */}
          <circle r={isShortFlight ? 10 : 8} fill="rgba(250, 204, 21, 0.5)" />

          {isPlane ? (
            <>
              {/* Plane body */}
              <circle r={isShortFlight ? 6 : 5} fill="#facc15" />
              {/* Plane nose direction indicator */}
              <polygon
                points="0,-3 10,0 0,3 3,0"
                fill="white"
                transform={`translate(${isShortFlight ? 4 : 3}, 0)`}
              />
            </>
          ) : (
            <>
              {/* Car body - rounded rectangle */}
              <rect
                x="-6"
                y="-3"
                width="12"
                height="6"
                rx="2"
                fill="#facc15"
              />
              {/* Car front window */}
              <polygon
                points="4,-2 7,-2 7,2 4,2"
                fill="white"
              />
            </>
          )}
        </g>
      )}
    </svg>
  );
}

export function TravelAnimation({ travelData, progress, vehicleType = 'plane', backgroundImage = null }) {
  if (!travelData) return null;

  const {
    origin,
    destination,
    distance,
  } = travelData;

  const isPlane = vehicleType === 'plane';
  const VehicleIcon = isPlane ? Plane : Car;

  // Calculate bounds to fit origin and destination
  const mapBounds = useMemo(() => {
    return [
      [Math.min(origin.lat, destination.lat), Math.min(origin.lon, destination.lon)],
      [Math.max(origin.lat, destination.lat), Math.max(origin.lon, destination.lon)]
    ];
  }, [origin, destination]);

  return (
    <div className="w-full h-[600px] flex flex-col gap-3">
      {/* Travel info header */}
      <div className="text-center flex-shrink-0">
        <div className="text-blue-300 text-xs font-mono uppercase tracking-wider mb-1">
          {isPlane ? 'In Flight' : 'En Route'}
        </div>
        <div className="flex items-center justify-center gap-3 text-white">
          <span className="text-base font-bold">{origin.name}</span>
          <VehicleIcon className="text-yellow-400 animate-pulse" size={18} />
          <span className="text-base font-bold">{destination.name}</span>
        </div>
      </div>

      {/* Leaflet Map with SVG Overlay */}
      <div className="flex-1 relative">
        <MapContainer
          bounds={mapBounds}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          touchZoom={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          dragging={false}
          keyboard={false}
          attributionControl={false}
          boundsOptions={{ padding: [80, 80] }}
        >
          {/* Dark mode map tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            subdomains='abcd'
          />

          {/* Animated flight path overlay */}
          <AnimatedFlightPath
            origin={origin}
            destination={destination}
            progress={progress}
            vehicleType={vehicleType}
          />
        </MapContainer>
      </div>

      {/* Progress bar and distance */}
      <div className="w-full px-4 flex-shrink-0">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span className="text-green-400">{origin.name}</span>
          <span className="font-mono text-yellow-400">{distance.toLocaleString()} km</span>
          <span className="text-orange-400">{destination.name}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full transition-all duration-75"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="text-center text-gray-500 text-xs mt-1 font-mono">
          {Math.round(progress * 100)}%
        </div>
      </div>
    </div>
  );
}

export default TravelAnimation;
