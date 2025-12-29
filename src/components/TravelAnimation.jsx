import { Plane } from 'lucide-react';
import {
  generateFlightPath,
  quadraticBezierPoint,
  quadraticBezierTangent,
  approximateBezierLength
} from '../utils/geoUtils';

// Simplified world map outline for background
const WORLD_MAP_PATH = `
  M 80 120 Q 100 100 130 105 L 160 95 Q 200 90 220 100 L 260 95 Q 280 100 290 115
  L 295 140 Q 300 160 290 180 L 280 200 Q 270 220 250 225 L 220 220 Q 190 215 170 230
  L 140 245 Q 110 250 90 240 L 70 220 Q 55 195 60 170 L 65 145 Q 70 125 80 120 Z
  M 350 80 Q 380 70 420 75 L 480 70 Q 520 65 560 80 L 600 90 Q 640 100 660 120
  L 670 150 Q 680 180 670 210 L 650 240 Q 620 270 580 280 L 520 285 Q 460 280 420 260
  L 380 235 Q 350 210 340 175 L 335 140 Q 335 105 350 80 Z
  M 700 100 Q 730 90 760 100 L 780 120 Q 790 150 780 180 L 760 200 Q 730 210 700 200
  L 680 175 Q 670 145 680 120 L 700 100 Z
  M 580 290 Q 620 285 650 300 L 670 330 Q 680 360 660 390 L 620 410 Q 580 420 550 400
  L 530 370 Q 520 340 540 310 L 580 290 Z
`;

function WorldMap({ width, height }) {
  return (
    <g opacity="0.15">
      <path
        d={WORLD_MAP_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-blue-300"
      />
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

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Flight info header */}
      <div className="text-center mb-4">
        <div className="text-blue-300 text-sm font-mono uppercase tracking-wider mb-1">
          In Flight
        </div>
        <div className="flex items-center justify-center gap-4 text-white">
          <span className="text-lg font-bold">{origin.name}</span>
          <Plane className="text-yellow-400" size={20} />
          <span className="text-lg font-bold">{destination.name}</span>
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
          {/* Subtle grid */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(100, 150, 255, 0.05)"
                strokeWidth="0.5"
              />
            </pattern>
            {/* Glow filter for plane */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* World map silhouette */}
          <WorldMap width={svgWidth} height={svgHeight} />

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
            style={{ transition: 'stroke-dashoffset 50ms linear' }}
          />

          {/* Gradient for traveled path */}
          <defs>
            <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>

          {/* Origin city dot */}
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
            r="4"
            fill="white"
          />

          {/* Destination city dot */}
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
            r="4"
            fill="white"
          />

          {/* City labels */}
          <text
            x={fromPoint.x}
            y={fromPoint.y - 15}
            textAnchor="middle"
            fill="#22c55e"
            fontSize="12"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {origin.name.toUpperCase()}
          </text>
          <text
            x={toPoint.x}
            y={toPoint.y - 15}
            textAnchor="middle"
            fill="#f97316"
            fontSize="12"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {destination.name.toUpperCase()}
          </text>

          {/* Plane icon */}
          <g
            transform={`translate(${planePos.x}, ${planePos.y}) rotate(${planeAngle})`}
            filter="url(#glow)"
          >
            <circle r="12" fill="rgba(250, 204, 21, 0.3)" />
            <circle r="6" fill="#facc15" />
            <polygon
              points="0,-4 8,0 0,4 2,0"
              fill="white"
              transform="translate(2, 0)"
            />
          </g>
        </svg>
      </div>

      {/* Progress bar and distance */}
      <div className="w-full max-w-2xl mt-4 px-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{origin.name}</span>
          <span className="font-mono text-yellow-400">{distance.toLocaleString()} km</span>
          <span>{destination.name}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="text-center text-gray-500 text-xs mt-2 font-mono">
          {Math.round(progress * 100)}% complete
        </div>
      </div>
    </div>
  );
}

export default TravelAnimation;
