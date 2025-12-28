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

  // Render active phase - simplified structure
  if (phase === 'active') {
    return (
      <div className={`rounded-lg overflow-hidden mb-4 ${urgencyLevel === 'critical' ? 'animate-pulse' : ''}`}>
        {/* Integrated timer bar at top */}
        <div className="relative h-2 bg-gray-800">
          <div
            className={`h-full transition-all duration-100 ${styles.timerColor}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Main content area */}
        <div className={styles.container}>
          {/* Header - simplified */}
          <div className="flex items-center gap-3 mb-4">
            {styles.icon}
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${styles.titleColor}`}>{styles.title}</h3>
              {type !== 'good_deed' && encounter?.name && (
                <p className="text-yellow-400 text-sm">{encounter.name}</p>
              )}
            </div>
            <span className="text-white font-mono text-lg">
              {hasTimedOut ? '0.0' : timeLeft.toFixed(1)}s
            </span>
          </div>

          {/* Description - no wrapper box */}
          <p className="text-yellow-100 mb-4">{encounter?.description}</p>

          {/* Plea quote for good deeds */}
          {type === 'good_deed' && encounter?.plea && (
            <p className="text-yellow-300 italic border-l-2 border-yellow-500 pl-3 mb-4">
              "{encounter.plea}"
            </p>
          )}

          {/* Paranoia warning - simplified */}
          {type === 'good_deed' && karma >= 1 && !isFakeGoodDeed && (
            <p className="text-red-300 text-sm mb-4 flex items-center gap-2">
              <AlertTriangle size={14} />
              Could be a trap...
            </p>
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
      </div>
    );
  }

  // Render resolved phase - simplified
  const isSuccess = result?.outcome === 'success' || result?.outcome === 'helped';
  const accentColor = isSuccess ? 'border-green-500' : result?.outcome === 'trap' ? 'border-red-500' : 'border-orange-500';

  return (
    <div className="bg-gray-900/80 rounded-lg overflow-hidden mb-4">
      {/* Accent bar */}
      <div className={`h-1 ${isSuccess ? 'bg-green-500' : result?.outcome === 'trap' ? 'bg-red-500' : 'bg-orange-500'}`} />

      <div className="p-4">
        {/* Result header */}
        <div className="flex items-center gap-3 mb-3">
          {getResultIcon(result)}
          <h3 className={`text-lg font-bold ${getResultColor(result)}`}>
            {getResultTitle(result)}
          </h3>
        </div>

        {/* Result message */}
        <p className="text-yellow-100 mb-3">{result?.message}</p>

        {/* Stats row */}
        <div className="flex gap-4 text-sm mb-4">
          {result?.timeLost > 0 && (
            <span className="text-red-400 flex items-center gap-1">
              <Clock size={12} /> -{result.timeLost}h
            </span>
          )}
          {result?.karmaGain > 0 && (
            <span className="text-green-400 flex items-center gap-1">
              <Heart size={12} /> +{result.karmaGain}
            </span>
          )}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className={`w-full font-bold py-3 rounded transition-colors ${
            isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
          } text-white`}
        >
          CONTINUE
        </button>
      </div>
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
    <button
      onClick={() => onChoice(true)}
      disabled={timeRemaining < timeCost || hasTimedOut}
      className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
        timeRemaining < timeCost || hasTimedOut
          ? 'bg-gray-700 cursor-not-allowed'
          : 'bg-green-700 hover:bg-green-600'
      }`}
    >
      <Heart size={20} />
      <span>HELP ({timeCost}h)</span>
    </button>
  );
}

// Helper functions for styling - simplified, consistent backgrounds
function getEncounterStyles(type, isFake, urgencyLevel) {
  const timerColors = {
    critical: 'bg-red-500',
    warning: 'bg-orange-500',
    normal: 'bg-green-500',
  };

  // All encounters use same dark container, differentiated by accent color and icon
  const baseContainer = 'bg-gray-900/90 p-4';

  if (type === 'assassination') {
    return {
      container: baseContainer,
      icon: <Skull size={24} className="text-red-500" />,
      title: 'ASSASSINATION ATTEMPT',
      titleColor: 'text-red-400',
      timerColor: timerColors[urgencyLevel],
    };
  }

  if (type === 'henchman') {
    return {
      container: baseContainer,
      icon: <Zap size={24} className="text-orange-400" />,
      title: 'HENCHMAN ENCOUNTER',
      titleColor: 'text-orange-400',
      timerColor: timerColors[urgencyLevel],
    };
  }

  // Good deed (real or fake - player can't tell)
  return {
    container: baseContainer,
    icon: <Heart size={24} className="text-yellow-400" />,
    title: 'SOMEONE NEEDS HELP',
    titleColor: 'text-yellow-400',
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

export default EncounterCard;
