import { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, Moon } from 'lucide-react';

// Format hour as 12-hour time with AM/PM
function formatTime(hour) {
  const h = ((hour % 24) + 24) % 24; // Normalize to 0-23
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:00 ${ampm}`;
}

// Animated clock that ticks toward target hour
function AnimatedClock({ targetHour, tickSpeed = 0.5, onAnimatingChange }) {
  const [displayHour, setDisplayHour] = useState(targetHour);
  const isAnimating = displayHour !== targetHour;

  useEffect(() => {
    // Notify parent of animation state changes
    onAnimatingChange?.(isAnimating);
  }, [isAnimating, onAnimatingChange]);

  useEffect(() => {
    if (displayHour === targetHour) {
      return;
    }

    const timer = setTimeout(() => {
      setDisplayHour(prev => (prev + 1) % 24);
    }, tickSpeed * 1000);

    return () => clearTimeout(timer);
  }, [displayHour, targetHour, tickSpeed]);

  return (
    <span className={isAnimating ? 'text-yellow-300' : ''}>
      {formatTime(displayHour)}
    </span>
  );
}

// Urgency bar - abstract progress indicator
function UrgencyBar({ timeRemaining, maxTime = 72 }) {
  const percent = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));

  const getColor = () => {
    if (timeRemaining <= 12) return 'bg-red-500';
    if (timeRemaining <= 24) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-16 sm:w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-500 ${getColor()}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// Sleeping pill overlay - shows only while clock is animating through sleep
function SleepingPill({ show }) {
  if (!show) return null;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
      <div className="bg-blue-900 border border-blue-400 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg animate-pulse">
        <Moon size={16} className="text-blue-300" />
        <span className="text-blue-100 font-bold text-sm">SLEEPING</span>
      </div>
    </div>
  );
}

export function Header({
  currentCity,
  wrongCity,
  wrongCityData,
  timeRemaining,
  currentHour,
  maxTime = 72,
  timeTickSpeed = 0.5,
  lastSleepResult,
}) {
  const [isClockAnimating, setIsClockAnimating] = useState(false);

  // Determine location to display
  const locationName = wrongCity && wrongCityData
    ? `${wrongCityData.name}, ${wrongCityData.country}`
    : currentCity
    ? `${currentCity.name}, ${currentCity.country}`
    : 'Unknown Location';

  return (
    <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-yellow-400/50">
      <div className="max-w-6xl mx-auto px-4 py-2 relative">
        {/* Single row layout - never wrap */}
        <div className="flex justify-between items-center gap-2">
          {/* Location - can truncate */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MapPin size={18} className="text-yellow-400 flex-shrink-0" />
            <span className="text-yellow-100 font-medium truncate">
              {locationName}
            </span>
            {wrongCity && (
              <span className="text-red-400 text-xs font-bold flex-shrink-0">WRONG</span>
            )}
          </div>

          {/* Time + Urgency - never wrap or shrink */}
          <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
            <div className="flex items-center gap-1 text-yellow-100 font-mono text-sm">
              <Clock size={14} className="text-yellow-400" />
              <AnimatedClock
                targetHour={currentHour}
                tickSpeed={timeTickSpeed}
                onAnimatingChange={setIsClockAnimating}
              />
            </div>
            <UrgencyBar timeRemaining={timeRemaining} maxTime={maxTime} />
          </div>
        </div>

        {/* Sleeping pill - only shows while clock is animating through sleep hours */}
        <SleepingPill show={isClockAnimating && !!lastSleepResult} />
      </div>
    </div>
  );
}

export default Header;
