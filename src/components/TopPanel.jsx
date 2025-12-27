/**
 * TopPanel - Shows current location and time remaining
 */
export function TopPanel({ location, timeRemaining }) {
  const hoursWarning = timeRemaining <= 12;
  const hoursCritical = timeRemaining <= 6;

  return (
    <div className="flex justify-between items-center text-white">
      {/* Location */}
      <div className="flex items-center gap-2">
        <span className="text-xl">📍</span>
        <span className="font-bold">{location || 'Unknown'}</span>
      </div>

      {/* Time Remaining */}
      <div className="flex items-center gap-2">
        <span className="text-xl">⏰</span>
        <span
          className={`font-bold ${
            hoursCritical ? 'text-red-400 animate-pulse' :
            hoursWarning ? 'text-yellow-400' :
            'text-white'
          }`}
        >
          {timeRemaining}h
        </span>
      </div>
    </div>
  );
}
