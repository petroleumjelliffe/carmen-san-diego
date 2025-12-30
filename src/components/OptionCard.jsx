import { Clock } from 'lucide-react';

/**
 * Reusable card component for travel destinations and investigation spots
 * Displays icon, title, subtitle, duration with consistent styling
 */
export function OptionCard({
  icon,
  title,
  subtitle,
  duration,
  transfers = 0,
  disabled = false,
  selected = false,
  onClick,
  variant = 'travel',
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-lg
        transition-all duration-200
        ${disabled
          ? 'bg-gray-800/50 opacity-50 cursor-not-allowed grayscale'
          : selected
            ? 'bg-gray-800/90 border-2 border-green-500 shadow-lg shadow-green-500/20'
            : 'bg-gray-800/90 border-2 border-gray-700 hover:border-yellow-500 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20 cursor-pointer'
        }
        backdrop-blur-sm
        min-w-[180px] w-[180px]
      `}
    >
      {/* Icon/Emoji */}
      <div className="text-5xl leading-none">
        {icon}
      </div>

      {/* Title */}
      <div className="text-yellow-100 font-bold text-center text-sm leading-tight">
        {title}
      </div>

      {/* Subtitle */}
      <div className="text-gray-400 text-xs text-center leading-tight">
        {subtitle}
      </div>

      {/* Duration + Transfers */}
      <div className="flex items-center gap-1 text-yellow-200/70 text-xs">
        <Clock size={12} />
        <span>
          {duration}h
          {transfers > 0 && <> • {transfers} {transfers === 1 ? 'stop' : 'stops'}</>}
        </span>
      </div>
    </button>
  );
}

export default OptionCard;
