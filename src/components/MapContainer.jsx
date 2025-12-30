import { useEffect, useRef, useState } from 'react';

/**
 * Shared container component for all map displays
 * Provides consistent sizing, rounded corners, and background styling
 */
export function MapContainer({
  children,
  backgroundImage = null,
  className = ''
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Measure container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: clientHeight || 500,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}
      style={{ maxHeight: '600px' }}
    >
      {/* Background image or gradient */}
      {backgroundImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
      )}

      {/* Content */}
      {typeof children === 'function' ? children(dimensions) : children}
    </div>
  );
}

export default MapContainer;
