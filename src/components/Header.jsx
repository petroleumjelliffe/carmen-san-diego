// Simplified header - no spoilers (time, rank, clock removed)
// Urgency bar - abstract progress indicator without spoiling exact time
function UrgencyBar({ timeRemaining, maxTime = 72 }) {
  const percent = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));

  // Color based on urgency level
  const getColor = () => {
    if (timeRemaining <= 12) return 'bg-red-500';
    if (timeRemaining <= 24) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-yellow-200/70 text-xs hidden sm:inline">Urgency</span>
      <div className="w-16 sm:w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function Header({ currentCase, timeRemaining, maxTime = 72 }) {
  return (
    <div className="bg-red-950 border-b-4 border-yellow-400 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Mobile layout: Single row */}
        <div className="sm:hidden flex justify-between items-center">
          <h1 className="text-lg font-bold text-yellow-400" style={{ fontFamily: 'serif' }}>
            SHADOW SYNDICATE
          </h1>
          <UrgencyBar timeRemaining={timeRemaining} maxTime={maxTime} />
        </div>

        {/* Desktop layout: Title + Case + Urgency */}
        <div className="hidden sm:flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'serif' }}>
              THE SHADOW SYNDICATE
            </h1>
            <div className="text-yellow-200/70 text-sm">
              {currentCase?.stolenItem?.name}
            </div>
          </div>
          <UrgencyBar timeRemaining={timeRemaining} maxTime={maxTime} />
        </div>
      </div>
    </div>
  );
}

export default Header;
