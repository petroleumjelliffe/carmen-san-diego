import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { EncounterCard } from './EncounterCard';
import { FadeIn } from './FadeIn';

function ClueButton({ spot, onInvestigate, disabled, investigated, index }) {
  return (
    <button
      onClick={() => onInvestigate(index)}
      disabled={disabled || investigated}
      className={`w-full p-4 min-h-[52px] text-left rounded-lg transition-all ${
        investigated
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-red-900 hover:bg-red-800 active:bg-red-700 text-yellow-100 cursor-pointer'
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
      className={`w-full p-4 min-h-[52px] text-left rounded-lg transition-all border-2 ${
        used
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700'
          : 'bg-orange-900 hover:bg-orange-800 active:bg-orange-700 text-yellow-100 cursor-pointer border-orange-500'
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

export function InvestigateTab({
  isFinalCity,
  wrongCity,
  cityClues,
  investigatedLocations,
  timeRemaining,
  collectedClues,
  lastFoundClue,
  lastRogueAction,
  lastSleepResult,
  rogueUsedInCity,
  currentGoodDeed,
  karma,
  onInvestigate,
  rogueActions,
  onRogueAction,
  notoriety,
  currentEncounter,
  availableGadgets,
  onEncounterResolve,
  isApprehended,
  selectedWarrant,
  onProceedToTrial,
  encounterTimers,
}) {
  if (!cityClues) return null;

  const ROGUE_TIME_COST = 2;

  // Pick any rogue action (just use first one for now)
  const availableRogueAction = rogueActions && rogueActions.length > 0 ? rogueActions[0] : null;

  // Determine if there's an active encounter (any type)
  const activeEncounter = currentEncounter || currentGoodDeed;
  const encounterType = currentEncounter?.type || (currentGoodDeed ? 'good_deed' : null);

  // Get timer duration based on encounter type
  const getTimerDuration = () => {
    if (currentEncounter?.type === 'assassination') {
      return currentEncounter.timer_duration || 5;
    }
    if (currentEncounter?.type === 'henchman') {
      return encounterTimers?.henchman_duration || 10;
    }
    if (currentGoodDeed) {
      return encounterTimers?.good_deed_duration || 8;
    }
    return 10;
  };

  // Check if we have any results to display (only clues, sleep, rogue - not encounters)
  const hasResults = lastFoundClue?.city || lastSleepResult || lastRogueAction;

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
      <FadeIn show={isApprehended}>
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
      </FadeIn>

      {!isApprehended && !isFinalCity && !wrongCity && (
        <div className="text-sm text-yellow-200/70 mb-4">
          Suspect clues collected: {collectedClues.suspect.length} / 3
          {collectedClues.suspect.length < 3 && " (check the Local Informant for suspect info)"}
        </div>
      )}

      {/* Unified Encounter Card - handles henchman, assassination, and good deed */}
      <FadeIn show={!!(activeEncounter && encounterType)}>
        <EncounterCard
          type={encounterType}
          encounter={activeEncounter}
          timerDuration={getTimerDuration()}
          availableGadgets={availableGadgets}
          karma={karma}
          timeRemaining={timeRemaining}
          onResolve={onEncounterResolve}
        />
      </FadeIn>

      {wrongCity && (
        <div className="bg-red-800/50 p-4 rounded-lg text-center mb-4">
          <p className="text-yellow-200/70">
            The trail seems cold here... but you can still ask around.
          </p>
        </div>
      )}

      {/* Results Area - Simplified flat card with accent strips */}
      <FadeIn show={hasResults}>
        <div className="bg-gray-900/80 rounded-lg overflow-hidden mb-6">
          {/* Sleep Result */}
          {lastSleepResult && (
            <div className="flex border-l-4 border-blue-500">
              <div className="p-4 flex-1">
                <div className="flex items-center gap-2 text-blue-300">
                  <span className="text-xl">💤</span>
                  <span className="font-bold">Rest Period</span>
                </div>
                <p className="text-yellow-100/80 text-sm mt-1">{lastSleepResult.message}</p>
              </div>
            </div>
          )}

          {/* Rogue Action Result */}
          {lastRogueAction && (
            <div className="flex border-l-4 border-orange-500">
              <div className="p-4 flex-1">
                <div className="flex items-center gap-2 text-orange-300">
                  <Zap size={16} />
                  <span className="font-bold">{lastRogueAction.name}</span>
                </div>
                <p className="text-yellow-100/80 text-sm mt-1 italic">{lastRogueAction.success_text}</p>
                <p className="text-red-400 text-xs mt-2">
                  <AlertTriangle size={10} className="inline mr-1" />
                  +{lastRogueAction.notoriety_gain} notoriety
                </p>
              </div>
            </div>
          )}

          {/* Investigation Result */}
          {lastFoundClue?.city && (
            <div className="flex border-l-4 border-green-500">
              <div className="p-4 flex-1">
                <p className="text-yellow-100/70 text-sm mb-2">📍 {lastFoundClue.city}</p>
                {lastFoundClue.suspect && (
                  <div>
                    <p className="text-green-400 font-bold text-sm">🔍 Suspect intel:</p>
                    <p className="text-green-300 mt-1">{lastFoundClue.suspect}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </FadeIn>

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
