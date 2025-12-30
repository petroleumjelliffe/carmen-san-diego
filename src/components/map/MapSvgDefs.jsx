/**
 * Shared SVG definitions (patterns, filters, gradients) for map components
 * Renders a <defs> element with configurable patterns
 */
export function MapSvgDefs({
  includeGrid = false,
  gridSize = 50,
  gridOpacity = 0.15,
  gridColor = 'rgba(100, 116, 139, 0.15)',

  includeWorldGrid = false,
  worldGridSize = 40,
  worldGridOpacity = 0.05,
  worldGridColor = 'rgba(100, 116, 139, 0.05)',

  includeGlow = false,
  glowStdDeviation = 3,

  includeFlightGradient = false,
  includeWorldGradient = false,
  includeOriginPulse = false,

  idPrefix = '',  // Prefix for IDs to avoid conflicts
}) {
  // Helper to generate unique IDs
  const id = (name) => idPrefix ? `${idPrefix}-${name}` : name;

  return (
    <defs>
      {/* City grid pattern - for CityMapView */}
      {includeGrid && (
        <pattern
          id={id('cityGrid')}
          x="0"
          y="0"
          width={gridSize}
          height={gridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke={gridColor}
            strokeWidth="1"
          />
        </pattern>
      )}

      {/* World grid pattern - for AirportTab and TravelAnimation */}
      {includeWorldGrid && (
        <pattern
          id={id('worldGrid')}
          x="0"
          y="0"
          width={worldGridSize}
          height={worldGridSize}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${worldGridSize} 0 L 0 0 0 ${worldGridSize}`}
            fill="none"
            stroke={worldGridColor}
            strokeWidth="0.5"
          />
        </pattern>
      )}

      {/* Glow filter - for CityMapView spots and TravelAnimation plane */}
      {includeGlow && (
        <filter id={id('glow')} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={glowStdDeviation} result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}

      {/* Spot glow filter - for CityMapView (different deviation) */}
      {includeGlow && (
        <filter id={id('spotGlow')}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}

      {/* Flight gradient - for TravelAnimation */}
      {includeFlightGradient && (
        <linearGradient id={id('flightGradient')} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      )}

      {/* World background gradient - for AirportTab */}
      {includeWorldGradient && (
        <linearGradient id={id('worldGradient')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="1" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
        </linearGradient>
      )}

      {/* Pulse animation for origin - TravelAnimation */}
      {includeOriginPulse && (
        <radialGradient id={id('originPulse')}>
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      )}
    </defs>
  );
}

export default MapSvgDefs;
