import { MapPin } from 'lucide-react';

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
        {wrongCity ? (
          <span className="ml-auto text-red-400 text-sm font-bold">
            WRONG TRAIL
          </span>
        ) : (
          <span className="ml-auto text-yellow-200/50 text-sm">
            Stop {currentCityIndex + 1} of {citiesPerCase}
          </span>
        )}
      </div>
    </div>
  );
}

export default LocationBanner;
