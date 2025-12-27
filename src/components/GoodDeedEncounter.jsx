import { Heart, X, AlertTriangle, Clock } from 'lucide-react';
import { GameLayout } from './GameLayout';

/**
 * GoodDeedEncounter - Full-screen encounter for good deed opportunities or fake traps
 * Replaces main content area (not a modal overlay)
 */
export function GoodDeedEncounter({ goodDeed, karma, timeRemaining, onChoice }) {
  if (!goodDeed) return null;

  const showParanoia = karma >= 1 && !goodDeed.isFake; // Show paranoia after first trap/deed
  const timeCost = goodDeed.time_cost || goodDeed.timeCost || 3;
  const canAfford = timeRemaining >= timeCost;

  return (
    <GameLayout
      bottomPanel={
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChoice(true)}
            disabled={!canAfford}
            className={`font-bold py-3 px-6 rounded text-lg transition-all flex flex-col items-center gap-2 ${
              canAfford
                ? 'bg-green-700 hover:bg-green-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Heart size={24} />
            <span>HELP</span>
            <span className="text-xs opacity-70">
              {canAfford ? `Costs ${timeCost}h, +1 karma` : 'Not enough time'}
            </span>
          </button>

          <button
            onClick={() => onChoice(false)}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded text-lg transition-all flex flex-col items-center gap-2"
          >
            <X size={24} />
            <span>KEEP MOVING</span>
            <span className="text-xs opacity-70">No time to spare</span>
          </button>
        </div>
      }
    >
      <div className="bg-black bg-opacity-70 rounded-lg p-8 text-white max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {goodDeed.isFake ? (
            <AlertTriangle size={48} className="text-red-400" />
          ) : (
            <Heart size={48} className="text-yellow-400" />
          )}
          <h1 className="text-3xl font-bold text-yellow-400">
            {goodDeed.isFake ? 'URGENT SITUATION' : 'GOOD DEED OPPORTUNITY'}
          </h1>
        </div>

        {/* Scene Description */}
        <div className="bg-red-950/50 p-6 rounded-lg mb-4 border border-yellow-400/30">
          <p className="text-yellow-100 text-xl mb-4 leading-relaxed">
            {goodDeed.description}
          </p>
          {goodDeed.plea && (
            <div className="border-l-4 border-yellow-500 pl-4 py-2 bg-black/30">
              <p className="text-yellow-300 italic text-lg">
                "{goodDeed.plea}"
              </p>
            </div>
          )}
        </div>

        {/* Paranoia Warning */}
        {showParanoia && (
          <div className="bg-red-800/50 border-2 border-red-400 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-300" />
              <div>
                <p className="text-red-200 font-bold mb-1">
                  Something feels off...
                </p>
                <p className="text-red-300 text-sm">
                  Is this one real? Or another trap? You can't tell anymore.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-900/50 border border-blue-400 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-300 mb-1">
              <Clock size={16} />
              <span className="text-sm font-bold">TIME COST</span>
            </div>
            <p className="text-blue-100 text-2xl font-mono">~{timeCost}h</p>
          </div>

          <div className="bg-purple-900/50 border border-purple-400 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-purple-300 mb-1">
              <Heart size={16} />
              <span className="text-sm font-bold">CURRENT KARMA</span>
            </div>
            <p className="text-purple-100 text-2xl">
              {'⭐'.repeat(Math.min(karma, 5))}{'☆'.repeat(Math.max(0, 5 - karma))}
            </p>
          </div>
        </div>

        {/* High Karma Warning */}
        {karma >= 5 && (
          <div className="bg-orange-900/50 border border-orange-400 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-orange-300">
              <AlertTriangle size={16} />
              <span className="text-sm font-bold">
                ⚠️ HIGH KARMA RISK: The syndicate knows your patterns. 25% chance this is a trap!
              </span>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}

export default GoodDeedEncounter;
