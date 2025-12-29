import { Plane } from 'lucide-react';
import {
  generateFlightPath,
  quadraticBezierPoint,
  quadraticBezierTangent,
  approximateBezierLength
} from '../utils/geoUtils';

// Simplified but recognizable world map continents (equirectangular projection, 800x400)
// Coordinates roughly: x = (lon + 180) / 360 * 800, y = (90 - lat) / 180 * 400
function WorldMapOutlines() {
  return (
    <g className="world-map" opacity="0.2" fill="none" stroke="#4a90d9" strokeWidth="1">
      {/* North America */}
      <path d="M 80 80 L 120 70 L 160 75 L 180 90 L 200 85 L 220 95 L 210 120 L 195 140 L 180 135 L 165 150 L 140 160 L 120 155 L 100 165 L 85 150 L 75 120 L 80 80 Z" />
      {/* Central America */}
      <path d="M 140 160 L 150 175 L 145 190 L 135 195 L 130 180 L 135 165 Z" />
      {/* South America */}
      <path d="M 155 195 L 175 200 L 185 220 L 195 250 L 185 290 L 170 320 L 150 340 L 140 320 L 145 280 L 140 250 L 150 220 L 155 195 Z" />
      {/* Europe */}
      <path d="M 380 75 L 420 70 L 450 80 L 460 95 L 440 100 L 420 95 L 400 105 L 385 95 L 380 75 Z" />
      {/* British Isles */}
      <path d="M 375 80 L 385 75 L 385 90 L 375 90 Z" />
      {/* Africa */}
      <path d="M 400 130 L 440 125 L 470 140 L 485 170 L 480 210 L 460 250 L 430 280 L 400 270 L 385 240 L 390 200 L 400 160 L 400 130 Z" />
      {/* Middle East */}
      <path d="M 470 120 L 510 115 L 530 130 L 520 150 L 490 155 L 470 140 L 470 120 Z" />
      {/* Russia/Asia */}
      <path d="M 460 65 L 520 55 L 600 50 L 680 60 L 720 75 L 700 95 L 650 90 L 600 95 L 550 90 L 500 95 L 470 85 L 460 65 Z" />
      {/* India */}
      <path d="M 540 150 L 570 145 L 585 170 L 570 210 L 545 200 L 535 170 L 540 150 Z" />
      {/* Southeast Asia */}
      <path d="M 590 160 L 620 155 L 640 170 L 635 190 L 610 195 L 595 180 L 590 160 Z" />
      {/* China/East Asia */}
      <path d="M 600 95 L 660 90 L 700 100 L 695 130 L 670 145 L 630 140 L 600 125 L 600 95 Z" />
      {/* Japan */}
      <path d="M 710 100 L 720 95 L 725 115 L 715 130 L 705 120 L 710 100 Z" />
      {/* Indonesia */}
      <path d="M 620 210 L 680 205 L 710 215 L 700 230 L 650 235 L 620 225 L 620 210 Z" />
      {/* Australia */}
      <path d="M 660 260 L 720 250 L 760 265 L 770 300 L 750 330 L 710 340 L 670 325 L 655 295 L 660 260 Z" />
      {/* New Zealand */}
      <path d="M 785 320 L 795 315 L 800 335 L 790 345 L 785 320 Z" />
    </g>
  );
}

export function TravelAnimation({ travelData, progress }) {
  if (!travelData) return null;

  const {
    origin,
    destination,
    distance,
    fromPoint,
    toPoint,
    controlPoint,
    svgWidth,
    svgHeight
  } = travelData;

  // Calculate current plane position
  const planePos = quadraticBezierPoint(fromPoint, controlPoint, toPoint, progress);
  const planeAngle = quadraticBezierTangent(fromPoint, controlPoint, toPoint, progress);

  // Generate path for animation
  const pathD = generateFlightPath(fromPoint, controlPoint, toPoint);
  const pathLength = approximateBezierLength(fromPoint, controlPoint, toPoint);

  // Stroke dashoffset for path reveal animation
  const dashOffset = pathLength * (1 - progress);

  // Calculate flight path distance in pixels for visual scaling
  const flightPixelDistance = Math.sqrt(
    Math.pow(toPoint.x - fromPoint.x, 2) + Math.pow(toPoint.y - fromPoint.y, 2)
  );
  const isShortFlight = flightPixelDistance < 100;

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Flight info header */}
      <div className="text-center mb-3">
        <div className="text-blue-300 text-xs font-mono uppercase tracking-wider mb-1">
          In Flight
        </div>
        <div className="flex items-center justify-center gap-3 text-white">
          <span className="text-base font-bold">{origin.name}</span>
          <Plane className="text-yellow-400 animate-pulse" size={18} />
          <span className="text-base font-bold">{destination.name}</span>
        </div>
      </div>

      {/* SVG Flight Tracker */}
      <div className="w-full max-w-2xl">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0a1628 0%, #0f2847 100%)',
            boxShadow: 'inset 0 0 60px rgba(0, 100, 200, 0.1)'
          }}
        >
          {/* Defs */}
          <defs>
            {/* Subtle grid pattern */}
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(100, 150, 255, 0.05)"
                strokeWidth="0.5"
              />
            </pattern>
            {/* Glow filter for plane */}
            <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Gradient for traveled path */}
            <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            {/* Pulse animation for origin */}
            <radialGradient id="originPulse">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* World map silhouette */}
          <WorldMapOutlines />

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
            stroke="url(#flightGradient)"
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
            fill="url(#originPulse)"
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
            fontSize="11"
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
            fontSize="11"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {destination.name.toUpperCase()}
          </text>

          {/* Plane icon - larger for short flights */}
          <g
            transform={`translate(${planePos.x}, ${planePos.y}) rotate(${planeAngle})`}
            filter="url(#glow)"
          >
            {/* Outer glow */}
            <circle r={isShortFlight ? 16 : 14} fill="rgba(250, 204, 21, 0.2)" />
            {/* Inner glow */}
            <circle r={isShortFlight ? 10 : 8} fill="rgba(250, 204, 21, 0.5)" />
            {/* Plane body */}
            <circle r={isShortFlight ? 6 : 5} fill="#facc15" />
            {/* Plane nose direction indicator */}
            <polygon
              points="0,-3 10,0 0,3 3,0"
              fill="white"
              transform={`translate(${isShortFlight ? 4 : 3}, 0)`}
            />
          </g>
        </svg>
      </div>

      {/* Progress bar and distance */}
      <div className="w-full max-w-2xl mt-3 px-4">
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
