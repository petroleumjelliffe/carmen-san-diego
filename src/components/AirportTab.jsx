import { Plane } from 'lucide-react';

export function AirportTab({ destinations, timeRemaining, travelTime, onTravel }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">
        {String.fromCodePoint(0x2708, 0xFE0F)} Select Destination (Travel time: {travelTime}h)
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {destinations.map(dest => (
          <button
            key={dest.cityId}
            onClick={() => onTravel(dest)}
            disabled={timeRemaining < travelTime}
            className="bg-red-800 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-yellow-100 p-4 rounded-lg transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <Plane size={16} />
              <span className="font-bold">{dest.name}</span>
            </div>
            <div className="text-yellow-200/70 text-sm">{dest.country}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AirportTab;
