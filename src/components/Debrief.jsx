import { GameLayout } from './GameLayout';

/**
 * Debrief - Shows case stats and promotion after trial
 */
export function Debrief({
  isWon,
  currentCase,
  timeRemaining,
  solvedCases,
  ranks,
  onNewCase,
  onReturnToMenu,
}) {
  // Get current rank
  const currentRank = ranks.find(
    (rank) => solvedCases >= rank.cases_required && (ranks[ranks.indexOf(rank) + 1]
      ? solvedCases < ranks[ranks.indexOf(rank) + 1].cases_required
      : true)
  ) || ranks[0];

  return (
    <GameLayout
      bottomPanel={
        <div className="flex gap-3">
          <button
            onClick={onNewCase}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded text-lg transition-colors"
          >
            NEW CASE
          </button>
          <button
            onClick={onReturnToMenu}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded text-lg transition-colors"
          >
            MAIN MENU
          </button>
        </div>
      }
    >
      <div className="bg-black bg-opacity-70 rounded-lg p-8 text-white max-w-2xl mx-auto">
        <div className="text-6xl mb-6 text-center">
          {isWon ? '✅' : '❌'}
        </div>

        <h1 className={`text-3xl font-bold mb-6 text-center ${isWon ? 'text-green-400' : 'text-red-400'}`}>
          {isWon ? 'CASE CLOSED' : 'CASE FAILED'}
        </h1>

        {isWon ? (
          <p className="text-xl text-center mb-6">Excellent work, Detective!</p>
        ) : (
          <p className="text-xl text-center mb-6">The suspect escaped justice.</p>
        )}

        {/* Case Stats */}
        <div className="space-y-3 mb-6 p-4 bg-gray-900 bg-opacity-50 rounded">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">CASE STATS:</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Time remaining:</div>
            <div className="text-right font-bold">{timeRemaining} hours</div>

            <div>Cities visited:</div>
            <div className="text-right font-bold">{currentCase?.cities.length || 0}</div>

            <div>Good deeds:</div>
            <div className="text-right font-bold">0 ❤️</div>

            <div>Rogue actions:</div>
            <div className="text-right font-bold">0 🔥</div>
          </div>
        </div>

        {/* Promotion */}
        {isWon && (
          <div className="p-4 bg-green-900 bg-opacity-30 rounded border border-green-400 mb-6">
            <p className="text-2xl font-bold text-green-300 text-center">PROMOTION!</p>
            <p className="text-xl text-center mt-2">
              {currentRank.previous_title || 'Rookie'} → {currentRank.name}
            </p>
          </div>
        )}

        {/* Career Stats */}
        <div className="space-y-2 p-4 bg-gray-900 bg-opacity-50 rounded">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">CAREER STATS:</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Cases solved:</div>
            <div className="text-right font-bold">{solvedCases}</div>

            <div>Rank:</div>
            <div className="text-right font-bold">{currentRank.name}</div>

            <div>NPCs helped (total):</div>
            <div className="text-right font-bold">0</div>

            <div>Karma:</div>
            <div className="text-right font-bold">☆☆☆ (Clean Record)</div>

            <div>Notoriety:</div>
            <div className="text-right font-bold">☆☆☆ (Clean Record)</div>

            <div>Permanent injuries:</div>
            <div className="text-right font-bold">None</div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
