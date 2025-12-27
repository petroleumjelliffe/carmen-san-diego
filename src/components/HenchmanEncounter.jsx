import { Clock, Zap } from 'lucide-react';
import { GameLayout } from './GameLayout';

/**
 * HenchmanEncounter - "You're on the right track" encounter after investigation
 * Shows gadget puzzle without timer (mid-game)
 */
export function HenchmanEncounter({
  encounter,
  availableGadgets,
  timeRemaining,
  onGadgetChoice
}) {
  if (!encounter) return null;

  const wrongPenalty = encounter.time_penalty_wrong || 4;
  const noPenalty = encounter.time_penalty_none || 6;

  return (
    <GameLayout
      bottomPanel={
        <div className="space-y-2">
          <p className="text-yellow-400 text-sm text-center mb-2">
            Choose your gadget wisely!
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Available Gadgets */}
            {availableGadgets.map((gadget) => {
              const isUsed = gadget.used;
              const canAfford = timeRemaining >= wrongPenalty;

              return (
                <button
                  key={gadget.id}
                  onClick={() => onGadgetChoice(gadget.id)}
                  disabled={isUsed || !canAfford}
                  className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 ${
                    isUsed
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : !canAfford
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer'
                  }`}
                >
                  <span className="text-2xl">{gadget.icon}</span>
                  <span className="font-bold text-sm">{gadget.name}</span>
                  {isUsed && <span className="text-xs">Already Used</span>}
                </button>
              );
            })}
          </div>

          {/* No Gadget Option */}
          <button
            onClick={() => onGadgetChoice(null)}
            disabled={timeRemaining < noPenalty}
            className={`w-full p-3 rounded-lg transition-all flex items-center justify-between ${
              timeRemaining < noPenalty
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-red-700 hover:bg-red-600 text-white cursor-pointer'
            }`}
          >
            <span>No Gadget - Try to Escape</span>
            <span className="flex items-center gap-1 text-sm">
              <Clock size={14} />
              -{noPenalty}h
            </span>
          </button>
        </div>
      }
    >
      <div className="bg-black bg-opacity-70 rounded-lg p-8 text-white max-w-2xl mx-auto">
        {/* Encounter Title */}
        <div className="flex items-center gap-3 mb-4">
          <Zap size={32} className="text-orange-400" />
          <div>
            <h2 className="text-2xl font-bold text-orange-400">
              HENCHMAN ENCOUNTER
            </h2>
            <p className="text-green-400 text-sm">
              "You're on the right track..." - They're trying to stop you!
            </p>
          </div>
        </div>

        {/* Encounter Description */}
        <div className="bg-red-900 bg-opacity-50 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-3">
            {encounter.name}
          </h3>
          <p className="text-yellow-100 text-lg">
            {encounter.description}
          </p>
        </div>

        {/* Gadget Hint */}
        <div className="bg-blue-900 bg-opacity-40 p-4 rounded mb-4">
          <p className="text-blue-200 text-sm">
            💡 <span className="font-bold">Think carefully:</span> Which gadget would help you here? Using the correct gadget costs <span className="text-green-400 font-bold">NO time</span>!
          </p>
        </div>

        {/* Time Costs */}
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-green-900 bg-opacity-50 p-2 rounded">
            <p className="text-green-400 font-bold">Correct Gadget</p>
            <p className="text-white">0 hours</p>
          </div>
          <div className="bg-orange-900 bg-opacity-50 p-2 rounded">
            <p className="text-orange-400 font-bold">Wrong Gadget</p>
            <p className="text-white">-{wrongPenalty} hours</p>
          </div>
          <div className="bg-red-900 bg-opacity-50 p-2 rounded">
            <p className="text-red-400 font-bold">No Gadget</p>
            <p className="text-white">-{noPenalty} hours</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}

export default HenchmanEncounter;
