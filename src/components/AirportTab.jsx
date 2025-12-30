import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { OptionCard } from './OptionCard';
import { OptionTray } from './OptionTray';
import { useIsDesktop } from '../hooks/useMediaQuery';

/**
 * Component to calculate curved flight path between two lat/lon points
 */
function FlightPath({ from, to, isHovered, color }) {
  const map = useMap();

  // Generate curved path using intermediate points
  const pathPositions = useMemo(() => {
    // Calculate midpoint
    const midLat = (from[0] + to[0]) / 2;
    const midLon = (from[1] + to[1]) / 2;

    // Calculate perpendicular offset for curve
    const latDiff = to[0] - from[0];
    const lonDiff = to[1] - from[1];
    const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

    // Curve control point (perpendicular to direct path)
    const curveHeight = distance * 0.15; // 15% curve
    const perpLat = -lonDiff / distance * curveHeight;
    const perpLon = latDiff / distance * curveHeight;

    const controlLat = midLat + perpLat;
    const controlLon = midLon + perpLon;

    // Generate points along bezier curve
    const points = [];
    for (let t = 0; t <= 1; t += 0.05) {
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;

      // Quadratic bezier formula
      const lat = mt2 * from[0] + 2 * mt * t * controlLat + t2 * to[0];
      const lon = mt2 * from[1] + 2 * mt * t * controlLon + t2 * to[1];

      points.push([lat, lon]);
    }

    return points;
  }, [from, to]);

  return (
    <Polyline
      positions={pathPositions}
      pathOptions={{
        color: color || (isHovered ? 'rgba(100, 150, 255, 0.5)' : 'rgba(100, 150, 255, 0.15)'),
        weight: isHovered ? 2 : 1.5,
        opacity: 1,
        dashArray: isHovered ? undefined : '4, 4',
      }}
    />
  );
}

/**
 * SVG overlay for city labels
 */
function CityLabels({ cities, currentCity }) {
  const map = useMap();
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const updatePositions = () => {
      const cityPositions = cities.map(city => {
        const point = map.latLngToContainerPoint([city.lat, city.lon]);
        return { ...city, x: point.x, y: point.y };
      });

      if (currentCity) {
        const currentPoint = map.latLngToContainerPoint([currentCity.lat, currentCity.lon]);
        cityPositions.push({ ...currentCity, x: currentPoint.x, y: currentPoint.y, isCurrent: true });
      }

      setPositions(cityPositions);
    };

    updatePositions();
    map.on('move', updatePositions);
    map.on('zoom', updatePositions);

    return () => {
      map.off('move', updatePositions);
      map.off('zoom', updatePositions);
    };
  }, [cities, currentCity, map]);

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
      {positions.map((city, index) => (
        <text
          key={city.cityId || city.id || index}
          x={city.x}
          y={city.y - 12}
          textAnchor="middle"
          fill={city.isCurrent ? '#22c55e' : '#3b82f6'}
          fontSize="20"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {city.name.toUpperCase()}
        </text>
      ))}
    </svg>
  );
}

export function AirportTab({ destinations, timeRemaining, travelTime, onTravel, currentCity }) {
  const [hoveredCity, setHoveredCity] = useState(null);
  const isDesktop = useIsDesktop();
  const canTravel = timeRemaining >= travelTime;

  // Calculate bounds to fit all cities
  const mapBounds = useMemo(() => {
    if (!currentCity || destinations.length === 0) {
      return [[-60, -180], [75, 180]]; // Default world view
    }

    const allCities = [currentCity, ...destinations];
    const lats = allCities.map(c => c.lat);
    const lons = allCities.map(c => c.lon);

    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)]
    ];
  }, [currentCity, destinations]);

  return (
    <div className="relative h-[600px]">
      {/* Leaflet Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          bounds={mapBounds}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
          minZoom={2}
          maxZoom={6}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
          touchZoom={true}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={false}
          boundsOptions={{ padding: [60, 60] }}
        >
          {/* Dark mode map tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains='abcd'
            maxZoom={19}
          />

          {/* Flight paths */}
          {currentCity && destinations.map(dest => (
            <FlightPath
              key={`path-${dest.cityId}`}
              from={[currentCity.lat, currentCity.lon]}
              to={[dest.lat, dest.lon]}
              isHovered={hoveredCity === dest.cityId}
            />
          ))}

          {/* Destination markers - simple circles */}
          {destinations.map(dest => (
            <CircleMarker
              key={dest.cityId}
              center={[dest.lat, dest.lon]}
              radius={6}
              pathOptions={{
                fillColor: '#3b82f6',
                fillOpacity: 0.9,
                color: 'white',
                weight: 2,
              }}
              eventHandlers={{
                click: () => canTravel && onTravel(dest),
                mouseover: () => setHoveredCity(dest.cityId),
                mouseout: () => setHoveredCity(null),
              }}
            />
          ))}

          {/* Current city marker - green circle */}
          {currentCity && (
            <CircleMarker
              center={[currentCity.lat, currentCity.lon]}
              radius={6}
              pathOptions={{
                fillColor: '#22c55e',
                fillOpacity: 0.9,
                color: 'white',
                weight: 2,
              }}
            />
          )}

          {/* City labels overlay */}
          <CityLabels cities={destinations} currentCity={currentCity} />
        </MapContainer>
      </div>

      {/* Option Tray - Horizontal at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 p-4 bg-gray-900/90 backdrop-blur-sm z-30">
        <OptionTray orientation="horizontal">
          {destinations.map(dest => (
            <div
              key={dest.cityId}
              className="snap-start"
              onMouseEnter={() => setHoveredCity(dest.cityId)}
              onMouseLeave={() => setHoveredCity(null)}
            >
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
