import { useState, useRef, useEffect } from 'react';
import { getFlightArcControlPoint } from '../utils/geoUtils';
import { MapMarker } from './MapMarker';
import { OptionCard } from './OptionCard';
import { OptionTray } from './OptionTray';
import { useIsDesktop } from '../hooks/useMediaQuery';

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

export function AirportTab({ destinations, timeRemaining, travelTime, onTravel, currentCity }) {
  const [hoveredCity, setHoveredCity] = useState(null);
  const isDesktop = useIsDesktop();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Measure container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 400,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;
  const canTravel = timeRemaining >= travelTime;

  // Get all cities (current + destinations)
  const allCities = currentCity ? [currentCity, ...destinations] : destinations;

  // Calculate optimal scale to fit all cities
  const calculateOptimalScale = () => {
    if (allCities.length === 0) return 1;

    const cityCoords = allCities
      .filter(c => c.lat && c.lon)
      .map(c => ({ lat: c.lat, lon: c.lon }));

    if (cityCoords.length === 0) return 1;

    const lats = cityCoords.map(c => c.lat);
    const lons = cityCoords.map(c => c.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;

    // Calculate scale with padding
    const padding = 60;
    // Account for option tray at bottom (192px)
    const trayWidth = 0;
    const trayHeight = 192;
    const availableWidth = width - trayWidth - 2 * padding;
    const availableHeight = height - trayHeight - 2 * padding;

    // Calculate scale based on degree ranges (not meters)
    const scaleByLat = latRange > 0 ? availableHeight / latRange : 1;
    const scaleByLon = lonRange > 0 ? availableWidth / lonRange : 1;

    // Use the smaller scale to fit everything
    return Math.min(scaleByLat, scaleByLon, availableHeight / 180); // Cap at full available height
  };

  // Calculate center of all cities
  const getCityCenter = () => {
    const cityCoords = allCities
      .filter(c => c.lat && c.lon)
      .map(c => ({ lat: c.lat, lon: c.lon }));

    if (cityCoords.length === 0) {
      return { lat: 0, lon: 0 };
    }

    const lats = cityCoords.map(c => c.lat);
    const lons = cityCoords.map(c => c.lon);

    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lon: (Math.min(...lons) + Math.max(...lons)) / 2,
    };
  };

  const scale = calculateOptimalScale();
  const center = getCityCenter();

  // Convert lat/lon to SVG coordinates using city center as reference
  const cityLatLonToSVG = (lat, lon) => {
    // Calculate offset from center in degrees
    const latDiff = center.lat - lat;
    const lonDiff = lon - center.lon;

    // Calculate the visual center accounting for the tray at bottom
    const trayWidth = 0;
    const trayHeight = 192;
    const visualCenterX = (width - trayWidth) / 2;
    const visualCenterY = (height - trayHeight) / 2;

    // Apply scale (pixels per degree) and center in available space
    return {
      x: visualCenterX + (lonDiff * scale),
      y: visualCenterY + (latDiff * scale),
    };
  };

  // Convert current city to SVG coordinates
  const currentPoint = currentCity?.lat && currentCity?.lon
    ? cityLatLonToSVG(currentCity.lat, currentCity.lon)
    : null;

  // Convert destinations to SVG coordinates
  const destinationPoints = destinations.map(dest => ({
    cityId: dest.cityId,
    point: cityLatLonToSVG(dest.lat, dest.lon),
  }));

  // Calculate transform for world map to align with centered cities
  // The world map uses equirectangular projection (800x400 = 360°x180°)
  // We need to scale and translate it to match the new centered coordinate system
  const worldMapTransform = (() => {
    // Calculate the visual center accounting for the tray at bottom
    const trayWidth = 0;
    const trayHeight = 192;
    const visualCenterX = (width - trayWidth) / 2;
    const visualCenterY = (height - trayHeight) / 2;

    // Scale: convert from pixels-per-360-degrees to pixels-per-degree
    const scaleX = scale * (360 / width);
    const scaleY = scale * (180 / height);

    // Translation: align the world map's coordinate system with the centered view
    // In old system: (0,0) = lon:-180, lat:90
    const translateX = visualCenterX - scale * (180 + center.lon);
    const translateY = visualCenterY + scale * (center.lat - 90);

    return `translate(${translateX}, ${translateY}) scale(${scaleX}, ${scaleY})`;
  })();

  return (
    <div className="relative h-[600px]">
      {/* World Map Background */}
      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          style={{ maxHeight: '500px' }}
        >
          {/* Background gradient */}
          <defs>
            <linearGradient id="worldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="1" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
            </linearGradient>

            {/* Grid pattern */}
            <pattern
              id="worldGrid"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(100, 116, 139, 0.05)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          {/* Background */}
          <rect x="0" y="0" width={width} height={height} fill="url(#worldGradient)" />
          <rect x="0" y="0" width={width} height={height} fill="url(#worldGrid)" />

          {/* World map outlines - transformed to align with centered cities */}
          <g transform={worldMapTransform}>
            <WorldMapOutlines />
          </g>

          {/* Flight paths from current city to each destination */}
          {currentPoint && destinationPoints.map(dest => {
            const destination = destinations.find(d => d.cityId === dest.cityId);
            const isHovered = hoveredCity === dest.cityId;
            const controlPoint = getFlightArcControlPoint(currentPoint, dest.point);
            const pathD = `M ${currentPoint.x} ${currentPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${dest.point.x} ${dest.point.y}`;

            return (
              <path
                key={`path-${dest.cityId}`}
                d={pathD}
                fill="none"
                stroke={isHovered ? 'rgba(100, 150, 255, 0.5)' : 'rgba(100, 150, 255, 0.15)'}
                strokeWidth={isHovered ? '2' : '1.5'}
                strokeDasharray={isHovered ? 'none' : '4 4'}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Destination markers */}
          {destinations.map((dest, index) => {
            const destPoint = destinationPoints[index].point;
            return (
              <MapMarker
                key={dest.cityId}
                x={destPoint.x}
                y={destPoint.y}
                label={dest.name}
                variant="destination"
                pulsing={canTravel}
                isHovered={hoveredCity === dest.cityId}
                disabled={!canTravel}
                onClick={() => canTravel && onTravel(dest)}
                onHover={(hovered) => setHoveredCity(hovered ? dest.cityId : null)}
              />
            );
          })}

          {/* Current city marker (on top) */}
          {currentPoint && (
            <MapMarker
              x={currentPoint.x}
              y={currentPoint.y}
              label={currentCity.name}
              variant="current"
              disabled={true}
            />
          )}
        </svg>
      </div>

      {/* Option Tray - Horizontal at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 p-4 bg-gray-900/90 backdrop-blur-sm">
        <OptionTray orientation="horizontal">
          {destinations.map(dest => (
            <div key={dest.cityId} className="snap-start">
              <OptionCard
                icon={dest.icon || '🌍'}
                title={dest.name}
                subtitle={dest.country}
                duration={travelTime}
                transfers={0}
                disabled={!canTravel}
                selected={hoveredCity === dest.cityId}
                onClick={() => canTravel && onTravel(dest)}
                variant="travel"
              />
            </div>
          ))}
        </OptionTray>
      </div>
    </div>
  );
}

export default AirportTab;
