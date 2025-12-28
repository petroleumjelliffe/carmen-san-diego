import { Plane, Clock, MapPin } from 'lucide-react';

// Compact destination card for 2x2 grid
function FlightCard({ destination, travelTime, disabled, onSelect }) {
  return (
    <button
      onClick={() => onSelect(destination)}
      disabled={disabled}
      className={`w-full text-left transition-all rounded-lg overflow-hidden ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-700'
          : 'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] bg-gradient-to-br from-blue-800 to-blue-900'
      }`}
    >
      <div className="p-3">
        <div className="text-white font-bold text-sm truncate">{destination.name}</div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-blue-200 text-xs truncate">
            <MapPin size={10} />
            <span>{destination.country}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-300 text-xs">
            <Clock size={10} />
            <span>{travelTime}h</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function AirportTab({ destinations, timeRemaining, travelTime, onTravel }) {
  const canTravel = timeRemaining >= travelTime;

  return (
    <div className="flex flex-col min-h-full">
      {/* Flexible space above pushes content to bottom */}
      <div className="flex-1" />

      {/* Bottom-anchored content */}
      <div className="space-y-3">
        {/* Departure Board Header */}
        <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Plane className="text-yellow-400" size={20} />
              <h2 className="text-lg font-bold text-yellow-400 font-mono">DEPARTURES</h2>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-mono ${
              canTravel ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
            }`}>
              {canTravel ? 'BOARDING' : 'DELAYED'}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock size={12} />
            <span>Travel time: <span className="text-yellow-300 font-mono">{travelTime}h</span> per flight</span>
          </div>
        </div>

        {/* Flight Cards - 2x2 grid */}
        <div className="grid grid-cols-2 gap-2">
          {destinations.map(dest => (
            <FlightCard
              key={dest.cityId}
              destination={dest}
              travelTime={travelTime}
              disabled={!canTravel}
              onSelect={onTravel}
            />
          ))}
        </div>

        {!canTravel && (
          <div className="text-center text-red-400 text-sm p-3 bg-red-900/30 rounded-lg">
            Not enough time to travel! Need at least {travelTime} hours.
          </div>
        )}
      </div>
    </div>
  );
}

export default AirportTab;
