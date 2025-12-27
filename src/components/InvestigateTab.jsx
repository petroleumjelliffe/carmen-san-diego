import { useState, useEffect } from 'react';
import { Clock, Zap, AlertTriangle, Heart, X, Skull } from 'lucide-react';

function ClueButton({ spot, onInvestigate, disabled, investigated, index }) {
  return (
    <button
      onClick={() => onInvestigate(index)}
      disabled={disabled || investigated}
      className={`w-full p-4 text-left rounded-lg transition-all ${
        investigated
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-red-900 hover:bg-red-800 text-yellow-100 cursor-pointer'
      }`}
    >
      <div className="flex justify-between items-center">
        <span>{investigated ? `✓ ${spot.name}` : spot.name}</span>
        <span className="flex items-center gap-1 text-sm">
          <Clock size={14} />
          {spot.time_cost}h
        </span>
      </div>
    </button>
  );
}

function RogueActionButton({ rogueAction, onRogueAction, disabled, used }) {
  const ROGUE_TIME_COST = 2; // Fixed 2h - fastest option

  return (
    <button
      onClick={() => onRogueAction(rogueAction)}
      disabled={disabled || used}
      className={`w-full p-4 text-left rounded-lg transition-all border-2 ${
        used
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700'
          : 'bg-orange-900 hover:bg-orange-800 text-yellow-100 cursor-pointer border-orange-500'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-orange-400" />
          <span className="font-bold">{used ? `✓ ${rogueAction.name}` : rogueAction.name}</span>
          <span className="text-xs text-green-300">⚡ Get BOTH clues!</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            {ROGUE_TIME_COST}h
          </div>
          <div className="flex items-center gap-1 text-xs text-red-300">
            <AlertTriangle size={12} />
            +{rogueAction.notoriety_gain}
          </div>
        </div>
      </div>
    </button>
  );
}

function InlineHenchmanEncounter({ encounter, availableGadgets, timeRemaining, onGadgetChoice, timerDuration }) {
  const [timeLeft, setTimeLeft] = useState(timerDuration || 10);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!encounter || hasTimedOut) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setHasTimedOut(true);
          clearInterval(interval);
          // Auto-resolve with no gadget (worst penalty)
          setTimeout(() => onGadgetChoice(null), 500);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [encounter, hasTimedOut, onGadgetChoice]);

  const wrongPenalty = encounter.time_penalty_wrong || 4;
  const noPenalty = encounter.time_penalty_none || 6;
  const timerPercent = (timeLeft / (timerDuration || 10)) * 100;
  const urgencyClass = timeLeft < 3 ? 'animate-pulse' : '';

  return (
    <div className={`bg-orange-900/50 border-2 border-orange-500 p-4 rounded-lg mb-4 ${urgencyClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={24} className="text-orange-400" />
        <div>
          <h3 className="text-xl font-bold text-orange-400">HENCHMAN ENCOUNTER</h3>
          <p className="text-green-400 text-sm">"You're on the right track..." - They're trying to stop you!</p>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="bg-gray-800 rounded-full h-4 overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-100 flex items-center justify-center ${
            timeLeft < 3 ? 'bg-red-600 animate-pulse' : timeLeft < 6 ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${timerPercent}%` }}
        >
          <span className="text-white font-bold text-xs">
            {hasTimedOut ? "TIME'S UP!" : `${timeLeft.toFixed(1)}s`}
          </span>
        </div>
      </div>

      <div className="bg-black bg-opacity-40 p-3 rounded mb-3">
        <p className="text-yellow-400 font-bold mb-1">{encounter.name}</p>
        <p className="text-yellow-100">{encounter.description}</p>
      </div>

      <div className="bg-blue-900/40 p-2 rounded mb-3 text-sm">
        <p className="text-blue-200">
          💡 <span className="font-bold">Think carefully:</span> Correct gadget = <span className="text-green-400">0h</span>, Wrong = <span className="text-orange-400">-{wrongPenalty}h</span>, Timeout = <span className="text-red-400">-{noPenalty}h</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {availableGadgets?.map((gadget) => (
          <button
            key={gadget.id}
            onClick={() => onGadgetChoice(gadget.id)}
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
        No Gadget - If timer runs out... (-{noPenalty}h)
      </button>
    </div>
  );
}

function InlineGoodDeed({ goodDeed, timeRemaining, karma, onChoice, timerDuration }) {
  const [timeLeft, setTimeLeft] = useState(timerDuration || 8);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!goodDeed || hasTimedOut) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setHasTimedOut(true);
          clearInterval(interval);
          // Auto-skip (decline to help)
          setTimeout(() => onChoice(false), 500);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [goodDeed, hasTimedOut, onChoice]);

  const timerPercent = (timeLeft / (timerDuration || 8)) * 100;
  const urgencyClass = timeLeft < 2 ? 'animate-pulse' : '';

  return (
    <div className={`bg-blue-900/50 border-2 border-blue-400 p-4 rounded-lg mb-4 ${urgencyClass}`}>
      <div className="flex items-center gap-2 mb-3">
        {goodDeed.isFake ? (
          <AlertTriangle size={24} className="text-red-400" />
        ) : (
          <Heart size={24} className="text-yellow-400" />
        )}
        <div>
          <h3 className="text-xl font-bold text-yellow-400">
            {goodDeed.isFake ? '❗ URGENT SITUATION' : '💡 GOOD DEED OPPORTUNITY'}
          </h3>
          <p className="text-blue-300 text-sm">Quick decision needed!</p>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="bg-gray-800 rounded-full h-4 overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-100 flex items-center justify-center ${
            timeLeft < 2 ? 'bg-red-600 animate-pulse' : timeLeft < 4 ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${timerPercent}%` }}
        >
          <span className="text-white font-bold text-xs">
            {hasTimedOut ? "TOO LATE!" : `${timeLeft.toFixed(1)}s`}
          </span>
        </div>
      </div>

      <div className="bg-black bg-opacity-40 p-3 rounded mb-3">
        <p className="text-yellow-100 mb-2">{goodDeed.description}</p>
        {goodDeed.plea && (
          <p className="text-yellow-300 italic border-l-4 border-yellow-500 pl-3">
            "{goodDeed.plea}"
          </p>
        )}
      </div>

      {/* Paranoia warning */}
      {karma >= 1 && !goodDeed.isFake && (
        <div className="bg-red-800/50 border border-red-400 p-2 rounded mb-3">
          <p className="text-red-200 text-sm flex items-center gap-2">
            <AlertTriangle size={14} />
            <span>Is this one real? Or another trap? You can't tell...</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onChoice(true)}
          disabled={timeRemaining < (goodDeed.time_cost || 3) || hasTimedOut}
          className={`text-white font-bold py-3 px-4 rounded-lg transition-all flex flex-col items-center gap-1 ${
            timeRemaining < (goodDeed.time_cost || 3) || hasTimedOut
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-green-700 hover:bg-green-600'
          }`}
        >
          <Heart size={20} />
          <span>HELP</span>
          <span className="text-xs">Costs {goodDeed.time_cost || 3}h, +1 karma</span>
        </button>

        <button
          disabled={hasTimedOut}
          className="bg-gray-700 text-gray-400 cursor-not-allowed font-bold py-3 px-4 rounded-lg transition-all flex flex-col items-center gap-1"
        >
          <X size={20} />
          <span>KEEP MOVING</span>
          <span className="text-xs">Timer runs out = skip</span>
        </button>
      </div>
    </div>
  );
}

function InlineAssassinationAttempt({ encounter, availableGadgets, timeRemaining, onGadgetChoice }) {
  const [timeLeft, setTimeLeft] = useState(encounter?.timer_duration || 5);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!encounter || hasTimedOut) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setHasTimedOut(true);
          clearInterval(interval);
          setTimeout(() => onGadgetChoice(null), 500);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [encounter, hasTimedOut, onGadgetChoice]);

  const wrongPenalty = encounter.time_penalty_wrong || 6;
  const noPenalty = encounter.time_penalty_none || 8;
  const timerDuration = encounter.timer_duration || 5;
  const timerPercent = (timeLeft / timerDuration) * 100;
  const urgencyClass = timeLeft < 2 ? 'animate-pulse' : '';

  return (
    <div className={`bg-red-900/60 border-2 border-red-500 p-4 rounded-lg mb-4 ${urgencyClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <Skull size={28} className="text-red-500" />
        <div>
          <h3 className="text-2xl font-bold text-red-500">ASSASSINATION ATTEMPT!</h3>
          <p className="text-orange-400 text-sm font-bold">⚠️ TIMER ACTIVE - CHOOSE FAST!</p>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="bg-gray-800 rounded-full h-5 overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-100 flex items-center justify-center ${
            timeLeft < 2 ? 'bg-red-600 animate-pulse' : timeLeft < 4 ? 'bg-orange-500' : 'bg-blue-500'
          }`}
          style={{ width: `${timerPercent}%` }}
        >
          <span className="text-white font-bold text-sm">
            {hasTimedOut ? "TIME'S UP!" : `${timeLeft.toFixed(1)}s`}
          </span>
        </div>
      </div>

      <div className="bg-black bg-opacity-50 p-3 rounded mb-3">
        <p className="text-yellow-400 font-bold mb-1">{encounter.name}</p>
        <p className="text-yellow-100 text-lg">{encounter.description}</p>
        {timeLeft < 3 && (
          <p className="text-red-300 text-2xl font-bold mt-2 text-center animate-pulse">
            {timeLeft < 1 ? 'NOOOOOO!' : 'N...'}
          </p>
        )}
      </div>

      <div className="bg-orange-900/50 p-2 rounded mb-3 text-sm border border-orange-500">
        <p className="text-orange-200">
          <AlertTriangle size={14} className="inline mr-1" />
          {timerDuration}s to choose! Wrong = <span className="text-orange-400">-{wrongPenalty}h</span>, Timeout = <span className="text-red-400">-{noPenalty}h</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {availableGadgets?.map((gadget) => (
          <button
            key={gadget.id}
            onClick={() => onGadgetChoice(gadget.id)}
            disabled={gadget.used || timeRemaining < wrongPenalty || hasTimedOut}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              gadget.used
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : timeRemaining < wrongPenalty || hasTimedOut
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer transform hover:scale-105'
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
        No Gadget - If timer runs out...
      </button>
    </div>
  );
}

export function InvestigateTab({
  isFinalCity,
  wrongCity,
  cityClues,
  investigatedLocations,
  timeRemaining,
  collectedClues,
  lastFoundClue,
  lastRogueAction,
  lastGoodDeedResult,
  lastSleepResult,
  lastEncounterResult,
  rogueUsedInCity,
  currentGoodDeed,
  karma,
  onInvestigate,
  rogueActions,
  onRogueAction,
  onGoodDeedChoice,
  notoriety,
  currentEncounter,
  availableGadgets,
  onHenchmanGadget,
  onAssassinationGadget,
  isApprehended,
  selectedWarrant,
  onProceedToTrial,
  encounterTimers,
}) {
  if (!cityClues) return null;

  const ROGUE_TIME_COST = 2;

  // Pick any rogue action (just use first one for now)
  const availableRogueAction = rogueActions && rogueActions.length > 0 ? rogueActions[0] : null;

  // Check if we have any results to display
  const hasResults = lastFoundClue?.city || lastGoodDeedResult || lastSleepResult || lastEncounterResult;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-yellow-400 mb-2">
        {isFinalCity && !wrongCity
          ? "FINAL DESTINATION - Issue Warrant to Capture!"
          : wrongCity
          ? "Dead End - Wrong Location"
          : "Gather Intel"}
      </h2>

      {/* Apprehended - Shows inline with Continue button */}
      {isApprehended && (
        <div className="bg-green-900/50 border-2 border-green-400 p-6 rounded-lg text-center">
          <div className="text-5xl mb-3">🚔</div>
          <h3 className="text-2xl font-bold text-green-400 mb-2">SUSPECT APPREHENDED!</h3>
          <p className="text-yellow-100 text-lg mb-2">
            {selectedWarrant?.name} is now in custody.
          </p>
          <p className="text-yellow-200/70 mb-4">
            Time to face the court and see if you got the right person...
          </p>
          <button
            onClick={onProceedToTrial}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-lg text-lg transition-all"
          >
            Continue to Trial
          </button>
        </div>
      )}

      {!isApprehended && !isFinalCity && !wrongCity && (
        <div className="text-sm text-yellow-200/70 mb-4">
          Suspect clues collected: {collectedClues.suspect.length} / 3
          {collectedClues.suspect.length < 3 && " (check the Local Informant for suspect info)"}
        </div>
      )}

      {/* Henchman Encounter - Appears inline after first investigation in correct non-final city */}
      {currentEncounter && currentEncounter.type === 'henchman' && (
        <InlineHenchmanEncounter
          encounter={currentEncounter}
          availableGadgets={availableGadgets}
          timeRemaining={timeRemaining}
          onGadgetChoice={onHenchmanGadget}
          timerDuration={encounterTimers?.henchman_duration || 10}
        />
      )}

      {/* Assassination Attempt - Appears inline at final city */}
      {currentEncounter && currentEncounter.type === 'assassination' && (
        <InlineAssassinationAttempt
          encounter={currentEncounter}
          availableGadgets={availableGadgets}
          timeRemaining={timeRemaining}
          onGadgetChoice={onAssassinationGadget}
        />
      )}

      {/* Good Deed Encounter - Appears inline with timer */}
      {currentGoodDeed && onGoodDeedChoice && (
        <InlineGoodDeed
          goodDeed={currentGoodDeed}
          timeRemaining={timeRemaining}
          karma={karma}
          onChoice={onGoodDeedChoice}
          timerDuration={encounterTimers?.good_deed_duration || 8}
        />
      )}

      {wrongCity && (
        <div className="bg-red-800/50 p-4 rounded-lg text-center mb-4">
          <p className="text-yellow-200/70">
            The trail seems cold here... but you can still ask around.
          </p>
        </div>
      )}

      {/* Results Area - Shows investigation results, good deed outcomes, etc. */}
      {hasResults && (
        <div className="bg-red-950/50 p-4 rounded-lg border border-yellow-400/30 mb-6">
          <h3 className="text-yellow-400 font-bold mb-3">Latest Activity:</h3>

          {/* Good Deed Result */}
          {lastGoodDeedResult && (
            <div className={`border p-3 rounded mb-3 ${
              lastGoodDeedResult.isTrap
                ? 'bg-red-900/50 border-red-400'
                : 'bg-blue-900/50 border-blue-400'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {lastGoodDeedResult.isTrap ? (
                  <AlertTriangle size={16} className="text-red-400" />
                ) : (
                  '❤️'
                )}
                <p className={`font-bold ${
                  lastGoodDeedResult.isTrap ? 'text-red-300' : 'text-blue-300'
                }`}>
                  {lastGoodDeedResult.title}
                </p>
              </div>
              <p className={`text-sm ${
                lastGoodDeedResult.isTrap ? 'text-red-200' : 'text-blue-200'
              }`}>
                {lastGoodDeedResult.message}
              </p>
            </div>
          )}

          {/* Sleep Result */}
          {lastSleepResult && (
            <div className="bg-blue-900/50 border border-blue-400 p-3 rounded mb-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💤</span>
                <p className="text-blue-300 font-bold">Rest Period</p>
              </div>
              <p className="text-blue-200 text-sm">{lastSleepResult.message}</p>
            </div>
          )}

          {/* Encounter Result (Henchman or Assassination) */}
          {lastEncounterResult && (
            <div className={`border p-3 rounded mb-3 ${
              lastEncounterResult.outcome === 'success'
                ? 'bg-green-900/50 border-green-400'
                : lastEncounterResult.outcome === 'wrong_gadget'
                ? 'bg-orange-900/50 border-orange-500'
                : 'bg-red-900/50 border-red-400'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {lastEncounterResult.type === 'assassination' ? (
                  <Skull size={16} className={
                    lastEncounterResult.outcome === 'success' ? 'text-green-400' : 'text-red-400'
                  } />
                ) : (
                  <Zap size={16} className={
                    lastEncounterResult.outcome === 'success'
                      ? 'text-green-400'
                      : lastEncounterResult.outcome === 'wrong_gadget'
                      ? 'text-orange-400'
                      : 'text-red-400'
                  } />
                )}
                <p className={`font-bold ${
                  lastEncounterResult.outcome === 'success'
                    ? 'text-green-300'
                    : lastEncounterResult.outcome === 'wrong_gadget'
                    ? 'text-orange-300'
                    : 'text-red-300'
                }`}>
                  {lastEncounterResult.type === 'assassination' ? 'Assassination Attempt' : 'Henchman Encounter'}: {lastEncounterResult.name}
                </p>
              </div>
              <p className={`text-sm ${
                lastEncounterResult.outcome === 'success'
                  ? 'text-green-200'
                  : lastEncounterResult.outcome === 'wrong_gadget'
                  ? 'text-orange-200'
                  : 'text-red-200'
              }`}>
                {lastEncounterResult.message}
              </p>
              {lastEncounterResult.timeLost > 0 && (
                <p className="text-red-300 text-xs mt-2 flex items-center gap-1">
                  <Clock size={12} />
                  Lost {lastEncounterResult.timeLost} hours
                </p>
              )}
            </div>
          )}

          {/* Rogue Action Result */}
          {lastRogueAction && !lastGoodDeedResult && (
            <div className="bg-orange-900/50 border border-orange-500 p-3 rounded mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-orange-400" />
                <p className="text-orange-300 font-bold">{lastRogueAction.name}</p>
              </div>
              <p className="text-orange-200 text-sm italic">
                {lastRogueAction.success_text}
              </p>
              <p className="text-red-300 text-xs mt-2">
                <AlertTriangle size={12} className="inline mr-1" />
                Notoriety increased by {lastRogueAction.notoriety_gain}
              </p>
            </div>
          )}

          {/* Investigation Results */}
          {lastFoundClue?.city && (
            <>
              <p className="text-yellow-100 mb-3">
                {String.fromCodePoint(0x1F4CD)} {lastFoundClue.city}
              </p>
              {lastFoundClue.suspect && (
                <div className="bg-green-900/50 border border-green-500 p-3 rounded">
                  <p className="text-green-400 font-bold">
                    {String.fromCodePoint(0x1F50D)} SUSPECT DESCRIPTION FOUND!
                  </p>
                  <p className="text-green-300 mt-1">
                    {lastFoundClue.suspect}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Investigation Spots - Normal 3 options */}
      {cityClues.map((clue, i) => {
        const investigated = investigatedLocations.includes(clue.spot.id);

        return (
          <ClueButton
            key={clue.spot.id}
            spot={clue.spot}
            index={i}
            onInvestigate={onInvestigate}
            disabled={timeRemaining < clue.spot.time_cost}
            investigated={investigated}
          />
        );
      })}

      {/* Rogue Cop Tactic - 4th option */}
      {availableRogueAction && onRogueAction && (
        <RogueActionButton
          rogueAction={availableRogueAction}
          onRogueAction={onRogueAction}
          disabled={timeRemaining < ROGUE_TIME_COST}
          used={rogueUsedInCity}
        />
      )}
    </div>
  );
}

export default InvestigateTab;
