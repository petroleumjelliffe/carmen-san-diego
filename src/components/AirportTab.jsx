import { useState } from 'react';
import { Plane, Clock, MapPin } from 'lucide-react';
import { latLonToSVG } from '../utils/geoUtils';

// Simplified but recognizable world map continents
function WorldMapOutlines() {
  return (
    <g className="world-map" opacity="0.15" fill="none" stroke="#4a90d9" strokeWidth="1">
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

// Clickable city marker on the map
function CityMarker({ city, point, isCurrent, isHovered, disabled, onClick, onHover }) {
  const baseSize = isCurrent ? 10 : 8;
  const hoverSize = baseSize + 4;
  const size = isHovered ? hoverSize : baseSize;

  return (
    <g
      className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      onClick={() => !disabled && !isCurrent && onClick?.()}
      onMouseEnter={() => !isCurrent && onHover?.(city.cityId || city.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Pulse ring for current city */}
      {isCurrent && (
        <circle
          cx={point.x}
          cy={point.y}
          r="18"
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          opacity="0.4"
          className="animate-ping"
          style={{ animationDuration: '2s' }}
        />
      )}

      {/* Hover highlight ring */}
      {isHovered && !isCurrent && (
        <circle
          cx={point.x}
          cy={point.y}
          r={size + 6}
          fill="rgba(59, 130, 246, 0.2)"
        />
      )}

      {/* Outer glow */}
      <circle
        cx={point.x}
        cy={point.y}
        r={size + 2}
        fill={isCurrent ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}
      />

      {/* Main dot */}
      <circle
        cx={point.x}
        cy={point.y}
        r={size}
        fill={isCurrent ? '#22c55e' : disabled ? '#6b7280' : '#3b82f6'}
        className={!isCurrent && !disabled ? 'transition-all duration-150' : ''}
      />

      {/* Inner highlight */}
      <circle
        cx={point.x}
        cy={point.y}
        r={size * 0.4}
        fill="white"
        opacity={isCurrent ? 1 : 0.8}
      />

      {/* City label */}
      <text
        x={point.x}
        y={point.y - size - 8}
        textAnchor="middle"
        fill={isCurrent ? '#22c55e' : disabled ? '#6b7280' : '#60a5fa'}
        fontSize="10"
        fontWeight="bold"
        fontFamily="monospace"
        className="pointer-events-none select-none"
      >
        {city.name?.toUpperCase()}
      </text>
    </g>
  );
}

export function AirportTab({ destinations, timeRemaining, travelTime, onTravel, currentCity }) {
  const [hoveredCity, setHoveredCity] = useState(null);
  const canTravel = timeRemaining >= travelTime;

  const svgWidth = 800;
  const svgHeight = 400;

  // Calculate positions for all cities
  const currentPoint = currentCity?.lat
    ? latLonToSVG(currentCity.lat, currentCity.lon, svgWidth, svgHeight)
    : null;

  const destinationPoints = destinations.map(dest => ({
    ...dest,
    point: dest.lat
      ? latLonToSVG(dest.lat, dest.lon, svgWidth, svgHeight)
      : null
  })).filter(d => d.point);

  // Match TravelAnimation container structure exactly
  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Header - matches TravelAnimation header structure */}
      <div className="text-center mb-3">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Plane className="text-yellow-400" size={18} />
          <span className="text-blue-300 text-xs font-mono uppercase tracking-wider">
            Select Destination
          </span>
          <div className={`px-2 py-0.5 rounded text-xs font-mono ${
            canTravel ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            {canTravel ? 'READY' : 'DELAYED'}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            {currentCity?.name || 'Current'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            <span className="text-yellow-300 font-mono">{travelTime}h</span> flight
          </span>
        </div>
      </div>

      {/* SVG Map - same max-w-2xl as TravelAnimation */}
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
            <pattern id="airportGrid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="rgba(100, 150, 255, 0.05)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#airportGrid)" />

          {/* World map silhouette */}
          <WorldMapOutlines />

          {/* Connection lines from current to destinations */}
          {currentPoint && destinationPoints.map(dest => (
            <line
              key={`line-${dest.cityId}`}
              x1={currentPoint.x}
              y1={currentPoint.y}
              x2={dest.point.x}
              y2={dest.point.y}
              stroke={hoveredCity === dest.cityId ? 'rgba(59, 130, 246, 0.5)' : 'rgba(100, 150, 255, 0.15)'}
              strokeWidth={hoveredCity === dest.cityId ? 2 : 1}
              strokeDasharray={hoveredCity === dest.cityId ? 'none' : '4 4'}
              className="transition-all duration-150"
            />
          ))}

          {/* Destination city markers */}
          {destinationPoints.map(dest => (
            <CityMarker
              key={dest.cityId}
              city={dest}
              point={dest.point}
              isCurrent={false}
              isHovered={hoveredCity === dest.cityId}
              disabled={!canTravel}
              onClick={() => onTravel(dest)}
              onHover={setHoveredCity}
            />
          ))}

          {/* Current city marker (on top) */}
          {currentPoint && (
            <CityMarker
              city={currentCity}
              point={currentPoint}
              isCurrent={true}
              isHovered={false}
              disabled={true}
            />
          )}
        </svg>
      </div>

      {/* Destination list - matches TravelAnimation progress bar area */}
      <div className="w-full max-w-2xl mt-3 px-4">
        <div className="grid grid-cols-2 gap-2">
          {destinations.map(dest => (
            <button
              key={dest.cityId}
              onClick={() => onTravel(dest)}
              disabled={!canTravel}
              onMouseEnter={() => setHoveredCity(dest.cityId)}
              onMouseLeave={() => setHoveredCity(null)}
              className={`text-left p-2 rounded transition-all ${
                !canTravel
                  ? 'opacity-50 cursor-not-allowed bg-gray-800/50'
                  : hoveredCity === dest.cityId
                    ? 'bg-blue-700 scale-[1.02]'
                    : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-blue-400 flex-shrink-0" />
                <span className="text-white text-sm font-medium truncate">{dest.name}</span>
              </div>
              <div className="text-gray-400 text-xs truncate pl-5">{dest.country}</div>
            </button>
          ))}
        </div>

        {!canTravel && (
          <div className="text-center text-red-400 text-xs mt-2">
            Need at least {travelTime} hours to travel
          </div>
        )}
      </div>
    </div>
  );
}

export default AirportTab;
