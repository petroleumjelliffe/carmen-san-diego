import { Heart, X, AlertTriangle } from 'lucide-react';

/**
 * GoodDeedModal - Shows good deed opportunity or fake good deed trap
 */
export function GoodDeedModal({ goodDeed, karma, onChoice }) {
  if (!goodDeed) return null;

  const showParanoia = karma >= 1 && !goodDeed.isFake; // Show paranoia after first trap

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-red-900 border-4 border-yellow-400 rounded-lg max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {goodDeed.isFake ? (
            <AlertTriangle size={32} className="text-red-400" />
          ) : (
            <Heart size={32} className="text-yellow-400" />
          )}
          <h2 className="text-2xl font-bold text-yellow-400">
            {goodDeed.isFake ? '❗ URGENT SITUATION' : '💡 GOOD DEED OPPORTUNITY'}
          </h2>
        </div>

        {/* Description */}
        <div className="bg-black bg-opacity-40 p-4 rounded mb-4">
          <p className="text-yellow-100 text-lg mb-3">
            {goodDeed.description}
          </p>
          {goodDeed.plea && (
            <p className="text-yellow-300 italic border-l-4 border-yellow-500 pl-3">
              "{goodDeed.plea}"
            </p>
          )}
        </div>

        {/* Paranoia warning */}
        {showParanoia && (
          <div className="bg-red-800/50 border border-red-400 p-3 rounded mb-4">
            <p className="text-red-200 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>Is this one real? Or another trap? You can't tell...</span>
            </p>
          </div>
        )}

        {/* Time cost info */}
        <div className="flex items-center justify-between mb-6 text-yellow-200 text-sm">
          <span>Time cost: ~{goodDeed.time_cost || 3} hours</span>
          {karma >= 5 && (
            <span className="text-red-300">⚠️ High karma - trap risk!</span>
          )}
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onChoice(true)}
            className="bg-green-700 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition-all flex flex-col items-center gap-2"
          >
            <Heart size={24} />
            <span>HELP</span>
            <span className="text-xs opacity-70">Do the right thing</span>
          </button>

          <button
            onClick={() => onChoice(false)}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all flex flex-col items-center gap-2"
          >
            <X size={24} />
            <span>KEEP MOVING</span>
            <span className="text-xs opacity-70">No time to spare</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoodDeedModal;
