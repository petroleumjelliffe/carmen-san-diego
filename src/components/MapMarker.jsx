/**
 * Generalized map marker component for SVG maps
 * Used for both world map (cities) and city map (investigation spots)
 */
export function MapMarker({
  x,
  y,
  label,
  icon,
  variant = 'destination',
  pulsing = false,
  isHovered = false,
  disabled = false,
  onClick,
  onHover,
}) {
  // Variant-based styling
  const variants = {
    current: {
      size: 10,
      color: '#22c55e',      // green-500
      glowColor: 'rgba(34, 197, 94, 0.3)',
      textColor: '#22c55e',
    },
    destination: {
      size: 8,
      color: '#3b82f6',      // blue-500
      glowColor: 'rgba(59, 130, 246, 0.3)',
      textColor: '#60a5fa',  // blue-400
    },
    disabled: {
      size: 6,
      color: '#6b7280',      // gray-500
      glowColor: 'rgba(107, 114, 128, 0.3)',
      textColor: '#6b7280',
    },
  };

  const style = disabled ? variants.disabled : variants[variant];
  const baseSize = style.size;
  const hoverSize = baseSize + 4;
  const size = isHovered ? hoverSize : baseSize;

  const isInteractive = !disabled && variant !== 'current';

  return (
    <g
      className={disabled ? 'cursor-not-allowed' : isInteractive ? 'cursor-pointer' : ''}
      onClick={() => isInteractive && onClick?.()}
      onMouseEnter={() => isInteractive && onHover?.(true)}
      onMouseLeave={() => isInteractive && onHover?.(false)}
    >
      {/* Pulse ring for current/pulsing */}
      {(variant === 'current' || pulsing) && !disabled && (
        <circle
          cx={x}
          cy={y}
          r="18"
          fill="none"
          stroke={style.color}
          strokeWidth="2"
          opacity="0.4"
          className="animate-ping"
          style={{ animationDuration: '2s' }}
        />
      )}

      {/* Hover highlight ring */}
      {isHovered && isInteractive && (
        <circle
          cx={x}
          cy={y}
          r={size + 6}
          fill="rgba(59, 130, 246, 0.2)"
        />
      )}

      {/* Outer glow */}
      <circle
        cx={x}
        cy={y}
        r={size + 2}
        fill={style.glowColor}
      />

      {/* Main dot */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={style.color}
        className={isInteractive ? 'transition-all duration-150' : ''}
      />

      {/* Inner highlight */}
      <circle
        cx={x}
        cy={y}
        r={size * 0.4}
        fill="white"
        opacity={variant === 'current' ? 1 : 0.8}
      />

      {/* Label */}
      {label && (
        <text
          x={x}
          y={y - size - 8}
          textAnchor="middle"
          fill={style.textColor}
          fontSize="10"
          fontWeight="bold"
          fontFamily="monospace"
          className="pointer-events-none select-none"
        >
          {label.toUpperCase()}
        </text>
      )}

      {/* Icon (if provided) - positioned above label */}
      {icon && (
        <text
          x={x}
          y={y - size - 24}
          textAnchor="middle"
          fontSize="16"
          className="pointer-events-none select-none"
        >
          {icon}
        </text>
      )}
    </g>
  );
}

export default MapMarker;
