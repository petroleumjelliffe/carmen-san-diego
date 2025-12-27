import { GameLayout } from './GameLayout';
import { TopPanel } from './TopPanel';

/**
 * Sleep - Shows nightfall screen when time reaches 11pm
 */
export function Sleep({ currentCity, timeRemaining, onSleep }) {
  const locationName = currentCity ? `${currentCity.name}, ${currentCity.country}` : 'Unknown';

  return (
    <GameLayout
      topPanel={<TopPanel location={locationName} timeRemaining={timeRemaining} />}
      bottomPanel={
        <button
          onClick={onSleep}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded text-lg transition-colors"
        >
          SLEEP (Advance to 6 AM, -7 hours)
        </button>
      }
    >
      <div className="bg-black bg-opacity-70 rounded-lg p-8 text-white max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-6">💤</div>

        <h1 className="text-3xl font-bold text-blue-300 mb-4">
          NIGHTFALL
        </h1>

        <p className="text-xl mb-6">
          It's 11 PM. Time to rest.
        </p>

        <p className="text-gray-300 text-lg">
          You'll wake up at 6 AM tomorrow.
          <br />
          <span className="text-yellow-400 font-bold">Time cost: 7 hours</span>
        </p>

        <div className="mt-8 p-4 bg-blue-900 bg-opacity-50 rounded border border-blue-400">
          <p className="text-sm text-blue-200">
            "The hunt continues tomorrow, detective. Rest while you can."
          </p>
        </div>
      </div>
    </GameLayout>
  );
}
