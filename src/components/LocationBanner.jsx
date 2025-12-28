import { MapPin } from 'lucide-react';

// Progress dots - visual indicator without revealing exact city count
function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full transition-all ${
            i < current
              ? 'bg-green-500'
              : i === current
              ? 'bg-yellow-400'
              : 'bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export function LocationBanner({ currentCity, currentCityIndex, wrongCity, wrongCityData, citiesPerCase }) {
  return (
    <div className="bg-red-800 py-3">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-3">
        <MapPin className="text-yellow-400" />
        <span className="text-yellow-100 text-lg">
          {wrongCity && wrongCityData
            ? `${wrongCityData.name}, ${wrongCityData.country}`
            : `${currentCity?.name}, ${currentCity?.country}`}
        </span>
        <span className="ml-auto">
          {wrongCity ? (
            <span className="text-red-400 text-sm font-bold">WRONG TRAIL</span>
          ) : (
            <ProgressDots current={currentCityIndex} total={citiesPerCase} />
          )}
        </span>
      </div>
    </div>
  );
}

export default LocationBanner;
