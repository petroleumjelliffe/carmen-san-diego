/**
 * Home tab - shows city background with fact quote
 * Provides a clean view of the city without UI overlays
 */
export function HomeTab({ currentCity, cityFact }) {
  return (
    <div className="relative h-[600px] flex items-center justify-center">
      {/* City Fact Quote - centered */}
      {cityFact && (
        <div className="max-w-2xl mx-auto bg-gray-900/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-2xl">
          <div className="p-8 border-l-4 border-blue-400">
            <p className="text-yellow-100 italic text-lg leading-relaxed">
              "{cityFact}"
            </p>
            {currentCity && (
              <p className="text-blue-400 text-sm mt-4 text-right font-medium">
                — {currentCity.name}, {currentCity.country}
              </p>
            )}
          </div>
        </div>
      )}

      {/* If no fact, just show city name */}
      {!cityFact && currentCity && (
        <div className="max-w-2xl mx-auto bg-gray-900/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-2xl">
          <div className="p-8 text-center">
            <h2 className="text-4xl font-bold text-yellow-400 mb-2">
              {currentCity.name}
            </h2>
            <p className="text-blue-400 text-xl">
              {currentCity.country}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeTab;
