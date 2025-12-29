/**
 * Scrollable tray container for OptionCard components
 * Supports both horizontal and vertical orientation
 */
export function OptionTray({
  children,
  orientation = 'horizontal',
  className = '',
}) {
  const baseStyles = 'flex gap-3 scroll-smooth';

  const orientationStyles = orientation === 'horizontal'
    ? 'flex-row overflow-x-auto pb-2 snap-x snap-mandatory'
    : 'flex-col overflow-y-auto pr-2 snap-y snap-mandatory';

  // Custom scrollbar styling
  const scrollbarStyles = `
    scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50
    hover:scrollbar-thumb-yellow-500
  `;

  return (
    <div
      className={`${baseStyles} ${orientationStyles} ${scrollbarStyles} ${className}`}
      style={{
        // Snap scroll for smooth card alignment
        scrollSnapType: orientation === 'horizontal' ? 'x mandatory' : 'y mandatory',
      }}
    >
      {children}
    </div>
  );
}

export default OptionTray;
