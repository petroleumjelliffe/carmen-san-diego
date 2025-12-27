import { useState, useCallback } from 'react';
import { Zap, Skull, Heart, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useEncounterTimer } from '../hooks/useEncounterTimer';

/**
 * Unified encounter card component for henchman, assassination, and good deed encounters.
 * Displays timer, content, actions, and results all in-place.
 */
export function EncounterCard({
  type, // 'henchman' | 'assassination' | 'good_deed'
  encounter, // Encounter data object
  timerDuration,
  availableGadgets, // For gadget-based encounters
  karma, // For good deed paranoia warning
  timeRemaining, // Game hours remaining (for disable logic)
  onResolve, // Called with result when player clicks Continue
}) {
  const [phase, setPhase] = useState('active'); // 'active' | 'resolved'
  const [result, setResult] = useState(null);

  // Determine if this is a fake good deed
  const isFakeGoodDeed = type === 'good_deed' && encounter?.isFake;

  // Get penalties from encounter data
  const wrongPenalty = encounter?.time_penalty_wrong || 4;
  const noPenalty = encounter?.time_penalty_none || (type === 'assassination' ? 8 : 6);
  const goodDeedTimeCost = encounter?.time_cost || 3;

  // Handle timeout
  const handleTimeout = useCallback(() => {
    if (phase !== 'active') return;

    let newResult;
    if (type === 'good_deed') {
      // Good deed timeout = skip (no help)
      newResult = {
        type: 'good_deed',
        outcome: 'skipped',
        helped: false,
        message: "You didn't have time to help.",
        timeLost: 0,
      };
    } else {
      // Gadget encounter timeout
      newResult = {
        type,
        outcome: 'timeout',
        gadgetId: null,
        message: encounter?.timeout_text || encounter?.no_gadget_text || 'Time ran out!',
        timeLost: noPenalty,
      };
    }
    setResult(newResult);
    setPhase('resolved');
  }, [phase, type, encounter, noPenalty]);

  const { timeLeft, hasTimedOut, timerPercent, urgencyLevel } = useEncounterTimer(
    timerDuration,
    handleTimeout,
    phase === 'active'
  );

  // Handle gadget selection (henchman/assassination)
  const handleGadgetChoice = useCallback((gadgetId) => {
    if (phase !== 'active' || hasTimedOut) return;

    const isCorrect = gadgetId === encounter?.correct_gadget;
    const gadget = availableGadgets?.find(g => g.id === gadgetId);

    let newResult;
    if (isCorrect) {
      newResult = {
        type,
        outcome: 'success',
        gadgetId,
        message: encounter?.success_text || 'Perfect choice!',
        timeLost: 0,
      };
    } else {
      newResult = {
        type,
        outcome: 'wrong_gadget',
        gadgetId,
        message: encounter?.failure_text || 'Wrong gadget!',
        timeLost: wrongPenalty,
      };
    }

    setResult(newResult);
    setPhase('resolved');
  }, [phase, hasTimedOut, encounter, availableGadgets, type, wrongPenalty]);

  // Handle good deed choice
  const handleGoodDeedChoice = useCallback((helped) => {
    if (phase !== 'active' || hasTimedOut) return;

    let newResult;
    if (helped) {
      if (isFakeGoodDeed) {
        // It's a trap!
        newResult = {
          type: 'good_deed',
          outcome: 'trap',
          helped: true,
          message: encounter?.setup_reveal || "It was a trap!",
          timeLost: 8, // Traps always cost 8 hours
          isTrap: true,
          injuryChance: encounter?.injury_chance || 0.75,
        };
      } else {
        // Real good deed
        newResult = {
          type: 'good_deed',
          outcome: 'helped',
          helped: true,
          message: encounter?.gratitude || "Thank you for helping!",
          timeLost: goodDeedTimeCost,
          karmaGain: 1,
          npcName: encounter?.npc_name,
        };
      }
    } else {
      // Declined to help
      newResult = {
        type: 'good_deed',
        outcome: 'skipped',
        helped: false,
        message: "You kept moving. The mission comes first.",
        timeLost: 0,
      };
    }

    setResult(newResult);
    setPhase('resolved');
  }, [phase, hasTimedOut, isFakeGoodDeed, encounter, goodDeedTimeCost]);

  // Handle continue button (dismiss encounter)
  const handleContinue = useCallback(() => {
    onResolve(result);
  }, [onResolve, result]);

  // Styling based on type
  const styles = getEncounterStyles(type, isFakeGoodDeed, urgencyLevel);

  // Render active phase
  if (phase === 'active') {
    return (
      <div className={`${styles.container} ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {styles.icon}
          <div>
            <h3 className={`text-xl font-bold ${styles.titleColor}`}>{styles.title}</h3>
            <p className={`text-sm ${styles.subtitleColor}`}>{styles.subtitle}</p>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="bg-gray-800 rounded-full h-4 overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-100 flex items-center justify-center ${styles.timerColor}`}
            style={{ width: `${timerPercent}%` }}
          >
            <span className="text-white font-bold text-xs">
              {hasTimedOut ? "TIME'S UP!" : `${timeLeft.toFixed(1)}s`}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-black bg-opacity-40 p-3 rounded mb-3">
          {type !== 'good_deed' && (
            <p className="text-yellow-400 font-bold mb-1">{encounter?.name}</p>
          )}
          <p className="text-yellow-100">{encounter?.description}</p>
          {type === 'good_deed' && encounter?.plea && (
            <p className="text-yellow-300 italic border-l-4 border-yellow-500 pl-3 mt-2">
              "{encounter.plea}"
            </p>
          )}
        </div>

        {/* Paranoia warning for good deeds */}
        {type === 'good_deed' && karma >= 1 && !isFakeGoodDeed && (
          <div className="bg-red-800/50 border border-red-400 p-2 rounded mb-3">
            <p className="text-red-200 text-sm flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>Is this one real? Or another trap? You can't tell...</span>
            </p>
          </div>
        )}

        {/* Penalty info for gadget encounters */}
        {type !== 'good_deed' && (
          <div className="bg-blue-900/40 p-2 rounded mb-3 text-sm">
            <p className="text-blue-200">
              Correct = <span className="text-green-400">0h</span>,
              Wrong = <span className="text-orange-400">-{wrongPenalty}h</span>,
              Timeout = <span className="text-red-400">-{noPenalty}h</span>
            </p>
          </div>
        )}

        {/* NOOOO animation for assassination */}
        {type === 'assassination' && timeLeft < 3 && (
          <p className="text-red-300 text-2xl font-bold text-center animate-pulse mb-3">
            {timeLeft < 1 ? 'NOOOOOO!' : 'N...'}
          </p>
        )}

        {/* Action buttons */}
        {type === 'good_deed' ? (
          <GoodDeedButtons
            timeRemaining={timeRemaining}
            timeCost={goodDeedTimeCost}
            hasTimedOut={hasTimedOut}
            onChoice={handleGoodDeedChoice}
          />
        ) : (
          <GadgetButtons
            gadgets={availableGadgets}
            timeRemaining={timeRemaining}
            wrongPenalty={wrongPenalty}
            noPenalty={noPenalty}
            hasTimedOut={hasTimedOut}
            onChoice={handleGadgetChoice}
          />
        )}
      </div>
    );
  }

  // Render resolved phase (result in-place)
  return (
    <div className={styles.container}>
      {/* Result header */}
      <div className="flex items-center gap-2 mb-3">
        {getResultIcon(result)}
        <h3 className={`text-xl font-bold ${getResultColor(result)}`}>
          {getResultTitle(result)}
        </h3>
      </div>

      {/* Result message */}
      <div className={`p-4 rounded mb-4 ${getResultBgColor(result)}`}>
        <p className="text-yellow-100">{result?.message}</p>
        {result?.timeLost > 0 && (
          <p className="text-red-300 text-sm mt-2 flex items-center gap-1">
            <Clock size={14} />
            Lost {result.timeLost} hours
          </p>
        )}
        {result?.karmaGain > 0 && (
          <p className="text-green-300 text-sm mt-2 flex items-center gap-1">
            <Heart size={14} />
            +{result.karmaGain} karma
          </p>
        )}
      </div>

      {/* Continue button */}
      <button
        onClick={handleContinue}
        className={`w-full font-bold py-3 px-6 rounded text-lg transition-colors ${
          result?.outcome === 'success' || result?.outcome === 'helped'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-600 hover:bg-gray-700 text-white'
        }`}
      >
        CONTINUE
      </button>
    </div>
  );
}

// Gadget selection grid
function GadgetButtons({ gadgets, timeRemaining, wrongPenalty, noPenalty, hasTimedOut, onChoice }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-2">
        {gadgets?.map((gadget) => (
          <button
            key={gadget.id}
            onClick={() => onChoice(gadget.id)}
            disabled={gadget.used || timeRemaining < wrongPenalty || hasTimedOut}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              gadget.used
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : timeRemaining < wrongPenalty || hasTimedOut
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer'
            }`}
          >
            <span className="text-xl">{gadget.icon}</span>
            <span className="text-xs font-bold">{gadget.name}</span>
            {gadget.used && <span className="text-xs">Used</span>}
          </button>
        ))}
      </div>
      <button
        disabled={true}
        className="w-full p-2 rounded-lg bg-gray-800 text-gray-500 cursor-not-allowed text-sm"
      >
        If timer runs out... (-{noPenalty}h)
      </button>
    </>
  );
}

// Good deed help/skip buttons
function GoodDeedButtons({ timeRemaining, timeCost, hasTimedOut, onChoice }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onChoice(true)}
        disabled={timeRemaining < timeCost || hasTimedOut}
        className={`text-white font-bold py-3 px-4 rounded-lg transition-all flex flex-col items-center gap-1 ${
          timeRemaining < timeCost || hasTimedOut
            ? 'bg-gray-700 cursor-not-allowed'
            : 'bg-green-700 hover:bg-green-600'
        }`}
      >
        <Heart size={20} />
        <span>HELP</span>
        <span className="text-xs">Costs {timeCost}h, +1 karma</span>
      </button>

      <button
        disabled={true}
        className="bg-gray-700 text-gray-400 cursor-not-allowed font-bold py-3 px-4 rounded-lg transition-all flex flex-col items-center gap-1"
      >
        <Clock size={20} />
        <span>SKIP</span>
        <span className="text-xs">Timer = auto-skip</span>
      </button>
    </div>
  );
}

// Helper functions for styling
function getEncounterStyles(type, isFake, urgencyLevel) {
  const timerColors = {
    critical: 'bg-red-600 animate-pulse',
    warning: 'bg-orange-500',
    normal: 'bg-blue-500',
  };

  if (type === 'assassination') {
    return {
      container: 'bg-red-900/60 border-2 border-red-500 p-4 rounded-lg mb-4',
      icon: <Skull size={28} className="text-red-500" />,
      title: 'ASSASSINATION ATTEMPT!',
      subtitle: 'TIMER ACTIVE - CHOOSE FAST!',
      titleColor: 'text-red-500',
      subtitleColor: 'text-orange-400 font-bold',
      timerColor: timerColors[urgencyLevel],
    };
  }

  if (type === 'henchman') {
    return {
      container: 'bg-orange-900/50 border-2 border-orange-500 p-4 rounded-lg mb-4',
      icon: <Zap size={24} className="text-orange-400" />,
      title: 'HENCHMAN ENCOUNTER',
      subtitle: '"You\'re on the right track..." - They\'re trying to stop you!',
      titleColor: 'text-orange-400',
      subtitleColor: 'text-green-400',
      timerColor: timerColors[urgencyLevel],
    };
  }

  // Good deed
  if (isFake) {
    return {
      container: 'bg-red-900/50 border-2 border-red-400 p-4 rounded-lg mb-4',
      icon: <AlertTriangle size={24} className="text-red-400" />,
      title: 'URGENT SITUATION',
      subtitle: 'Quick decision needed!',
      titleColor: 'text-yellow-400',
      subtitleColor: 'text-red-300',
      timerColor: timerColors[urgencyLevel],
    };
  }

  return {
    container: 'bg-blue-900/50 border-2 border-blue-400 p-4 rounded-lg mb-4',
    icon: <Heart size={24} className="text-yellow-400" />,
    title: 'GOOD DEED OPPORTUNITY',
    subtitle: 'Quick decision needed!',
    titleColor: 'text-yellow-400',
    subtitleColor: 'text-blue-300',
    timerColor: timerColors[urgencyLevel],
  };
}

function getResultIcon(result) {
  if (result?.outcome === 'success' || result?.outcome === 'helped') {
    return <CheckCircle size={24} className="text-green-400" />;
  }
  if (result?.outcome === 'trap') {
    return <AlertTriangle size={24} className="text-red-400" />;
  }
  return <XCircle size={24} className="text-orange-400" />;
}

function getResultColor(result) {
  if (result?.outcome === 'success' || result?.outcome === 'helped') {
    return 'text-green-400';
  }
  if (result?.outcome === 'trap') {
    return 'text-red-400';
  }
  return 'text-orange-400';
}

function getResultTitle(result) {
  if (result?.outcome === 'success') return 'SUCCESS!';
  if (result?.outcome === 'helped') return 'DEED DONE!';
  if (result?.outcome === 'trap') return 'IT WAS A TRAP!';
  if (result?.outcome === 'wrong_gadget') return 'WRONG GADGET!';
  if (result?.outcome === 'timeout') return 'TOO SLOW!';
  if (result?.outcome === 'skipped') return 'SKIPPED';
  return 'RESULT';
}

function getResultBgColor(result) {
  if (result?.outcome === 'success' || result?.outcome === 'helped') {
    return 'bg-green-900/50 border border-green-400';
  }
  if (result?.outcome === 'trap') {
    return 'bg-red-900/50 border border-red-400';
  }
  return 'bg-orange-900/50 border border-orange-400';
}

export default EncounterCard;
