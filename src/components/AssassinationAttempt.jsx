import { useState, useEffect } from 'react';
import { Clock, Skull, AlertTriangle } from 'lucide-react';
import { GameLayout } from './GameLayout';

/**
 * AssassinationAttempt - FINAL CITY ONLY encounter with countdown timer
 * High-stakes gadget puzzle with slow-motion effects
 */
export function AssassinationAttempt({
  encounter,
  availableGadgets,
  timeRemaining,
  onGadgetChoice
}) {
  const [timeLeft, setTimeLeft] = useState(encounter?.timer_duration || 5);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!encounter || hasTimedOut) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setHasTimedOut(true);
          clearInterval(interval);
          // Auto-select "no gadget" when timer expires
          setTimeout(() => onGadgetChoice(null), 500);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [encounter, hasTimedOut, onGadgetChoice]);

  if (!encounter) return null;

  const wrongPenalty = encounter.time_penalty_wrong || 6;
  const noPenalty = encounter.time_penalty_none || 8;
  const timerDuration = encounter.timer_duration || 5;
  const timerPercent = (timeLeft / timerDuration) * 100;

  // Slow-motion visual effect - desaturate and add effects as timer runs down
  const urgencyClass = timeLeft < 2 ? 'animate-pulse' : '';
  const colorClass = timeLeft < 2 ? 'saturate-50' : timeLeft < 4 ? 'saturate-75' : '';

  return (
    <GameLayout
      bottomPanel={
        <div className="space-y-2">
          {/* Timer Progress Bar */}
          <div className="bg-gray-800 rounded-full h-6 overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-100 flex items-center justify-center ${
                timeLeft < 2 ? 'bg-red-600 animate-pulse' : timeLeft < 4 ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ width: `${timerPercent}%` }}
            >
              <span className="text-white font-bold text-sm">
                {timeLeft.toFixed(1)}s
              </span>
            </div>
          </div>

          <p className={`text-yellow-400 text-sm text-center mb-2 font-bold ${urgencyClass}`}>
            {hasTimedOut ? 'TIME\'S UP!' : 'ACT FAST!'}
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
                  disabled={isUsed || !canAfford || hasTimedOut}
                  className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 ${
                    isUsed
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : !canAfford || hasTimedOut
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer transform hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{gadget.icon}</span>
                  <span className="font-bold text-sm">{gadget.name}</span>
                  {isUsed && <span className="text-xs">Used</span>}
                </button>
              );
            })}
          </div>

          {/* No Gadget Option (disabled - timer handles timeout) */}
          <button
            onClick={() => onGadgetChoice(null)}
            disabled={true}
            className="w-full p-2 rounded-lg bg-gray-800 text-gray-500 cursor-not-allowed text-sm"
          >
            No Gadget - If timer runs out...
          </button>
        </div>
      }
    >
      <div className={`bg-black bg-opacity-80 rounded-lg p-8 text-white max-w-2xl mx-auto ${colorClass}`}>
        {/* Encounter Title */}
        <div className={`flex items-center gap-3 mb-4 ${urgencyClass}`}>
          <Skull size={40} className="text-red-500" />
          <div>
            <h2 className="text-3xl font-bold text-red-500">
              ASSASSINATION ATTEMPT!
            </h2>
            <p className="text-orange-400 text-sm font-bold">
              ⚠️ FINAL CITY - TIMER ACTIVE - CHOOSE FAST!
            </p>
          </div>
        </div>

        {/* Encounter Description */}
        <div className={`bg-red-900 bg-opacity-60 p-6 rounded-lg mb-6 border-2 ${
          timeLeft < 2 ? 'border-red-500 animate-pulse' : 'border-red-700'
        }`}>
          <h3 className="text-2xl font-bold text-yellow-400 mb-3">
            {encounter.name}
          </h3>
          <p className="text-yellow-100 text-xl font-bold">
            {encounter.description}
          </p>
          {timeLeft < 3 && (
            <p className="text-red-300 text-3xl font-bold mt-4 text-center animate-pulse">
              {timeLeft < 1 ? 'NOOOOOO!' : 'N...'}
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-orange-900 bg-opacity-50 p-4 rounded mb-4 border border-orange-500">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-400" />
            <p className="text-orange-200 text-sm font-bold">
              You have {timerDuration} seconds to choose! Wrong gadget = {wrongPenalty}h penalty. Timeout = {noPenalty}h penalty!
            </p>
          </div>
        </div>

        {/* Time Costs */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="bg-green-900 bg-opacity-50 p-2 rounded">
            <p className="text-green-400 font-bold">Correct</p>
            <p className="text-white">0h</p>
          </div>
          <div className="bg-orange-900 bg-opacity-50 p-2 rounded">
            <p className="text-orange-400 font-bold">Wrong</p>
            <p className="text-white">-{wrongPenalty}h</p>
          </div>
          <div className="bg-red-900 bg-opacity-50 p-2 rounded">
            <p className="text-red-400 font-bold">Timeout</p>
            <p className="text-white">-{noPenalty}h</p>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}

export default AssassinationAttempt;
