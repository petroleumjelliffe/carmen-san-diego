import { Zap, AlertTriangle } from 'lucide-react';
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
          : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-yellow-100 cursor-pointer'
      }`}
    >
      <span>{investigated ? '✓ ' : ''}{spot.name}</span>
    </button>
  );
}

function RogueActionButton({ rogueAction, onRogueAction, disabled, used }) {
  return (
    <button
      onClick={() => onRogueAction(rogueAction)}
      disabled={disabled || used}
      className={`w-full p-4 min-h-[52px] text-left rounded-lg transition-all border-l-4 ${
        used
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600'
          : disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700'
          : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-yellow-100 cursor-pointer border-orange-500'
      }`}
    >
      <div className="flex items-center gap-2">
        <Zap size={16} className="text-orange-400" />
        <span className="font-bold">{used ? '✓ ' : ''}{rogueAction.name}</span>
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
  nextInvestigationCost,
  collectedClues,
  lastFoundClue,
  lastRogueAction,
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
  isInvestigating,
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

      {/* Investigation Results - single container, content swaps between investigating and results */}
      {(isInvestigating || lastFoundClue?.city || lastFoundClue?.suspect || lastRogueAction) && (
        <div className="bg-gray-900/80 rounded-lg overflow-hidden mb-6">
          {isInvestigating ? (
            <div className="p-4 border-l-4 border-yellow-400">
              <p className="text-yellow-100 italic animate-pulse">Investigating...</p>
            </div>
          ) : (
            <>
              {/* Rogue Action Result */}
              {lastRogueAction && (
                <div className="p-4 border-l-4 border-orange-500">
                  <p className="text-yellow-100 italic">"{lastRogueAction.success_text}"</p>
                  <p className="text-red-400 text-xs mt-2">
                    <AlertTriangle size={10} className="inline mr-1" />
                    +{lastRogueAction.notoriety_gain} notoriety
                  </p>
                </div>
              )}

              {/* Investigation Result - City clue */}
              {lastFoundClue?.city && (
                <div className="p-4 border-l-4 border-yellow-500">
                  <p className="text-yellow-100 italic">"{lastFoundClue.city}"</p>
                </div>
              )}

              {/* Investigation Result - Suspect clue */}
              {lastFoundClue?.suspect && (
                <div className="p-4 border-l-4 border-green-500">
                  <p className="text-yellow-100 italic">"{lastFoundClue.suspect}"</p>
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
            disabled={timeRemaining < nextInvestigationCost || isInvestigating}
            investigated={investigated}
          />
        );
      })}

      {/* Rogue Cop Tactic - 4th option */}
      {availableRogueAction && onRogueAction && (
        <RogueActionButton
          rogueAction={availableRogueAction}
          onRogueAction={onRogueAction}
          disabled={timeRemaining < ROGUE_TIME_COST || isInvestigating}
          used={rogueUsedInCity}
        />
      )}
    </div>
  );
}

export default InvestigateTab;
