import { Plane, Clock, MapPin } from 'lucide-react';

// Boarding pass style destination card
function FlightCard({ destination, travelTime, disabled, onSelect }) {
  return (
    <button
      onClick={() => onSelect(destination)}
      disabled={disabled}
      className={`w-full text-left transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
      }`}
    >
      <div className="flex overflow-hidden rounded-lg shadow-md">
        {/* Left section - destination info */}
        <div className={`flex-1 p-4 ${disabled ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-800 to-blue-900'}`}>
          <div className="flex items-center gap-2 text-blue-200 text-xs mb-1">
            <Plane size={12} />
            <span>INTERPOL AIR</span>
          </div>
          <div className="text-white font-bold text-lg">{destination.name}</div>
          <div className="flex items-center gap-1 text-blue-200 text-sm">
            <MapPin size={12} />
            <span>{destination.country}</span>
          </div>
        </div>

        {/* Right section - flight details */}
        <div className={`w-20 p-3 flex flex-col items-center justify-center border-l-2 border-dashed ${
          disabled ? 'bg-gray-600 border-gray-500' : 'bg-blue-700 border-blue-500'
        }`}>
          <div className="text-blue-200 text-xs">FLIGHT</div>
          <div className="text-white font-mono font-bold text-sm">IP-{(destination.cityId?.charCodeAt(0) || 65) % 9 + 1}{(destination.cityId?.charCodeAt(1) || 66) % 10}{(destination.cityId?.charCodeAt(2) || 67) % 10}</div>
          <div className="flex items-center gap-1 text-yellow-300 text-xs mt-1">
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
    <div className="space-y-4">
      {/* Empty space to allow scrolling background into view */}
      <div className="h-24" aria-hidden="true" />

      {/* Departure Board Header */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Plane className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-yellow-400 font-mono">DEPARTURES</h2>
          </div>
          <div className={`px-3 py-1 rounded text-sm font-mono ${
            canTravel ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
          }`}>
            {canTravel ? 'BOARDING' : 'DELAYED'}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock size={14} />
          <span>Travel time: <span className="text-yellow-300 font-mono">{travelTime}h</span> per flight</span>
        </div>
      </div>

      {/* Flight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
  );
}

export default AirportTab;
